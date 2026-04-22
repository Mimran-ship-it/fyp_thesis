import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Chapter, type ChapterBlock } from "@/models/Chapter";
import { normalizeChapterBlocks } from "@/lib/thesisTerminology";
import { auditChapterBlocks } from "@/lib/chapterContentAudit";

const BodySchema = z.object({
  blocks: z.array(z.any()),
  visibility: z.object({
    isPublished: z.boolean(),
    isVisibleInToc: z.boolean(),
  }),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;

  try {
    const body = BodySchema.parse(await req.json());
    await dbConnect();

    const blocks = normalizeChapterBlocks(body.blocks as ChapterBlock[]);
    const contentWarnings = auditChapterBlocks(blocks);

    const chapter = await Chapter.findOneAndUpdate(
      { slug },
      {
        blocks,
        visibility: body.visibility,
      },
      { new: true }
    );

    if (!chapter) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      updatedAt: chapter.updatedAt,
      blocks: chapter.blocks,
      contentWarnings: contentWarnings.length ? contentWarnings : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

