import { z } from "zod";
import { TExifData, TImageInfo } from "@/modules/photos/lib/utils";

// ============================================================================
// FORM SCHEMAS
// ============================================================================

export const firstStepSchema = z.object({
  url: z
    .string()
    .min(1, { message: "请先上传照片" }),
});

export type FirstStepData = z.infer<typeof firstStepSchema>;

export const secondStepSchema = z.object({
  title: z.string().min(1, { message: "请输入标题" }),
  description: z.string().min(1, { message: "请输入描述" }),
  visibility: z.enum(["private", "public"]).default("private"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  gpsAltitude: z.number().optional(),
  dateTimeOriginal: z.date().optional(),
  isFavorite: z.boolean().default(false),
  showCameraParameters: z.boolean().default(true),
  // Camera parameters
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

export type SecondStepData = z.infer<typeof secondStepSchema>;

export const thirdStepSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type ThirdStepData = z.infer<typeof thirdStepSchema>;

export const fourthStepSchema = z.object({});

export type FourthStepData = z.infer<typeof fourthStepSchema>;

// Combined schema for type inference (exported for use in components)
export const formSchema = z.object({
  ...firstStepSchema.shape,
  ...secondStepSchema.shape,
  ...thirdStepSchema.shape,
  ...fourthStepSchema.shape,
  exif: z.custom<TExifData | null>().optional(),
  imageInfo: z.custom<TImageInfo>().optional(),
});

export type PhotoFormData = z.infer<typeof formSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface StepProps {
  onNext: (data: Partial<PhotoFormData>) => void;
  onBack?: () => void;
  initialData?: Partial<PhotoFormData>;
  isSubmitting?: boolean;
}

export interface UploadStepProps extends StepProps {
  url: string | null;
  exif: TExifData | null;
  imageInfo: TImageInfo | undefined;
  onUploadSuccess: (
    url: string,
    exif: TExifData | null,
    imageInfo: TImageInfo
  ) => void;
  onReupload: (url: string) => void;
}

export interface MetadataStepProps extends StepProps {
  exif: TExifData | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const INITIAL_FORM_VALUES: Partial<PhotoFormData> = {
  url: "",
  title: "",
  description: "",
  visibility: "private",
  isFavorite: false,
  showCameraParameters: true,
};

export const STEP_CONFIG = [
  {
    id: "upload",
    title: "上传",
    description: "上传照片文件",
  },
  {
    id: "metadata",
    title: "信息",
    description: "补充照片标题、描述和相机参数",
  },
  {
    id: "location",
    title: "位置",
    description: "设置照片拍摄位置",
  },
  {
    id: "preview",
    title: "预览",
    description: "确认照片信息",
  },
];
