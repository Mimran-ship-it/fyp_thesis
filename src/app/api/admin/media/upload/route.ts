import { NextResponse } from "next/server";
import path from "path";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { getAdminSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { MediaAsset } from "@/models/MediaAsset";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || "";
  const safeName = `${crypto.randomBytes(8).toString("hex")}${ext}`;

  const mediaDir = path.join(process.cwd(), "public", "media");
  await mkdir(mediaDir, { recursive: true });
  await writeFile(path.join(mediaDir, safeName), bytes);

  await dbConnect();
  const asset = await MediaAsset.create({
    type: "image",
    url: `/media/${safeName}`,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: bytes.length,
    tags: [],
  });

  return NextResponse.json({ ok: true, asset });
}

