"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  Eye,
  EyeOff,
} from "lucide-react";
import type { ChapterBlock, ChapterDoc } from "@/models/Chapter";
import { ChapterRenderer } from "@/components/ChapterRenderer";

type ChapterEditorProps = {
  chapter: ChapterDoc;
};

type ContentWarning = {
  code: string;
  message: string;
  blockIndex: number;
};

function cloneBlocks(blocks: ChapterBlock[]) {
  return JSON.parse(JSON.stringify(blocks)) as ChapterBlock[];
}

function newBlock(type: ChapterBlock["type"]): ChapterBlock {
  if (type === "heading") return { type: "heading", level: 2, text: "Heading" };
  if (type === "paragraph") return { type: "paragraph", text: "Paragraph…" };
  if (type === "equation")
    return {
      type: "equation",
      latex: "W = C_{10}(I_1-3)+C_{20}(I_1-3)^2+C_{30}(I_1-3)^3",
      displayMode: true,
      caption: "",
    };
  if (type === "figure")
    return {
      type: "figure",
      src: "",
      public_id: "",
      caption: "Figure caption…",
      alt: "",
      width: 1200,
      height: 800,
    };
  return {
    type: "table",
    title: "Table title…",
    caption: "",
    columns: [
      { key: "col1", label: "Column 1" },
      { key: "col2", label: "Column 2" },
    ],
    rows: [{ col1: "", col2: "" }],
  };
}

