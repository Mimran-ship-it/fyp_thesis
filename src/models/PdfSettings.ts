import mongoose, { Schema } from "mongoose";

export type PdfSettingsDoc = {
  key: "default";
  showCoverPage: boolean;
  showToc: boolean;
  equationNumberingMode: "chapter" | "sequential";
  authorName: string;
  supervisorName: string;
  degreeTitle: string;
  submissionYear: string;
  thesisTitleShort: string;
  accentColor: string;
  crestUrl?: string;
  sealUrl?: string;
  bodyFont: "Lora" | "Garamond" | "Times New Roman";
  uiFont: "Inter" | "Helvetica";
  createdAt: Date;
  updatedAt: Date;
};

const PdfSettingsSchema = new Schema<PdfSettingsDoc>(
  {
    key: { type: String, enum: ["default"], unique: true, required: true },
    showCoverPage: { type: Boolean, default: true },
    showToc: { type: Boolean, default: true },
    equationNumberingMode: { type: String, enum: ["chapter", "sequential"], default: "chapter" },
    authorName: { type: String, default: "Author Name" },
    supervisorName: { type: String, default: "Supervisor Name" },
    degreeTitle: {
      type: String,
      default: "Bachelor of Engineering",
    },
    submissionYear: { type: String, default: new Date().getFullYear().toString() },
    thesisTitleShort: { type: String, default: "Bio-Inspired Soft Robotic Gripper" },
    accentColor: { type: String, default: "#2563eb" },
    crestUrl: { type: String },
    sealUrl: { type: String },
    bodyFont: { type: String, enum: ["Lora", "Garamond", "Times New Roman"], default: "Lora" },
    uiFont: { type: String, enum: ["Inter", "Helvetica"], default: "Inter" },
  },
  { timestamps: true }
);

export const PdfSettings =
  (mongoose.models.PdfSettings as mongoose.Model<PdfSettingsDoc>) ||
  mongoose.model<PdfSettingsDoc>("PdfSettings", PdfSettingsSchema);

