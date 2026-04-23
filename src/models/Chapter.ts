import mongoose, { Schema } from "mongoose";
import type { PdfEquationVector } from "@/lib/pdf/pdfEquationVector";

export type BlockBase = {
  _id?: string;
  type: "heading" | "paragraph" | "equation" | "figure" | "table";
};

export type HeadingBlock = BlockBase & {
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
  anchor?: string;
};

export type ParagraphBlock = BlockBase & {
  type: "paragraph";
  text: string;
};

export type EquationBlock = BlockBase & {
  type: "equation";
  latex: string;
  label?: string;
  displayMode?: boolean;
  caption?: string;
  /** Populated during server-side PDF generation (MathJax SVG -> vector tree) */
  _equationVector?: PdfEquationVector | null;
};

export type FigureBlock = BlockBase & {
  type: "figure";
  mediaAssetId?: string;
  src?: string; // local URL fallback, e.g. /media/foo.png
  public_id?: string; // Cloudinary public id
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type TableColumn = {
  key: string;
  label: string;
  unit?: string;
};

export type TableBlock = BlockBase & {
  type: "table";
  title?: string;
  caption?: string;
  columns: TableColumn[];
  rows: Record<string, string | number | null>[];
};

export type ChapterBlock =
  | HeadingBlock
  | ParagraphBlock
  | EquationBlock
  | FigureBlock
  | TableBlock;

export type ChapterDoc = {
  slug: string;
  title: string;
  chapterNumber: number;
  order: number;
  summary?: string;
  visibility: {
    isPublished: boolean;
    isVisibleInToc: boolean;
  };
  blocks: ChapterBlock[];
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const VisibilitySchema = new Schema(
  {
    isPublished: { type: Boolean, default: true },
    isVisibleInToc: { type: Boolean, default: true },
  },
  { _id: false }
);

const ChapterSchema = new Schema<ChapterDoc>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    chapterNumber: { type: Number, required: true },
    order: { type: Number, required: true, index: true },
    summary: { type: String },
    visibility: { type: VisibilitySchema, required: true },
    // Mixed blocks (validated at the API boundary / editor)
    blocks: { type: [Schema.Types.Mixed as unknown as Schema.Types.Mixed], required: true, default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Chapter =
  (mongoose.models.Chapter as mongoose.Model<ChapterDoc>) ||
  mongoose.model<ChapterDoc>("Chapter", ChapterSchema);

