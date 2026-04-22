import Link from "next/link";
import { Eye } from "lucide-react";
import { getAllChapters } from "@/lib/chapters";
import { PdfButton } from "@/components/PdfButton";
import { ChaptersList } from "@/components/admin/ChaptersList";
import { serializeDoc } from "@/lib/serialize";

export default async function AdminDashboardPage() {
  const chapters = serializeDoc<Awaited<ReturnType<typeof getAllChapters>>>(
    await getAllChapters()
  );

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-sans tracking-[0.16em] uppercase text-slate-500">
              Chapters
            </div>
            <h1 className="mt-1 font-sans text-[22px] font-bold tracking-tight text-[#0f172a]">
              Manage thesis content
            </h1>
            <p className="mt-2 text-sm font-sans leading-7 text-slate-500">
              Toggle visibility, reorder chapters, and edit structured blocks.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[#2563eb] bg-white px-4 py-2 font-sans text-sm text-[#2563eb] transition-colors hover:bg-blue-50"
            >
              <Eye className="h-4 w-4" /> Preview
            </Link>
            <PdfButton
              label="Generate PDF"
              className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-4 py-2 font-sans text-sm text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
            />
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-sans font-semibold">Chapter list</div>
        </div>

        <ChaptersList
          initial={chapters.map((c) => ({
            slug: c.slug,
            title: c.title,
            updatedAt: c.updatedAt,
            visibility: { isPublished: c.visibility.isPublished },
          }))}
        />
      </section>
    </div>
  );
}

