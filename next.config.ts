import type { NextConfig } from "next";
import { siteConfig } from "./src/site.config";

const s3PublicUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || "";
const s3Url = s3PublicUrl ? new URL(s3PublicUrl) : null;
const s3Hostname = s3Url ? s3Url.hostname : "";
const s3Protocol = s3Url ? s3Url.protocol.replace(":", "") : "https";

const useCloudflareLoader = siteConfig.imageLoader === "cloudflare";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  reactCompiler: true,
  images: {
    // COS already serves public images directly. Avoid proxying every image
    // through this small VPS via /_next/image, which can reject remote URLs
    // and adds unnecessary CPU/memory load.
    unoptimized: true,
    qualities: [65, 75],
    ...(useCloudflareLoader && {
      loader: "custom",
      loaderFile: "./src/lib/cloudflare-image-loader.ts",
    }),
    remotePatterns: s3Hostname
      ? [
          {
            protocol: s3Protocol as "http" | "https",
            hostname: s3Hostname,
            port: s3Url?.port || "",
          },
        ]
      : [],
  },
};

export default nextConfig;
