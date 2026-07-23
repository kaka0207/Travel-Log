"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { FramedPhoto } from "@/components/framed-photo";
import { photosUpdateSchema } from "@/db/schema";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { ApertureSelector } from "../components/aperture-selector";
import { ShutterSpeedSelector } from "../components/shutter-speed-selector";
import { ISOSelector } from "../components/iso-selector";
import { ExposureCompensationSelector } from "../components/exposure-compensation-selector";
import { toast } from "sonner";

interface PhotoIdViewProps {
  id: string;
}

const MapboxComponent = dynamic(
  () => import("@/modules/mapbox/ui/components/map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full rounded-md border flex items-center justify-center bg-muted">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  }
);

const formSchema = photosUpdateSchema.extend({
  make: z.string().optional(),
  model: z.string().optional(),
  lensModel: z.string().optional(),
  focalLength: z.number().optional(),
  focalLength35mm: z.number().optional(),
  fNumber: z.number().optional(),
  iso: z.number().optional(),
  exposureTime: z.number().optional(),
  exposureCompensation: z.number().optional(),
});

export const PhotoIdView = ({ id }: PhotoIdViewProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(
    trpc.photos.getOne.queryOptions({
      id,
    })
  );

  const updateMutation = useMutation(
    trpc.photos.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.photos.getOne.queryOptions({ id })
        );
        await queryClient.invalidateQueries(
          trpc.photos.getMany.queryOptions({})
        );
        toast.success("照片已保存");
      },
      onError: (error) => {
        toast.error(error.message || "保存照片失败");
      },
    })
  );

  const [currentLocation, setCurrentLocation] = useState<{
    lat: number | null;
    lng: number | null;
  }>({
    lat: data.latitude ?? null,
    lng: data.longitude ?? null,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: data.id,
      title: data.title ?? "",
      description: data.description ?? "",
      visibility: data.visibility ?? "private",
      isFavorite: data.isFavorite ?? false,
      showCameraParameters: data.showCameraParameters ?? true,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
      dateTimeOriginal: data.dateTimeOriginal ?? undefined,
      country: data.country ?? undefined,
      countryCode: data.countryCode ?? undefined,
      region: data.region ?? undefined,
      city: data.city ?? undefined,
      district: data.district ?? undefined,
      fullAddress: data.fullAddress ?? undefined,
      placeFormatted: data.placeFormatted ?? undefined,
      make: data.make ?? undefined,
      model: data.model ?? undefined,
      lensModel: data.lensModel ?? undefined,
      focalLength: data.focalLength ?? undefined,
      focalLength35mm: data.focalLength35mm ?? undefined,
      fNumber: data.fNumber ?? undefined,
      iso: data.iso ?? undefined,
      exposureTime: data.exposureTime ?? undefined,
      exposureCompensation: data.exposureCompensation ?? undefined,
    },
  });

  const isSubmitting = updateMutation.isPending;

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateMutation.mutate({ ...values, id: data.id });
  }

  const takenAt = data.dateTimeOriginal
    ? format(new Date(data.dateTimeOriginal), "yyyy年M月d日", {
        locale: zhCN,
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {data.title || "未命名照片"}
            </h1>
            {takenAt && (
              <p className="text-sm text-muted-foreground">
                拍摄于 {takenAt}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)] items-start">
          {/* Form on the left */}
          <div className="bg-card border rounded-xl p-6 shadow-sm w-full">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>标题</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="输入照片标题" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>描述</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={5}
                          className="resize-none"
                          placeholder="输入照片描述"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateTimeOriginal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>拍摄时间</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ? format(new Date(field.value), "yyyy-MM-dd'T'HH:mm") : ""}
                          onChange={(event) => {
                            field.onChange(
                              event.target.value ? new Date(event.target.value) : undefined,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-between gap-2">
                        <div className="flex items-center justify-between gap-4">
                          <FormLabel>可见性</FormLabel>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {field.value === "public" ? "公开" : "私密"}
                            </span>
                            <FormControl>
                              <Switch
                                checked={field.value === "public"}
                                onCheckedChange={(checked) =>
                                  field.onChange(checked ? "public" : "private")
                                }
                              />
                            </FormControl>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFavorite"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between gap-4">
                        <FormLabel>收藏</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Camera parameters */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold">相机参数</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      有 EXIF 信息时会自动填充，也可以手动修改。
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="showCameraParameters"
                    render={({ field }) => (
                      <FormItem className="flex shrink-0 items-center gap-2 space-y-0">
                        <FormLabel className="text-xs text-muted-foreground">
                          显示照片下方水印
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                            aria-label="显示照片下方相机水印"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>相机品牌</FormLabel>
                          <FormControl><Input {...field} placeholder="例如：Canon" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>相机型号</FormLabel>
                          <FormControl><Input {...field} placeholder="例如：EOS R5" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="lensModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>镜头型号</FormLabel>
                        <FormControl><Input {...field} placeholder="例如：RF 24-70mm f/2.8L" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="focalLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>焦距（mm）</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              value={field.value ?? ""}
                              onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                              placeholder="50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="focalLength35mm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>35mm 等效焦距（mm）</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              value={field.value ?? ""}
                              onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                              placeholder="50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <FormField
                      control={form.control}
                      name="fNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>光圈</FormLabel>
                          <FormControl><ApertureSelector value={field.value} onChange={field.onChange} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exposureTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>快门速度</FormLabel>
                          <FormControl><ShutterSpeedSelector value={field.value} onChange={field.onChange} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="iso"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ISO</FormLabel>
                          <FormControl><ISOSelector value={field.value} onChange={field.onChange} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exposureCompensation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>EV</FormLabel>
                          <FormControl><ExposureCompensationSelector value={field.value} onChange={field.onChange} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                    <FormLabel>纬度</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numericValue =
                                value === "" ? undefined : Number(value);
                              field.onChange(numericValue);
                              setCurrentLocation((prev) => ({
                                lat:
                                  numericValue ??
                                  prev?.lat ??
                                  data.latitude ??
                                  null,
                                lng: prev?.lng ?? data.longitude ?? null,
                              }));
                            }}
                            placeholder="例如：37.7749"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                    <FormLabel>经度</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numericValue =
                                value === "" ? undefined : Number(value);
                              field.onChange(numericValue);
                              setCurrentLocation((prev) => ({
                                lat: prev?.lat ?? data.latitude ?? null,
                                lng:
                                  numericValue ??
                                  prev?.lng ??
                                  data.longitude ??
                                  null,
                              }));
                            }}
                            placeholder="例如：-122.4194"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "正在保存..." : "保存修改"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Photo + Map on the right */}
          <div className="space-y-4">
            <div className="flex items-center justify-center bg-gray-50 dark:bg-muted rounded-xl p-6">
              <FramedPhoto
                src={data.url}
                alt={data.title}
                blurhash={data.blurData}
                width={data.width}
                height={data.height}
                className="max-h-[50vh]"
              />
            </div>

            <div className="bg-card border rounded-xl p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium">位置</h2>
              </div>
              <div className="h-64 w-full rounded-md overflow-hidden border">
                <Suspense
                  fallback={
                    <div className="h-full w-full flex items-center justify-center bg-muted">
                      <Skeleton className="h-full w-full" />
                    </div>
                  }
                >
                  <MapboxComponent
                    draggableMarker
                    markers={
                      currentLocation?.lat != null &&
                      currentLocation?.lng != null
                        ? [
                            {
                              id: "photo-location",
                              longitude: currentLocation.lng,
                              latitude: currentLocation.lat,
                            },
                          ]
                        : []
                    }
                    initialViewState={{
                      longitude: currentLocation?.lng ?? 0,
                      latitude: currentLocation?.lat ?? 0,
                      zoom:
                        currentLocation?.lat != null &&
                        currentLocation?.lng != null
                          ? 10
                          : 2,
                    }}
                    onMarkerDragEnd={(markerId, lngLat) => {
                      setCurrentLocation({ lat: lngLat.lat, lng: lngLat.lng });
                      form.setValue("latitude", lngLat.lat);
                      form.setValue("longitude", lngLat.lng);
                    }}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
