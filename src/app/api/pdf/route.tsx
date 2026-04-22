import React from "react";
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

    const buffer = await renderToBuffer(
      <ThesisDocument
        chapters={serialized.chapters}
        settings={serialized.settings}
        baseUrl={origin}
      />
    );

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="thesis.pdf"`,
      },
    });
  } catch (e) {
    console.error("PDF generation failed:", e);
    return NextResponse.json({ error: "pdf_failed" }, { status: 500 });
  }
}
