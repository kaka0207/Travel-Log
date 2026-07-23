"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useTRPC } from "@/trpc/client";
const Mapbox = dynamic(() => import("@/modules/mapbox/ui/components/map"), { ssr: false });
import { useMemo } from "react";

import { TrendingUp } from "lucide-react";
import BlurImage from "@/components/blur-image";
import { keyToUrl } from "@/modules/s3/lib/key-to-url";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const MapView = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.dashboard.getVisitedCountriesWithGeoJson.queryOptions()
  );


  // Use real data from database
  const countriesData = useMemo(() => data?.countries || [], [data]);

  const chartData = countriesData.slice(0, 3).map((country) => ({
    country: country.country || "未知",
    countryShort: country.countryCode || "未知",
    photoCount: country.photoCount,
    photoUrls: country.photoUrls || [],
  }));

  return (
    <div className="w-full h-[600px] grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-xl overflow-hidden relative h-[400px] lg:h-full">
        {false && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-sm text-muted-foreground">
              正在加载世界地图数据...
            </div>
          </div>
        )}
        <Mapbox
          id="dashboardMap"
          showControls={false}
          scrollZoom={false}
          doubleClickZoom={false}
          boxZoom={false}
          initialViewState={{
            longitude: 0,
            latitude: 20,
            zoom: 2,
          }}
          geoJsonData={data?.geoJson || undefined}
        />
      </div>

      {/* Country Statistics Chart */}
      <div className="lg:col-span-1 h-full">
        {countriesData && countriesData.length > 0 && (
          <Card className="h-full flex flex-col p-4">
            <CardHeader className="shrink-0 p-0 pb-3">
              <CardTitle className="text-lg">国家照片统计</CardTitle>
              <CardDescription className="text-sm">
                照片数量最多的前 {chartData.length} 个国家
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-y-auto p-0 pr-1">
              <div className="space-y-5">
                {chartData.map((country) => (
                  <div
                    key={country.countryShort}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 shrink-0 text-sm font-medium text-muted-foreground">
                      {country.countryShort}
                    </div>
                    <div className="relative h-28 min-w-0 flex-1">
                      {country.photoUrls.length > 0 ? (
                        country.photoUrls.map((photo, index) => (
                          <div
                            key={`${photo.url}-${index}`}
                            className={`absolute left-1/2 top-1/2 h-20 w-28 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-md border-2 border-background bg-muted shadow-md transition-transform hover:scale-105 ${[
                              "-rotate-6 -translate-x-8",
                              "-rotate-2 -translate-x-3",
                              "rotate-3 translate-x-2",
                              "rotate-6 translate-x-7",
                            ][index] || ""}`}
                            style={{ zIndex: country.photoUrls.length - index }}
                          >
                            <BlurImage
                              src={keyToUrl(photo.url)}
                              alt={`${country.country} ${photo.title || "照片"}`}
                              fill
                              sizes="112px"
                              blurhash={photo.blurData}
                              className="object-cover"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                          暂无照片
                        </div>
                      )}
                    </div>
                    <div className="w-12 shrink-0 text-right text-xs text-muted-foreground">
                      {country.photoCount} 张
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="shrink-0 flex-col items-start gap-1 text-sm p-0 pt-3">
              <div className="flex gap-2 leading-none font-medium">
                已到访 {countriesData.length} 个国家{" "}
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-muted-foreground leading-none">
                合计：{" "}
                {countriesData
                  .reduce((sum, c) => sum + c.photoCount, 0)
                  .toLocaleString()}{" "}
                张照片
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};
