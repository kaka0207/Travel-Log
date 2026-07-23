"use client";

import { ColumnDef } from "@tanstack/react-table";
import { photoGetMany } from "../../types";
import { keyToUrl } from "@/modules/s3/lib/key-to-url";
import BlurImage from "@/components/blur-image";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { FavoriteToggle } from "./favorite-toggle";
import { VisibilityToggle } from "./visibility-toggle";
import { DeletePhotoButton } from "./delete-photo-button";
import Link from "next/link";
import { PenBoxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<photoGetMany[number]>[] = [
  {
    accessorKey: "url",
    header: "图片",
    cell: ({ row }) => {
      const url = row.original.url;
      const imageUrl = keyToUrl(url);

      return (
        <div className="w-16 h-16 overflow-hidden">
          <BlurImage
            src={imageUrl}
            alt={row.original.title}
            width={64}
            height={64}
            blurhash={row.original.blurData}
            className="w-16 h-16 object-cover"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "标题",
  },
  {
    accessorKey: "dateTimeOriginal",
    header: "拍摄时间",
    cell: ({ row }) => {
      const takenAt = row.original.dateTimeOriginal;
      if (!takenAt) return <span>-</span>;

      // Use date-fns for consistent formatting across SSR and client
      const formatted = format(new Date(takenAt), "yyyy年M月d日 HH:mm", {
        locale: zhCN,
      });

      return <span suppressHydrationWarning>{formatted}</span>;
    },
  },
  {
    accessorKey: "city",
    header: "城市",
    cell: ({ row }) => {
      const clean = (value: string | null | undefined) => {
        const normalized = value?.trim();
        return normalized && normalized.toLowerCase() !== "null"
          ? normalized
          : null;
      };

      const city = clean(row.original.city) ?? clean(row.original.region);
      const location =
        clean(row.original.placeFormatted) ||
        clean(row.original.fullAddress) ||
        [city, clean(row.original.countryCode)].filter(Boolean).join(" · ") ||
        clean(row.original.title) ||
        "未设置地点";
      return (
        <span className="block max-w-[360px] whitespace-normal break-words" title={location}>
          {location}
        </span>
      );
    },
  },
  {
    accessorKey: "isFavorite",
    header: "收藏",
    cell: ({ row }) => {
      return (
        <FavoriteToggle
          photoId={row.original.id}
          initialValue={row.original.isFavorite}
        />
      );
    },
  },
  {
    accessorKey: "visibility",
    header: "可见性",
    cell: ({ row }) => {
      return (
        <VisibilityToggle
          photoId={row.original.id}
          initialValue={row.original.visibility}
        />
      );
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <DeletePhotoButton
            photoId={row.original.id}
            photoTitle={row.original.title}
          />

          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/photos/${row.original.id}`}>
              <PenBoxIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      );
    },
  },
];
