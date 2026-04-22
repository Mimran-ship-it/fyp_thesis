import { ChapterRenderer } from "@/components/ChapterRenderer";
import { TocSidebar } from "@/components/TocSidebar";
import { PdfButton } from "@/components/PdfButton";
import { getPublishedChapters } from "@/lib/chapters";

export const dynamic = "force-dynamic";

export default async function Home() {
  const chapters = await getPublishedChapters();
  return (
    <div className="flex-1 bg-gray-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 lg:grid-cols-[320px_1fr]">
        <TocSidebar
          items={chapters.map((c) => ({
            slug: c.slug,
            title: c.title,
            summary: c.summary,
          }))}
        />
        <main className="min-w-0 px-5 py-8 lg:px-10 lg:py-10">
          <header className="overflow-hidden rounded-2xl shadow-sm border border-black/10">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-10 text-white">
              <div className="text-xs font-sans tracking-[0.16em] uppercase text-blue-200/90">
                NUST · SMME · FINAL YEAR PROJECT THESIS
              </div>
              <h1 className="mt-3 font-sans text-3xl font-semibold tracking-tight sm:text-4xl">
                Design, Fabrication &amp; Control of a Bio-Inspired Soft Robotic
                Gripping Mechanism
              </h1>
              <p className="mt-4 max-w-3xl font-sans text-sm leading-7 text-white/90">
                Interactive thesis report with structured equations, figures,
                and pressure–deformation datasets.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <PdfButton className="inline-flex items-center justify-center rounded-full bg-[#0b0f19] px-5 py-2.5 font-sans text-sm text-white shadow-sm ring-1 ring-white/10 hover:bg-black disabled:opacity-60" />
                <a
                  href="/admin/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-transparent px-5 py-2.5 font-sans text-sm text-white hover:bg-white/10"
                >
                  Admin
                </a>
              </div>
            </div>
          </header>

          <div className="mt-8 space-y-10">
            {chapters.map((c) => (
              <section
                key={c.slug}
                id={c.slug}
                className="rounded-2xl border border-black/10 bg-white px-6 py-8 shadow-sm sm:px-12 sm:py-10"
              >
                <ChapterRenderer blocks={c.blocks} />
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

