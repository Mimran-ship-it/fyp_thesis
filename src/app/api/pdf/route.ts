import { createElement } from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { dbConnect } from "@/lib/db";
import { getPublishedChapters } from "@/lib/chapters";
import { getPdfSettings } from "@/lib/pdfSettings";
import { ThesisDocument } from "@/lib/pdf/ThesisDocument";
import { registerThesisFonts } from "@/lib/pdf/registerFonts";
import { normalizeChapterBlocks } from "@/lib/thesisTerminology";
import { renderEquationToSVG } from "@/lib/pdf/renderEquationToSVG";
import type { ChapterDoc, EquationBlock } from "@/models/Chapter";
import type { PdfSettingsDoc } from "@/models/PdfSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getOrigin(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get("host") || url.host;
  const proto =
    req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    registerThesisFonts();

    const [chapters, settings] = await Promise.all([
      getPublishedChapters(),
      getPdfSettings(),
    ]);

    const origin = getOrigin(req);
    const rawChapters = JSON.stringify(chapters).replace(/00-30\s+00-30/g, "00-30");
    const cleanedChapters = JSON.parse(rawChapters) as ChapterDoc[];
    const serialized = {
      chapters: cleanedChapters.map((c) => ({
        ...c,
        blocks: normalizeChapterBlocks(Array.isArray(c.blocks) ? c.blocks : []),
      })) as ChapterDoc[],
      settings: JSON.parse(JSON.stringify(settings)) as PdfSettingsDoc,
    };

    for (const chapter of serialized.chapters) {
      const blocks = Array.isArray(chapter.blocks) ? chapter.blocks : [];
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.type !== "equation") continue;
        const eb = b as EquationBlock;
        if (typeof eb.latex !== "string" || !eb.latex.trim()) continue;
        const vector = renderEquationToSVG(eb.latex.trim(), eb.displayMode !== false);
        blocks[i] = { ...eb, _equationVector: vector } as EquationBlock;
      }
    }

    // ThesisDocument’s root is <Document />; cast satisfies renderToBuffer’s Document-only typing.
    const buffer = await renderToBuffer(
      createElement(ThesisDocument, {
        chapters: serialized.chapters,
        settings: serialized.settings,
        baseUrl: origin,
      }) as never
    );

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="thesis.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "pdf_failed";
    console.error("PDF crash details:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    try {
      await dbConnect();
      const chapters = await getPublishedChapters();
      const dbg = chapters.map((c) => ({
        slug: c.slug,
        blocks: Array.isArray(c.blocks) ? c.blocks.length : 0,
        blockTypes: Array.isArray(c.blocks)
          ? c.blocks.map((b) =>
              b && typeof b === "object" && "type" in b ? (b as { type: string }).type : "?"
            )
          : [],
      }));
      console.error("PDF chapter/block snapshot (for layout debugging):", {
        chapterCount: chapters.length,
        blockCounts: dbg,
      });
    } catch {
      // ignore secondary logging failures
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
