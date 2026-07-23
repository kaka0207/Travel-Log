"use client";

import VectorCombined from "@/components/vector-combined";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownIcon } from "lucide-react";
import Image from "next/image";
import Footer from "@/components/footer";
import { keyToUrl } from "@/modules/s3/lib/key-to-url";
import RichTextViewer from "@/components/editor/rich-text-viewer";
import { format } from "date-fns/format";

export const BlogSlugView = ({ slug }: { slug: string }) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.blog.getOne.queryOptions({ slug }));
  const publishedAt = data.updatedAt
    ? format(new Date(data.updatedAt), "yyyy.MM.dd")
    : "";

  return (
    <div className="flex flex-col gap-3 lg:gap-0 lg:flex-row w-full">
      {/* LEFT CONTENT - Fixed */}
      <div className="w-full h-[50vh] lg:w-1/2 lg:fixed lg:top-0 lg:left-0 md:h-[80vh] lg:h-screen p-0 lg:p-3 group">
        <div className="block w-full h-full relative rounded-xl overflow-hidden">
          <Image
            src={keyToUrl(data.coverImage) || "/placeholder.svg"}
            alt="Image"
            fill
            quality={75}
            className="object-cover"
          />

          <div className="absolute right-0 bottom-0">
            <VectorCombined
              title={data.tags?.[0] || ""}
              position="bottom-right"
            />
          </div>
        </div>
      </div>

      {/* Spacer for fixed left content */}
      <div className="hidden lg:block lg:w-1/2" />

      {/* RIGHT CONTENT - Scrollable */}
      <div className="w-full lg:w-1/2 space-y-3 pb-3">
        {/* CONTENT  */}
        <div className="bg-muted rounded-xl p-10 md:p-12 md:h-[calc(100vh-24px)] flex flex-col">
          <div className="mb-10">
            <span className="bg-muted-hover rounded-sm py-1 px-2 text-xs text-text-muted font-light">
              {publishedAt}
            </span>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <h1 className="text-4xl">{data.title}</h1>
            <h2 className="font-light">{data.description}</h2>

            <div className="mt-8">
              <button className="bg-background hover:bg-muted duration-150 transition-all flex items-center gap-1 py-[10px] pr-3 pl-[14px] rounded-lg">
                <span className="text-sm font-light">阅读文章</span>{" "}
                <ArrowDownIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-muted rounded-xl p-5 w-full flex justify-between">
            <p className="text-text-muted">分类</p>
            <p>{data.tags?.[0] || "随笔"}</p>
          </div>

          <div className="bg-muted rounded-xl p-5 w-full flex justify-between">
            <p className="text-text-muted">阅读时间</p>
            <p>{data.readingTimeMinutes} 分钟</p>
          </div>

          <div className="bg-muted rounded-xl p-5 w-full flex justify-between">
            <p className="text-text-muted">日期</p>
            <p>{publishedAt}</p>
          </div>
        </div>

        {/* POST PREVIEW */}
        <RichTextViewer content={data.content || ""} />

        {/* FOOTER  */}
        <Footer />
      </div>
    </div>
  );
};
