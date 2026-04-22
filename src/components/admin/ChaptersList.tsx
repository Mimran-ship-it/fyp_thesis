"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Pencil } from "lucide-react";

type ChapterRow = {
  slug: string;
  title: string;
  updatedAt: string | Date;
  visibility: { isPublished: boolean };
};

export function ChaptersList({ initial }: { initial: ChapterRow[] }) {
  const [rows, setRows] = useState<ChapterRow[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  useMemo(() => rows, [rows]);

  async function setPublished(slug: string, isPublished: boolean) {
    setBusy(slug);
    try {
      await fetch("/api/admin/chapters/visibility", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, isPublished }),
      });
      setRows((prev) =>
        prev.map((r) =>
          r.slug === slug
            ? { ...r, visibility: { ...r.visibility, isPublished } }
            : r
        )
      );
    } finally {
      setBusy(null);
    }
  }

  async function move(slug: string, dir: -1 | 1) {
    const idx = rows.findIndex((r) => r.slug === slug);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= rows.length) return;

    const next = [...rows];
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    setRows(next);

    setBusy("reorder");
    try {
      await fetch("/api/admin/chapters/reorder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slugs: next.map((r) => r.slug) }),
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="divide-y divide-slate-200">
      {rows.map((c, i) => (
        <div key={c.slug} className="px-6 py-4">
          <div className="group relative flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-md">
            <span className="pointer-events-none absolute left-0 top-3 bottom-3 w-1 rounded-r bg-transparent transition-colors group-hover:bg-blue-100" />
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-1 flex w-7 items-center justify-center text-slate-400">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="truncate font-sans text-[16px] font-bold text-[#0f172a]">
                    {c.title}
                  </div>
                  <button
                    type="button"
                    disabled={busy === c.slug}
                    onClick={() => setPublished(c.slug, !c.visibility.isPublished)}
                    className={[
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-sans font-semibold text-white transition-colors",
                      c.visibility.isPublished
                        ? "bg-[#10b981] animate-pulse"
                        : "bg-[#f59e0b]",
                    ].join(" ")}
                    title="Toggle visibility"
                  >
                    {c.visibility.isPublished ? (
                      <>
                        <Eye className="h-3.5 w-3.5" /> Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" /> Unpublished
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-1 text-[12px] font-sans text-slate-400">
                  Last edited:{" "}
                  {new Date(c.updatedAt).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => move(c.slug, -1)}
                disabled={i === 0 || busy === "reorder"}
                className="h-9 w-9 rounded-lg border border-slate-200 p-2 text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                title="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(c.slug, 1)}
                disabled={i === rows.length - 1 || busy === "reorder"}
                className="h-9 w-9 rounded-lg border border-slate-200 p-2 text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                title="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <Link
                href={`/admin/dashboard/chapters/${c.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

