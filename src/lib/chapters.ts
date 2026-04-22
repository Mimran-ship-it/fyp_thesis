import { dbConnect } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { Chapter, type ChapterDoc } from "@/models/Chapter";

export async function getPublishedChapters() {
  await ensureSeeded();
  await dbConnect();
  return Chapter.find({
    "visibility.isPublished": true,
  })
    .sort({ order: 1 })
    .lean<ChapterDoc[]>();
}

export async function getAllChapters() {
  await ensureSeeded();
  await dbConnect();
  return Chapter.find({}).sort({ order: 1 }).lean<ChapterDoc[]>();
}

export async function getChapterBySlug(slug: string) {
  await ensureSeeded();
  await dbConnect();
  return Chapter.findOne({ slug }).lean<ChapterDoc | null>();
}

