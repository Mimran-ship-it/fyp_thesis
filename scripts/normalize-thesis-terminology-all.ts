/**
 * One-shot MongoDB normalization of thesis terminology across all chapters.
 * Usage (from thesis-portal): npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/normalize-thesis-terminology-all.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import { Chapter, type ChapterBlock } from "../src/models/Chapter.ts";
import { normalizeChapterBlocks } from "../src/lib/thesisTerminology.ts";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  const uri = requiredEnv("MONGODB_URI");
  await mongoose.connect(uri);
  const chapters = await Chapter.find({}).lean();
  let updated = 0;
  for (const ch of chapters) {
    const next = normalizeChapterBlocks((ch.blocks || []) as ChapterBlock[]);
    if (JSON.stringify(next) !== JSON.stringify(ch.blocks)) {
      await Chapter.updateOne({ _id: ch._id }, { $set: { blocks: next } });
      updated += 1;
      console.log("Updated:", ch.slug);
    }
  }
  console.log(`Done. Chapters touched: ${updated} / ${chapters.length}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
