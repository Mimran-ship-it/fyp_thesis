import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { PdfSettings } from "@/models/PdfSettings";
import { getPdfSettings } from "@/lib/pdfSettings";

export const runtime = "nodejs";

const UpdateSchema = z.object({
  showCoverPage: z.boolean(),
  showToc: z.boolean(),
  equationNumberingMode: z.enum(["chapter", "sequential"]),
  authorName: z.string(),
  supervisorName: z.string(),
  degreeTitle: z.string(),
  submissionYear: z.string(),
  thesisTitleShort: z.string(),
  accentColor: z.string(),
  crestUrl: z.string().optional().nullable(),
  sealUrl: z.string().optional().nullable(),
  bodyFont: z.enum(["Lora", "Garamond", "Times New Roman"]),
  uiFont: z.enum(["Inter", "Helvetica"]),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await getPdfSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = UpdateSchema.parse(await req.json());
    await dbConnect();
    const updated = await PdfSettings.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          ...body,
          crestUrl: body.crestUrl || undefined,
          sealUrl: body.sealUrl || undefined,
        },
      },
      { upsert: true, new: true }
    ).lean();
    return NextResponse.json({ ok: true, settings: updated });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

