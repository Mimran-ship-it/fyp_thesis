import { NextResponse } from "next/server";
import { Readable } from "stream";
import { dbConnect } from "@/lib/db";
import { getCloudinary } from "@/lib/cloudinary";
import { MediaAsset } from "@/models/MediaAsset";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const cld = getCloudinary();

  const result = await new Promise<{
    secure_url: string;
    public_id: string;
    width?: number;
    height?: number;
    format?: string;
    resource_type?: string;
  }>((resolve, reject) => {
    const upload = cld.uploader.upload_stream(
      {
        folder: "thesis",
        resource_type: "image",
      },
      (err, res) => {
        if (err || !res) return reject(err || new Error("upload_failed"));
        resolve(res as any);
      }
    );
    Readable.from(bytes).pipe(upload);
  });

  await dbConnect();
  await MediaAsset.create({
    type: "image",
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: bytes.length,
    width: result.width,
    height: result.height,
    tags: [],
  });

  return NextResponse.json({
    url: result.secure_url,
    public_id: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  });
}

