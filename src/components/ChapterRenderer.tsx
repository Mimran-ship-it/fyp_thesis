import Image from "next/image";
import { renderLatexToHtml, renderLatexToSvgDataUri } from "@/lib/latex";
import type { ChapterBlock, TableBlock } from "@/models/Chapter";

function isTbd(v: unknown) {
  if (v === null || v === undefined) return false;
  return String(v).trim().toUpperCase() === "TBD";
}

function Table({ block }: { block: TableBlock }) {
  return (
    <figure className="my-6">
      {block.title ? (
        <div className="font-sans text-sm font-semibold text-[#1a1a1a]">
          {block.title}
        </div>
      ) : null}
      <div className="mt-3 overflow-auto rounded-xl border border-[#cbd5e1]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1e3a5f]">
            <tr>
              {block.columns.map((c) => (
                <th
                  key={c.key}
                  className="px-3 py-2 font-sans font-semibold text-white"
                >
                  {c.label}
                  {c.unit ? (
                    <span className="text-white/80"> ({c.unit})</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, idx) => (
              <tr
                key={idx}
                className={[
                  "border-t border-[#cbd5e1]",
                  idx % 2 === 1 ? "bg-[#f0f4f8]" : "bg-white",
                ].join(" ")}
              >
                {block.columns.map((c) => {
                  const v = row[c.key];
                  return (
                    <td
                      key={c.key}
                      className={[
                        "px-3 py-2 align-top text-[#1a1a1a]",
                        isTbd(v) ? "italic text-[#b45309]" : "",
                      ].join(" ")}
                    >
                      {v ?? ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.caption ? (
        <figcaption className="mt-2 text-[13px] leading-5 text-[#374151]">
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function ChapterRenderer({
  blocks,
  renderEquationsAsImages = false,
}: {
  blocks: ChapterBlock[];
  renderEquationsAsImages?: boolean;
}) {
  return (
    <div className="max-w-none">
      {blocks.map((b, idx) => {
        if (b.type === "heading") {
          const Tag = (b.level === 1
            ? "h1"
            : b.level === 2
              ? "h2"
              : "h3") as "h1" | "h2" | "h3";
          const id = b.anchor || undefined;
          return (
            <div key={idx} id={id} className="scroll-mt-24">
              <Tag
                className={[
                  "font-sans tracking-tight text-[#0f172a] font-bold",
                  b.level === 1
                    ? "text-3xl font-bold pb-3 border-b border-black/10"
                    : b.level === 2
                      ? "text-xl mt-8"
                      : "text-lg mt-6",
                ].join(" ")}
              >
                {b.text}
              </Tag>
            </div>
          );
        }

        if (b.type === "paragraph") {
          return (
            <p
              key={idx}
              className="mt-4 text-[#1a1a1a] leading-[1.8] font-serif"
            >
              {b.text}
            </p>
          );
        }

        if (b.type === "equation") {
          const displayMode = b.displayMode ?? true;
          if (renderEquationsAsImages) {
            const src = renderLatexToSvgDataUri(b.latex, displayMode);
            return (
              <figure key={idx} className="my-6">
                <div className="rounded-xl border border-[#cbd5e1] bg-[#f0f4ff] px-4 py-4 text-[#1a1a1a]">
                  <div className="border-l-4 border-[#8b5cf6] pl-4">
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={b.label ? `Equation ${b.label}` : "Equation"}
                  className={displayMode ? "mx-auto" : "inline-block"}
                />
                  </div>
                  </div>
                </div>
                {b.caption ? (
                  <figcaption className="mt-2 text-[13px] italic leading-5 text-[#4b5563]">
                    {b.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          }

          const html = renderLatexToHtml(b.latex, displayMode);
          return (
            <figure key={idx} className="my-6">
              <div className="rounded-xl border border-[#cbd5e1] bg-[#f0f4ff] px-4 py-4 text-[#1a1a1a]">
                <div className="border-l-4 border-[#8b5cf6] pl-4">
                <div
                  className="flex justify-center overflow-auto"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
                </div>
              </div>
              {b.caption ? (
                <figcaption className="mt-2 text-[13px] italic leading-5 text-[#4b5563]">
                  {b.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        if (b.type === "figure") {
          const src = b.src || "";
          const width = b.width ?? 1200;
          const height = b.height ?? 800;
          return (
            <figure key={idx} className="my-6">
              {src ? (
                <Image
                  src={src}
                  alt={b.alt || b.caption || "Figure"}
                  width={width}
                  height={height}
                  className="w-full rounded-xl border border-black/10 shadow-sm"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-black/20 bg-gray-50 p-6 text-sm text-gray-700 font-sans">
                  Figure placeholder (upload via Admin → Media, then attach).
                </div>
              )}
              {b.caption ? (
                <figcaption className="mt-2 text-[13px] leading-5 text-[#374151]">
                  {b.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        if (b.type === "table") {
          return <Table key={idx} block={b} />;
        }

        return null;
      })}
    </div>
  );
}