export function ChapterEditor({ chapter }: ChapterEditorProps) {
  const initialBlocks = useMemo(() => cloneBlocks(chapter.blocks), [chapter]);
  const [baselineBlocks, setBaselineBlocks] = useState<ChapterBlock[]>(initialBlocks);
  const [blocks, setBlocks] = useState<ChapterBlock[]>(initialBlocks);

  useEffect(() => {
    const next = cloneBlocks(chapter.blocks);
    setBaselineBlocks(next);
    setBlocks(next);
  }, [chapter.slug]);
  const [isPublished, setIsPublished] = useState<boolean>(
    chapter.visibility.isPublished
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [contentWarnings, setContentWarnings] = useState<ContentWarning[]>([]);
  const [tablePreviewOpen, setTablePreviewOpen] = useState<Record<number, boolean>>(
    {}
  );
  const [figureUpload, setFigureUpload] = useState<
    Record<
      number,
      | { state: "idle" }
      | { state: "uploading"; filename: string; progress: number }
      | { state: "error"; message: string }
      | { state: "done"; url: string }
    >
  >({});

  const dirty = useMemo(() => {
    return (
      JSON.stringify(blocks) !== JSON.stringify(baselineBlocks) ||
      isPublished !== chapter.visibility.isPublished
    );
  }, [blocks, baselineBlocks, isPublished, chapter.visibility.isPublished]);

  function moveBlock(i: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[i];
      next[i] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  function deleteBlock(i: number) {
    setBlocks((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addBlock(type: ChapterBlock["type"]) {
    setBlocks((prev) => [...prev, newBlock(type)]);
  }

  function updateBlock(i: number, patch: Partial<ChapterBlock>) {
    setBlocks((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch } as ChapterBlock;
      return next;
    });
  }

  function ensureFigureState(i: number) {
    setFigureUpload((prev) => (prev[i] ? prev : { ...prev, [i]: { state: "idle" } }));
  }

  async function uploadFigureFile(blockIndex: number, file: File) {
    ensureFigureState(blockIndex);

    const allowed = new Set([
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
    ]);
    if (!allowed.has(file.type)) {
      setFigureUpload((p) => ({
        ...p,
        [blockIndex]: { state: "error", message: "Unsupported format. Use PNG/JPG/WEBP/SVG." },
      }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFigureUpload((p) => ({
        ...p,
        [blockIndex]: { state: "error", message: "File too large (max 10MB)." },
      }));
      return;
    }

    setFigureUpload((p) => ({
      ...p,
      [blockIndex]: { state: "uploading", filename: file.name, progress: 1 },
    }));

    const fd = new FormData();
    fd.append("file", file);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/media/upload");
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const pct = Math.max(1, Math.min(99, Math.round((e.loaded / e.total) * 100)));
        setFigureUpload((p) => {
          const cur = p[blockIndex];
          if (!cur || cur.state !== "uploading") return p;
          return { ...p, [blockIndex]: { ...cur, progress: pct } };
        });
      };
      xhr.onerror = () => {
        setFigureUpload((p) => ({
          ...p,
          [blockIndex]: { state: "error", message: "Upload failed." },
        }));
        resolve();
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText || "{}");
          if (xhr.status < 200 || xhr.status >= 300) {
            setFigureUpload((p) => ({
              ...p,
              [blockIndex]: {
                state: "error",
                message: data?.error || "Upload failed.",
              },
            }));
            resolve();
            return;
          }

          const url = data?.url as string | undefined;
          const public_id = data?.public_id as string | undefined;
          const width = data?.width as number | undefined;
          const height = data?.height as number | undefined;

          if (!url) {
            setFigureUpload((p) => ({
              ...p,
              [blockIndex]: { state: "error", message: "Upload response missing URL." },
            }));
            resolve();
            return;
          }

          const b = blocks[blockIndex];
          if (b?.type === "figure") {
            updateBlock(blockIndex, {
              src: url,
              public_id,
              width: width ?? b.width ?? 1200,
              height: height ?? b.height ?? 800,
            } as Partial<ChapterBlock>);
          }
          setFigureUpload((p) => ({
            ...p,
            [blockIndex]: { state: "done", url },
          }));
        } catch {
          setFigureUpload((p) => ({
            ...p,
            [blockIndex]: { state: "error", message: "Upload failed." },
          }));
        } finally {
          resolve();
        }
      };
      xhr.send(fd);
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/chapters/${chapter.slug}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          blocks,
          visibility: { isPublished, isVisibleInToc: true },
        }),
      });
      if (!res.ok) throw new Error("save_failed");
      const data = (await res.json()) as {
        blocks?: ChapterBlock[];
        contentWarnings?: ContentWarning[];
      };
      if (Array.isArray(data.blocks)) {
        const next = cloneBlocks(data.blocks);
        setBlocks(next);
        setBaselineBlocks(next);
      }
      setContentWarnings(Array.isArray(data.contentWarnings) ? data.contentWarnings : []);
      setSavedAt(new Date().toLocaleTimeString());
    } catch {
      setError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="sticky top-0 z-20 -mx-5 border-b border-slate-200 bg-[#f8fafc]/90 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-sans tracking-[0.16em] uppercase text-slate-500">
              Editing
            </div>
            <h1 className="mt-1 truncate font-sans text-[22px] font-bold tracking-tight text-[#0f172a]">
              {chapter.title}
            </h1>
            <div className="mt-1 text-xs font-sans text-slate-500">
              {dirty ? "Unsaved changes" : "All changes saved"}
              {savedAt ? ` · Saved at ${savedAt}` : ""}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPublished((v) => !v)}
              className={[
                "inline-flex items-center gap-2 rounded-full px-3 py-2 font-sans text-sm font-semibold text-white transition-colors",
                isPublished ? "bg-[#10b981]" : "bg-[#ef4444]",
              ].join(" ")}
              title="Toggle publish"
            >
              {isPublished ? (
                <>
                  <Eye className="h-4 w-4" /> Published
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4" /> Hidden
                </>
              )}
            </button>

            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </header>

      {contentWarnings.length > 0 ? (
        <div className="mx-auto max-w-7xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <div className="flex items-start gap-2 font-sans font-semibold">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Content audit (PDF)
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 font-sans text-amber-900/90">
            {contentWarnings.map((w, i) => (
              <li key={i}>
                Block {w.blockIndex + 1}: {w.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-sans tracking-[0.16em] uppercase text-slate-500">
              Toolbar
            </div>
            <div className="mt-1 text-sm font-sans text-slate-500">
              Add structured blocks (no auto-save).
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              ["heading", "paragraph", "equation", "figure", "table"] as const
            ).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addBlock(t)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 font-sans text-sm font-semibold text-[#0f172a] transition-colors hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Add {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        {blocks.map((b, idx) => (
          (() => {
            const blockAccent =
              b.type === "heading"
                ? "#2563eb"
                : b.type === "paragraph"
                  ? "#10b981"
                  : b.type === "equation"
                    ? "#8b5cf6"
                    : b.type === "figure"
                      ? "#f59e0b"
                      : "#ef4444";
            const headerLabel = `${String(b.type).toUpperCase()}`;

            const inputBase =
              "w-full rounded-xl border border-[#cbd5e1] bg-white px-3 py-2 font-sans text-sm font-medium text-[#0f172a] outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-4 focus:ring-[rgba(37,99,235,0.15)]";
            const labelBase =
              "text-[11px] font-sans font-bold tracking-[0.16em] uppercase text-[#374151]";

            return (
          <div
            key={idx}
            className="rounded-2xl border border-[#e2e8f0] bg-white px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            style={{ borderLeft: `4px solid ${blockAccent}` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-sans text-sm font-bold text-[#0f172a]">
                BLOCK {idx + 1} · {headerLabel}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveBlock(idx, -1)}
                  className="h-9 w-9 rounded-lg border border-[#cbd5e1] p-2 text-[#374151] transition-colors hover:bg-[#f1f5f9]"
                  title="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(idx, 1)}
                  className="h-9 w-9 rounded-lg border border-[#cbd5e1] p-2 text-[#374151] transition-colors hover:bg-[#f1f5f9]"
                  title="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteBlock(idx)}
                  className="h-9 w-9 rounded-lg border border-[#cbd5e1] p-2 text-[#374151] transition-colors hover:bg-[#f1f5f9]"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {b.type === "heading" ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                    <label className={labelBase}>
                      Level
                    </label>
                    <select
                      value={b.level}
                      onChange={(e) =>
                        updateBlock(idx, {
                          level: Number(e.target.value) as 1 | 2 | 3,
                        })
                      }
                      className={inputBase}
                    >
                      <option value={1}>H1</option>
                      <option value={2}>H2</option>
                      <option value={3}>H3</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                    <label className={labelBase}>
                      Text
                    </label>
                    <input
                      value={b.text}
                      onChange={(e) => updateBlock(idx, { text: e.target.value })}
                      className={inputBase}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                    <label className={labelBase}>
                      Anchor
                    </label>
                    <input
                      value={b.anchor || ""}
                      onChange={(e) =>
                        updateBlock(idx, { anchor: e.target.value })
                      }
                      placeholder="optional"
                      className={inputBase}
                    />
                  </div>
                </>
              ) : null}

              {b.type === "paragraph" ? (
                <textarea
                  value={b.text}
                  onChange={(e) => updateBlock(idx, { text: e.target.value })}
                  className="min-h-[140px] w-full rounded-xl border border-[#cbd5e1] bg-white px-3 py-2 font-serif text-[15px] font-normal leading-[1.7] text-[#1a1a1a] outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-4 focus:ring-[rgba(37,99,235,0.15)]"
                />
              ) : null}

              {b.type === "equation" ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                    <label className={labelBase}>
                      LaTeX
                    </label>
                    <textarea
                      value={b.latex}
                      onChange={(e) => updateBlock(idx, { latex: e.target.value })}
                      className="min-h-[110px] w-full rounded-xl border border-[#cbd5e1] bg-white px-3 py-2 font-mono text-xs font-medium text-[#0f172a] outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-4 focus:ring-[rgba(37,99,235,0.15)]"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                    <label className={labelBase}>
                      Caption
                    </label>
                    <input
                      value={b.caption || ""}
                      onChange={(e) =>
                        updateBlock(idx, { caption: e.target.value })
                      }
                      className={inputBase}
                    />
                  </div>
                </>
              ) : null}

              {b.type === "figure" ? (
                <>
                  <div className="space-y-3">
                    <div className={labelBase}>Upload</div>

                    {(() => {
                      const st = figureUpload[idx] || { state: "idle" as const };
                      const zoneBase =
                        "relative rounded-2xl border border-dashed px-6 py-8 shadow-sm transition-colors";
                      const zoneBg = "bg-[#1e3a5f] text-white";
                      const zoneBorder = "border-[#2563eb]";

                      if ((st.state === "done" || st.state === "idle") && b.src) {
                        return (
                          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={b.src}
                                  alt={b.alt || b.caption || "Uploaded figure"}
                                  style={{ maxHeight: 200 }}
                                  className="w-auto max-w-full rounded-xl border border-black/10 object-contain"
                                />
                                <div className="mt-2 text-xs text-slate-500">
                                  <span className="font-mono break-all">{b.src}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {b.public_id || String(b.src).includes("res.cloudinary.com") ? (
                                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Uploaded to Cloudinary
                                  </div>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFigureUpload((p) => ({ ...p, [idx]: { state: "idle" } }));
                                  }}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-sans font-semibold text-[#0f172a] transition-colors hover:bg-slate-50"
                                >
                                  Replace Image
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const f = e.dataTransfer.files?.[0];
                            if (f) void uploadFigureFile(idx, f);
                          }}
                          className={[zoneBase, zoneBorder, zoneBg].join(" ")}
                        >
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="absolute inset-0 cursor-pointer opacity-0"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void uploadFigureFile(idx, f);
                            }}
                          />
                          <div className="flex flex-col items-center justify-center gap-2 text-center">
                            <UploadCloud className="h-8 w-8 text-white/90" />
                            <div className="font-sans text-sm font-semibold">
                              Click to upload or drag &amp; drop
                            </div>
                            <div className="text-xs font-sans text-slate-200/90">
                              PNG, JPG, WEBP, SVG · Max 10MB
                            </div>
                          </div>

                          {st.state === "uploading" ? (
                            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                              <div className="text-xs font-sans text-slate-200/90">
                                {st.filename}
                              </div>
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-2 rounded-full bg-[#2563eb] transition-[width]"
                                  style={{ width: `${st.progress}%` }}
                                />
                              </div>
                            </div>
                          ) : null}

                          {st.state === "error" ? (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                              {st.message}
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                      <label className={labelBase}>CAPTION</label>
                      <input
                        value={b.caption || ""}
                        onChange={(e) => updateBlock(idx, { caption: e.target.value })}
                        placeholder="Figure 1 — Description of the figure"
                        className={inputBase}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                      <label className={labelBase}>ALT TEXT</label>
                      <input
                        value={b.alt || ""}
                        onChange={(e) => updateBlock(idx, { alt: e.target.value })}
                        placeholder="Accessible description for PDF/metadata"
                        className={inputBase}
                      />
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={save}
                        disabled={!dirty || saving}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-sans text-sm font-semibold text-[#0f172a] transition-colors hover:bg-slate-50 disabled:opacity-60"
                        title="Save chapter (includes this figure)"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              {b.type === "table" ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                    <label className={labelBase}>
                      Title
                    </label>
                    <input
                      value={b.title || ""}
                      onChange={(e) =>
                        updateBlock(idx, { title: e.target.value })
                      }
                      className={inputBase}
                    />
                  </div>

                  {(() => {
                    const tb = b as Extract<ChapterBlock, { type: "table" }>;
                    const cellBase =
                      "w-full rounded-lg border bg-white px-2 py-1 font-sans text-sm font-medium text-[#0f172a] outline-none placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-4 focus:ring-[rgba(37,99,235,0.15)]";
                    const isMissing = (v: unknown) => {
                      if (v === null || v === undefined) return true;
                      const s = String(v).trim();
                      if (!s) return true;
                      return s.toUpperCase() === "TBD";
                    };

                    function addColumn() {
                      const used = new Set(tb.columns.map((c) => c.key));
                      let n = tb.columns.length + 1;
                      while (used.has(`col${n}`)) n += 1;
                      const key = `col${n}`;
                      const nextCols = [...tb.columns, { key, label: `Column ${n}`, unit: "" }];
                      const nextRows = (tb.rows?.length ? tb.rows : [{}]).map((r) => ({
                        ...r,
                        [key]: "",
                      }));
                      updateBlock(idx, { columns: nextCols, rows: nextRows });
                    }

                    function deleteColumn(colKey: string) {
                      const nextCols = tb.columns.filter((c) => c.key !== colKey);
                      const nextRows = (tb.rows || []).map((r) => {
                        const next = { ...r };
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete (next as Record<string, unknown>)[colKey];
                        return next;
                      });
                      updateBlock(idx, { columns: nextCols, rows: nextRows });
                    }

                    function addRow() {
                      const baseRow: Record<string, string> = {};
                      for (const c of tb.columns) baseRow[c.key] = "";
                      const nextRows = [...(tb.rows || []), baseRow];
                      updateBlock(idx, { rows: nextRows });
                    }

                    function deleteRow(rIdx: number) {
                      const nextRows = (tb.rows || []).filter((_, i) => i !== rIdx);
                      updateBlock(idx, { rows: nextRows.length ? nextRows : [Object.fromEntries(tb.columns.map((c) => [c.key, ""]))] });
                    }

                    function updateCell(rIdx: number, colKey: string, value: string) {
                      const nextRows = [...(tb.rows || [])];
                      const row = { ...(nextRows[rIdx] || {}) };
                      row[colKey] = value;
                      nextRows[rIdx] = row;
                      updateBlock(idx, { rows: nextRows });
                    }

                    const colCount = tb.columns.length;
                    const gridCols = `40px repeat(${Math.max(1, colCount)}, minmax(140px, 1fr)) 44px`;
                    const previewOpen = !!tablePreviewOpen[idx];

                    return (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className={labelBase}>Column Header Row</div>
                            <button
                              type="button"
                              onClick={addColumn}
                              className="inline-flex items-center gap-2 rounded-full border border-[#2563eb] bg-white px-3 py-1.5 font-sans text-sm font-semibold text-[#2563eb] transition-colors hover:bg-blue-50"
                              title="Add column"
                            >
                              <Plus className="h-4 w-4" />
                              Add Column
                            </button>
                          </div>

                          <div className="mt-3 space-y-2">
                            {tb.columns.map((col, cIdx) => (
                              <div key={col.key} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_220px_44px]">
                                <input
                                  value={col.label}
                                  onChange={(e) => {
                                    const nextCols = [...tb.columns];
                                    nextCols[cIdx] = { ...nextCols[cIdx], label: e.target.value };
                                    updateBlock(idx, { columns: nextCols });
                                  }}
                                  className={[cellBase, "border-[#cbd5e1]"].join(" ")}
                                />
                                <input
                                  value={col.unit || ""}
                                  placeholder="unit (optional)"
                                  onChange={(e) => {
                                    const nextCols = [...tb.columns];
                                    nextCols[cIdx] = { ...nextCols[cIdx], unit: e.target.value };
                                    updateBlock(idx, { columns: nextCols });
                                  }}
                                  className={[cellBase, "border-[#cbd5e1]"].join(" ")}
                                />
                                <button
                                  type="button"
                                  onClick={() => deleteColumn(col.key)}
                                  className="h-9 w-9 rounded-lg border border-[#cbd5e1] p-2 text-[#ef4444] transition-colors hover:bg-red-50"
                                  title="Delete column"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
                          <div className={labelBase}>Row Data Section</div>
                          <div className="mt-3 overflow-auto rounded-xl border border-[#cbd5e1] bg-[#f8fafc] p-2">
                            <div className="min-w-[720px] space-y-2">
                              {(tb.rows?.length ? tb.rows : [Object.fromEntries(tb.columns.map((c) => [c.key, ""]))]).map((row, rIdx) => (
                                <div
                                  key={rIdx}
                                  className="grid items-center gap-2"
                                  style={{ gridTemplateColumns: gridCols }}
                                >
                                  <div className="text-right text-xs font-sans font-semibold text-slate-500">
                                    {rIdx + 1}
                                  </div>
                                  {tb.columns.map((c) => {
                                    const v = (row as Record<string, unknown>)[c.key];
                                    const missing = isMissing(v);
                                    return (
                                      <input
                                        key={c.key}
                                        value={v === null || v === undefined ? "" : String(v)}
                                        onChange={(e) => updateCell(rIdx, c.key, e.target.value)}
                                        className={[
                                          cellBase,
                                          missing ? "border-[#f59e0b]" : "border-[#cbd5e1]",
                                        ].join(" ")}
                                        style={{ background: "white" }}
                                      />
                                    );
                                  })}
                                  <button
                                    type="button"
                                    onClick={() => deleteRow(rIdx)}
                                    className="h-9 w-9 rounded-lg border border-[#cbd5e1] p-2 text-[#ef4444] transition-colors hover:bg-red-50"
                                    title="Delete row"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={addRow}
                              className="inline-flex items-center gap-2 rounded-full bg-[#10b981] px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
                            >
                              <Plus className="h-4 w-4" />
                              Add Row
                            </button>
                            <button
                              type="button"
                              onClick={save}
                              disabled={!dirty || saving}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-sans text-sm font-semibold text-[#0f172a] transition-colors hover:bg-slate-50 disabled:opacity-60"
                              title="Save chapter (includes this table)"
                            >
                              <Save className="h-4 w-4" />
                              Save
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
                          <label className={labelBase}>Footer note</label>
                          <input
                            value={tb.caption || ""}
                            onChange={(e) => updateBlock(idx, { caption: e.target.value })}
                            placeholder="Populate using experimental measurements…"
                            className={inputBase}
                          />
                        </div>

                        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
                          <button
                            type="button"
                            onClick={() =>
                              setTablePreviewOpen((p) => ({ ...p, [idx]: !previewOpen }))
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm font-semibold text-[#0f172a] transition-colors hover:bg-slate-50"
                          >
                            {previewOpen ? "Hide Preview Table" : "Preview Table"}
                          </button>
                          {previewOpen ? (
                            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                              <ChapterRenderer blocks={[tb]} />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : null}
            </div>
          </div>
            );
          })()
        ))}
      </section>
    </div>
  );
}

