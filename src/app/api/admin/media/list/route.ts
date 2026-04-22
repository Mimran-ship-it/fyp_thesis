import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { MediaAsset } from "@/models/MediaAsset";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const assets = await MediaAsset.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ ok: true, assets });
}

