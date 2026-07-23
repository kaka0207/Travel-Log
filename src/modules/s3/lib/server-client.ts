import { S3Client } from "@aws-sdk/client-s3";

const isS3 = process.env.STORAGE_PROVIDER !== "local";

export const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  ...(isS3 && process.env.S3_ENDPOINT
    ? {
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
      }
    : {}),
});