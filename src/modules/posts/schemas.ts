import { z } from "zod";

export const postFormSchema = z.object({
  title: z.string().min(1, {
    message: "请输入标题",
  }),
  slug: z.string().min(1, {
    message: "缺少文章链接标识",
  }),
  content: z.string().optional(),
  visibility: z.enum(["public", "private"]),
  coverImage: z.string().optional(),
  tags: z.array(z.string()),
  description: z.string().optional(),
});
