import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Chapter } from "@/models/Chapter";

export const runtime = "nodejs";

const BodySchema = z.object({
  slug: z.string().min(1),
  isPublished: z.boolean(),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = BodySchema.parse(await req.json());
    await dbConnect();
    await Chapter.updateOne(
      { slug: body.slug },
      { $set: { "visibility.isPublished": body.isPublished } }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

