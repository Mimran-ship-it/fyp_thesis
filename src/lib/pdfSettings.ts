import { dbConnect } from "@/lib/db";
import { PdfSettings, type PdfSettingsDoc } from "@/models/PdfSettings";

export async function getPdfSettings() {
  await dbConnect();
  const doc =
    (await PdfSettings.findOne({ key: "default" }).lean<PdfSettingsDoc>()) ??
    null;
  if (doc) return doc;

  const created = await PdfSettings.create({ key: "default" });
  return created.toObject() as PdfSettingsDoc;
}

