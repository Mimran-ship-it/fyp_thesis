import { notFound } from "next/navigation";
import { getChapterBySlug } from "@/lib/chapters";
import { ChapterEditor } from "@/components/admin/ChapterEditor";
import { serializeDoc } from "@/lib/serialize";
import type { ChapterDoc } from "@/models/Chapter";

export default async function AdminChapterEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const chapter = await getChapterBySlug(slug);
  if (!chapter) notFound();

  const serialized = serializeDoc<ChapterDoc>(chapter);
  return <ChapterEditor chapter={serialized} />;
}

