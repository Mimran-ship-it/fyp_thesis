import mongoose, { Schema } from "mongoose";

export type MediaAssetDoc = {
  type: "image";
  url: string; // e.g. /media/filename.png
  publicId?: string; // Cloudinary public_id (if uploaded to Cloudinary)
  format?: string; // e.g. png, jpg, webp, svg
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  captionDefault?: string;
  tags: string[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const MediaAssetSchema = new Schema<MediaAssetDoc>(
  {
    type: { type: String, enum: ["image"], default: "image" },
    url: { type: String, required: true },
    publicId: { type: String },
    format: { type: String },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    captionDefault: { type: String },
    tags: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const MediaAsset =
  (mongoose.models.MediaAsset as mongoose.Model<MediaAssetDoc>) ||
  mongoose.model<MediaAssetDoc>("MediaAsset", MediaAssetSchema);

