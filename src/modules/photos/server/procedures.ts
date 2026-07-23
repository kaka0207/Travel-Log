import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, eq, desc, asc, sql, ilike, count } from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import {
  citySets,
  photos,
  photosUpdateSchema,
  photosInsertSchema,
} from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/modules/s3/lib/server-client";
import { deleteLocalUpload } from "@/modules/s3/lib/local-storage";

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

export const photosRouter = createTRPCRouter({
  create: protectedProcedure
    .input(photosInsertSchema)
    .mutation(async ({ ctx, input }) => {
      const normalizedCity =
        typeof input.city === "string" &&
        input.city.trim() &&
        input.city.trim().toLowerCase() !== "null"
          ? input.city.trim()
          : input.region || input.placeFormatted || input.fullAddress || null;
      const values = { ...input, city: normalizedCity };

      try {
        const [insertedPhoto] = await ctx.db
          .insert(photos)
          .values(values)
          .returning();

        const cityName = insertedPhoto.city;

        if (insertedPhoto.country && cityName && insertedPhoto.countryCode) {
          await ctx.db
            .insert(citySets)
            .values({
              country: insertedPhoto.country,
              countryCode: insertedPhoto.countryCode,
              city: cityName,
              photoCount: 1,
              coverPhotoId: insertedPhoto.id,
            })
            .onConflictDoUpdate({
              target: [citySets.country, citySets.city],
              set: {
                countryCode: insertedPhoto.countryCode,
                photoCount: sql`${citySets.photoCount} + 1`,
                coverPhotoId: sql`COALESCE(${citySets.coverPhotoId}, ${insertedPhoto.id})`,
                updatedAt: new Date(),
              },
            });
        }

        return insertedPhoto;
      } catch (error) {
        console.error("Photo creation error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "创建照片失败",
        });
      }
    }),
  remove: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      if (!id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      try {
        const [photo] = await ctx.db
          .select()
          .from(photos)
          .where(eq(photos.id, id));

        if (!photo) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "照片不存在",
          });
        }

        // city set related
        if (photo.country && photo.city) {
          const [citySet] = await ctx.db
            .select()
            .from(citySets)
            .where(
              and(
                eq(citySets.country, photo.country),
                eq(citySets.city, photo.city),
              ),
            );

          if (citySet) {
            if (citySet.photoCount === 1) {
              // last photo in city — delete the city set
              await ctx.db.delete(citySets).where(eq(citySets.id, citySet.id));
            } else {
              // find new cover photo if current cover is being deleted
              const newCoverPhotoId =
                citySet.coverPhotoId === photo.id
                  ? (
                      await ctx.db
                        .select({ id: photos.id })
                        .from(photos)
                        .where(
                          and(
                            eq(photos.country, photo.country),
                            eq(photos.city, photo.city),
                            sql`${photos.id} != ${photo.id}`,
                          ),
                        )
                        .limit(1)
                    )[0]?.id
                  : undefined;

              await ctx.db
                .update(citySets)
                .set({
                  photoCount: sql`${citySets.photoCount} - 1`,
                  ...(newCoverPhotoId ? { coverPhotoId: newCoverPhotoId } : {}),
                  updatedAt: new Date(),
                })
                .where(
                  and(
                    eq(citySets.country, photo.country),
                    eq(citySets.city, photo.city),
                  ),
                );
            }
          }
        }

        // delete photo record first, then S3
        await ctx.db.delete(photos).where(eq(photos.id, id));

        // Delete the file after DB — an orphan file is acceptable, inconsistent DB is not
        try {
          if (process.env.STORAGE_PROVIDER === "local") {
            await deleteLocalUpload(photo.url);
          } else {
            const command = new DeleteObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: photo.url,
            });
            await s3Client.send(command);
          }
        } catch (error) {
          console.error("S3 delete failed (orphan file):", error);
        }

        return photo;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Photo deletion error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "删除照片失败",
        });
      }
    }),
  update: protectedProcedure
    .input(photosUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      if (!id) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const [existingPhoto] = await ctx.db
        .select()
        .from(photos)
        .where(eq(photos.id, id));

      if (!existingPhoto) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const [updatedPhoto] = await ctx.db
        .update(photos)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(photos.id, id))
        .returning();

      if (!updatedPhoto) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const oldCityKey =
        existingPhoto.country && existingPhoto.city
          ? `${existingPhoto.country}\u0000${existingPhoto.city}`
          : null;
      const newCityKey =
        updatedPhoto.country && updatedPhoto.city
          ? `${updatedPhoto.country}\u0000${updatedPhoto.city}`
          : null;

      if (oldCityKey !== newCityKey) {
        if (existingPhoto.country && existingPhoto.city) {
          const [oldCitySet] = await ctx.db
            .select()
            .from(citySets)
            .where(
              and(
                eq(citySets.country, existingPhoto.country),
                eq(citySets.city, existingPhoto.city),
              ),
            );

          if (oldCitySet) {
            if (oldCitySet.photoCount <= 1) {
              await ctx.db.delete(citySets).where(eq(citySets.id, oldCitySet.id));
            } else {
              const newCoverPhotoId =
                oldCitySet.coverPhotoId === id
                  ? (
                      await ctx.db
                        .select({ id: photos.id })
                        .from(photos)
                        .where(
                          and(
                            eq(photos.country, existingPhoto.country),
                            eq(photos.city, existingPhoto.city),
                            sql`${photos.id} != ${id}`,
                          ),
                        )
                        .limit(1)
                    )[0]?.id
                  : undefined;

              await ctx.db
                .update(citySets)
                .set({
                  photoCount: sql`${citySets.photoCount} - 1`,
                  ...(newCoverPhotoId ? { coverPhotoId: newCoverPhotoId } : {}),
                  updatedAt: new Date(),
                })
                .where(eq(citySets.id, oldCitySet.id));
            }
          }
        }

        if (
          updatedPhoto.country &&
          updatedPhoto.countryCode &&
          updatedPhoto.city
        ) {
          await ctx.db
            .insert(citySets)
            .values({
              country: updatedPhoto.country,
              countryCode: updatedPhoto.countryCode,
              city: updatedPhoto.city,
              photoCount: 1,
              coverPhotoId: updatedPhoto.id,
            })
            .onConflictDoUpdate({
              target: [citySets.country, citySets.city],
              set: {
                countryCode: updatedPhoto.countryCode,
                photoCount: sql`${citySets.photoCount} + 1`,
                coverPhotoId: sql`COALESCE(${citySets.coverPhotoId}, ${updatedPhoto.id})`,
                updatedAt: new Date(),
              },
            });
        }
      } else if (
        updatedPhoto.country &&
        updatedPhoto.countryCode &&
        updatedPhoto.city &&
        existingPhoto.countryCode !== updatedPhoto.countryCode
      ) {
        await ctx.db
          .update(citySets)
          .set({ countryCode: updatedPhoto.countryCode, updatedAt: new Date() })
          .where(
            and(
              eq(citySets.country, updatedPhoto.country),
              eq(citySets.city, updatedPhoto.city),
            ),
          );
      }

      return updatedPhoto;
    }),
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const [photo] = await ctx.db
        .select()
        .from(photos)
        .where(eq(photos.id, id));

      return photo;
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        orderBy: z.enum(["asc", "desc"] as const).default("desc"),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, orderBy } = input;

      const data = await ctx.db
        .select()
        .from(photos)
        .where(
          search ? ilike(photos.title, `%${escapeLike(search)}%`) : undefined,
        )
        .orderBy(
          orderBy === "asc"
            ? asc(photos.dateTimeOriginal)
            : desc(photos.dateTimeOriginal),
        )
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await ctx.db
        .select({
          count: count(),
        })
        .from(photos)
        .where(
          search ? ilike(photos.title, `%${escapeLike(search)}%`) : undefined,
        );

      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),
});
