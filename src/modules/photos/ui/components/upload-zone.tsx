import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { IMAGE_SIZE_LIMIT } from "@/constants";

interface UploadZoneProps {
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
  uploadProgress: number;
}

export function UploadZone({
  isUploading,
  onUpload,
  uploadProgress,
}: UploadZoneProps) {
  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        await onUpload(file);
      }
    },
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    multiple: false,
  });

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-full size-32 bg-muted cursor-pointer",
          { "opacity-50": isUploading }
        )}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="flex flex-col items-center justify-center pt-5 pb-6 relative size-32">
          <UploadCloud className="size-20 opacity-70" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h1 className={cn(isUploading && "opacity-50")}>
          拖放照片文件到这里上传
        </h1>
        <p className="text-xs text-muted-foreground">
          照片默认保持私密，发布后才会公开。
        </p>
        <p className="text-xs text-muted-foreground">
          最大文件大小：{IMAGE_SIZE_LIMIT / 1024 / 1024} MB
        </p>
      </div>
      {isUploading ? (
        <Button
          disabled
          className="relative"
          style={{
            background: `linear-gradient(to right, rgb(34 197 94) ${uploadProgress}%, rgb(15 23 42) ${uploadProgress}%)`,
          }}
        >
          正在上传... {uploadProgress}%
        </Button>
      ) : (
        <Button type="button" disabled={isUploading} onClick={open}>
          选择文件
        </Button>
      )}
    </div>
  );
}
