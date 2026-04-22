import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Chapter } from "@/models/Chapter";

export const runtime = "nodejs";

const BodySchema = z.object({
  slugs: z.array(z.string().min(1)).min(1),
});

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = BodySchema.parse(await req.json());
    await dbConnect();

    // order = 1..N based on provided list
    await Promise.all(
      body.slugs.map((slug, idx) =>
        Chapter.updateOne({ slug }, { $set: { order: idx + 1 } })
      )
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

