import { auth } from "@/modules/auth/lib/auth";
import { readLocalUpload, writeLocalUpload, deleteLocalUpload } from "@/modules/s3/lib/local-storage";
import { IMAGE_SIZE_LIMIT } from "@/constants";
import { NextRequest, NextResponse } from "next/server";

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif",
};

type RouteContext = { params: Promise<{ key: string[] }> };

const getKey = async (context: RouteContext) => (await context.params).key.join("/");

const requireSession = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });
  return session ? null : NextResponse.json({ message: "未登录" }, { status: 401 });
};

export async function PUT(request: NextRequest, context: RouteContext) {
  if (process.env.STORAGE_PROVIDER !== "local") {
    return NextResponse.json({ message: "本地存储未启用" }, { status: 404 });
  }

  const denied = await requireSession(request);
  if (denied) return denied;

  const body = new Uint8Array(await request.arrayBuffer());
  if (!body.byteLength || body.byteLength > IMAGE_SIZE_LIMIT) {
    return NextResponse.json({ message: "文件大小不符合要求" }, { status: 413 });
  }

  await writeLocalUpload(await getKey(context), body);
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (process.env.STORAGE_PROVIDER !== "local") {
    return NextResponse.json({ message: "本地存储未启用" }, { status: 404 });
  }

  try {
    const key = await getKey(context);
    const file = await readLocalUpload(key);
    const extension = key.split(".").pop()?.toLowerCase() ?? "";
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": contentTypes[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ message: "文件不存在" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (process.env.STORAGE_PROVIDER !== "local") {
    return NextResponse.json({ message: "本地存储未启用" }, { status: 404 });
  }

  const denied = await requireSession(request);
  if (denied) return denied;

  await deleteLocalUpload(await getKey(context));
  return NextResponse.json({ ok: true });
}