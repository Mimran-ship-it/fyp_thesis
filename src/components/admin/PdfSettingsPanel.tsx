"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Settings = {
  showCoverPage: boolean;
  showToc: boolean;
  equationNumberingMode: "chapter" | "sequential";
  authorName: string;
  supervisorName: string;
  degreeTitle: string;
  submissionYear: string;
  thesisTitleShort: string;
  accentColor: string;
  crestUrl?: string;
  sealUrl?: string;
  bodyFont: "Lora" | "Garamond" | "Times New Roman";
  uiFont: "Inter" | "Helvetica";
};

const DEFAULTS: Settings = {
  showCoverPage: true,
  showToc: true,
  equationNumberingMode: "chapter",
  authorName: "Author Name",
  supervisorName: "Supervisor Name",
  degreeTitle: "Bachelor of Engineering",
  submissionYear: new Date().getFullYear().toString(),
  thesisTitleShort: "Bio-Inspired Soft Robotic Gripper",
  accentColor: "#2563eb",
  bodyFont: "Lora",
  uiFont: "Inter",
};

export function PdfSettingsPanel() {
  const crestInput = useRef<HTMLInputElement | null>(null);
  const sealInput = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [initial, setInitial] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(initial),
    [settings, initial]
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pdf-settings");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "load_failed");
      const s = data.settings as Settings;
      setSettings({ ...DEFAULTS, ...s });
      setInitial({ ...DEFAULTS, ...s });
    } catch {
      setError("Failed to load PDF settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pdf-settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "save_failed");
      setInitial(settings);
    } catch {
      setError("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAndSet(file: File, field: "crestUrl" | "sealUrl") {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "upload_failed");
    setSettings((p) => ({ ...p, [field]: data.asset.url }));
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm font-sans text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="border-l-4 border-[#2563eb] pl-4">
          <div className="text-xs font-sans tracking-[0.16em] uppercase text-slate-500">
          Settings
          </div>
          <h1 className="mt-1 font-sans text-[22px] font-bold tracking-tight text-[#0f172a]">
          PDF settings
          </h1>
          <p className="mt-2 text-sm font-sans leading-7 text-slate-500">
          Controls cover page, TOC, typography, and branding for publication-quality export.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/print"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#2563eb] bg-white px-4 py-2 font-sans text-sm font-semibold text-[#2563eb] transition-colors hover:bg-blue-50"
          >
            Print preview (HTML)
          </a>
          <a
            href="/api/pdf"
            className="rounded-full bg-[#2563eb] px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Download PDF
          </a>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="rounded-full bg-[#2563eb] px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
        </div>
        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-sans text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="font-sans text-sm font-semibold text-[#1a1a1a]">
              Toggles
            </div>
            <label className="flex items-center gap-3 font-sans text-sm text-[#1a1a1a]">
              <input
                type="checkbox"
                checked={settings.showCoverPage}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, showCoverPage: e.target.checked }))
                }
              />
              Show cover page
            </label>
            <label className="flex items-center gap-3 font-sans text-sm text-[#1a1a1a]">
              <input
                type="checkbox"
                checked={settings.showToc}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, showToc: e.target.checked }))
                }
              />
              Show table of contents
            </label>

            <div className="mt-4">
              <div className="text-xs font-sans tracking-[0.16em] uppercase text-[#374151]">
                Equation numbering
              </div>
              <select
                value={settings.equationNumberingMode}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    equationNumberingMode: e.target.value as Settings["equationNumberingMode"],
                  }))
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-sans text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-600/10"
              >
                <option value="chapter">Chapter-based (3.1, 3.2…)</option>
                <option value="sequential">Sequential (1, 2, 3…)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="font-sans text-sm font-semibold text-[#1a1a1a]">
              Branding
            </div>
            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <div className="font-sans text-sm text-[#374151]">Accent color</div>
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, accentColor: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <div className="font-sans text-sm text-gray-600">Crest image</div>
              <div className="flex flex-wrap items-center gap-2">
                <input ref={crestInput} className="hidden" type="file" accept="image/*" />
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm font-semibold text-[#0f172a] transition-colors hover:bg-slate-50"
                  onClick={() => crestInput.current?.click()}
                >
                  Upload
                </button>
                <span className="font-mono text-xs text-gray-600">
                  {settings.crestUrl || "(none)"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] items-center gap-3">
              <div className="font-sans text-sm text-gray-600">Seal image</div>
              <div className="flex flex-wrap items-center gap-2">
                <input ref={sealInput} className="hidden" type="file" accept="image/*" />
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm font-semibold text-[#0f172a] transition-colors hover:bg-slate-50"
                  onClick={() => sealInput.current?.click()}
                >
                  Upload
                </button>
                <span className="font-mono text-xs text-gray-600">
                  {settings.sealUrl || "(none)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="font-sans text-sm font-semibold text-[#1a1a1a]">
          Metadata
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {([
            ["Author name", "authorName"],
            ["Supervisor name", "supervisorName"],
            ["Degree title", "degreeTitle"],
            ["Submission year", "submissionYear"],
            ["Thesis short title (running header)", "thesisTitleShort"],
          ] as const).map(([label, key]) => (
            <div key={key}>
              <div className="text-xs font-sans tracking-[0.16em] uppercase text-[#374151]">
                {label}
              </div>
              <input
                value={settings[key]}
                onChange={(e) =>
                  setSettings((p) => ({ ...p, [key]: e.target.value } as Settings))
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-sans text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-600/10"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <div className="font-sans text-sm font-semibold text-[#1a1a1a]">
          Fonts
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <div className="text-xs font-sans tracking-[0.16em] uppercase text-[#374151]">
              Body font
            </div>
            <select
              value={settings.bodyFont}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  bodyFont: e.target.value as Settings["bodyFont"],
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-sans text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-600/10"
            >
              <option value="Lora">Lora</option>
              <option value="Garamond">Garamond</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>
          <div>
            <div className="text-xs font-sans tracking-[0.16em] uppercase text-[#374151]">
              UI font
            </div>
            <select
              value={settings.uiFont}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  uiFont: e.target.value as Settings["uiFont"],
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-sans text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-600/10"
            >
              <option value="Inter">Inter</option>
              <option value="Helvetica">Helvetica</option>
            </select>
          </div>
        </div>
      </section>

      {/* Wire upload inputs */}
      <input
        ref={crestInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadAndSet(f, "crestUrl").catch(() => setError("Upload failed."));
        }}
      />
      <input
        ref={sealInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadAndSet(f, "sealUrl").catch(() => setError("Upload failed."));
        }}
      />
    </div>
  );
}

