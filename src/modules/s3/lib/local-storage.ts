import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const LOCAL_UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export const getLocalUploadPath = (key: string) => {
  const normalized = path.posix.normalize(key).replace(/^\/+/, "");
  if (!normalized || normalized === "." || normalized.startsWith("..") || normalized.includes("../")) {
    throw new Error("Invalid upload key");
  }
  return path.join(LOCAL_UPLOAD_ROOT, ...normalized.split("/"));
};

export const writeLocalUpload = async (key: string, data: Uint8Array) => {
  const filePath = getLocalUploadPath(key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
};

export const readLocalUpload = (key: string) => readFile(getLocalUploadPath(key));

export const deleteLocalUpload = async (key: string) => {
  try {
    await unlink(getLocalUploadPath(key));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
};