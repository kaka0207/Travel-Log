"use client";

import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "@/hooks/use-confirm";

interface DeletePostButtonProps {
  postId: string;
  postTitle: string;
}

export function DeletePostButton({ postId, postTitle }: DeletePostButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [ConfirmDialog, confirm] = useConfirm(
    "删除文章",
    `确定要删除“${postTitle}”吗？此操作不可撤销，文章将被永久删除。`
  );

  const deletePost = useMutation(trpc.posts.remove.mutationOptions());

  const handleDelete = async () => {
    const ok = await confirm();

    if (!ok) return;

    deletePost.mutate(
      { id: postId },
      {
        onSuccess: async () => {
          // Invalidate queries to refetch posts list
          await queryClient.invalidateQueries(
            trpc.posts.getMany.queryOptions({})
          );
          toast.success("文章已删除");
        },
        onError: (error) => {
          toast.error(error.message || "删除文章失败");
        },
      }
    );
  };

  return (
    <>
      <ConfirmDialog />
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        title="删除文章"
      >
        <Trash2 className="size-4" />
      </Button>
    </>
  );
}
