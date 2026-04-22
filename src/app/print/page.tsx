import { ChapterRenderer } from "@/components/ChapterRenderer";
import { getPublishedChapters } from "@/lib/chapters";

export const dynamic = "force-dynamic";

export default async function PrintPage() {
  const chapters = await getPublishedChapters();
  const year = new Date().getFullYear();

  return (
    <div className="bg-white text-black">
      <div className="mx-auto max-w-3xl px-10 py-12">
        {/* Cover */}
        <section style={{ pageBreakAfter: "always" }}>
          <div className="text-center">
            <div className="text-xs font-sans tracking-wide uppercase text-black/60">
              NUST · School of Mechanical & Manufacturing Engineering
            </div>
            <h1 className="mt-6 font-sans text-4xl tracking-tight">
              Design, Fabrication &amp; Control of a Bio-Inspired Soft Robotic
              Gripping Mechanism
            </h1>
            <div className="mt-6 text-lg">
              <div className="font-sans">Author: AHT</div>
              <div className="mt-1 font-sans">{year}</div>
            </div>
          </div>
        </section>

        {/* TOC */}
        <section style={{ pageBreakAfter: "always" }}>
          <h2 className="font-sans text-2xl">Table of Contents</h2>
          <ol className="mt-4 space-y-2">
            {chapters.map((c) => (
              <li key={c.slug} className="flex justify-between gap-4">
                <span>{c.title}</span>
                <span className="text-black/50"> </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 text-xs text-black/50">
            Note: page numbers are generated in the PDF footer.
          </div>
        </section>

        {/* Chapters */}
        {chapters.map((c, idx) => (
          <section
            key={c.slug}
            style={{ pageBreakAfter: idx === chapters.length - 1 ? "auto" : "always" }}
          >
            <ChapterRenderer blocks={c.blocks} renderEquationsAsImages />
          </section>
        ))}
      </div>
    </div>
  );
}

