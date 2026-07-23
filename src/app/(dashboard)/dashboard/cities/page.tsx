import { Suspense } from "react";
import { trpc } from "@/trpc/server";
import { getQueryClient } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import {
  CityListView,
  CityListLoadingView,
  CityListErrorView,
} from "@/modules/cities/ui/views/city-list-view";

export const metadata = {
  title: "城市",
  description: "城市",
};

const CityPage = async () => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.city.getMany.queryOptions());

  return (
    <>
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-8">
        <div>
          <h1 className="text-2xl font-bold">城市</h1>
          <p className="text-muted-foreground ">
            按到访城市管理照片集合
          </p>
        </div>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <ErrorBoundary FallbackComponent={CityListErrorView}>
          <Suspense fallback={<CityListLoadingView />}>
            <CityListView />
          </Suspense>
        </ErrorBoundary>
      </HydrationBoundary>
    </>
  );
};

export default CityPage;
