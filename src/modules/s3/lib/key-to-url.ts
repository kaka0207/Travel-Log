const BASE_URL = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "";
const STORAGE_PROVIDER = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || "s3";

export const keyToUrl = (key: string | undefined | null) => {
  if (!key) return "";
  if (STORAGE_PROVIDER === "local") return `/api/uploads/${key}`;
  return `${BASE_URL}/${key}`;
};