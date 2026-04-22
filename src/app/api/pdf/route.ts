import { createElement } from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { dbConnect } from "@/lib/db";
import { getPublishedChapters } from "@/lib/chapters";
import { getPdfSettings } from "@/lib/pdfSettings";
import { ThesisDocument } from "@/lib/pdf/ThesisDocument";
import { registerThesisFonts } from "@/lib/pdf/registerFonts";
import type { ChapterDoc } from "@/models/Chapter";
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
    const serialized = JSON.parse(
      JSON.stringify({ chapters, settings })
    ) as {
      chapters: ChapterDoc[];
      settings: PdfSettingsDoc;
    };

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
    console.error("PDF generation failed:", error);
    const message = error instanceof Error ? error.message : "pdf_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
