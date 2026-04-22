"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

type Asset = {
  _id: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

function formatBytes(n: number) {
  if (!Number.isFinite(n)) return "";
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function MediaManager() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => assets, [assets]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/media/list");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "list_failed");
      setAssets(data.assets || []);
    } catch {
      setError("Failed to load media.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "upload_failed");
      await refresh();
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-[#0f172a] px-6 py-6 text-white">
          <div className="text-xs font-sans tracking-[0.16em] uppercase text-slate-300">
            Media
          </div>
          <h1 className="mt-1 font-sans text-[22px] font-bold tracking-tight">
            Media manager
          </h1>
          <p className="mt-2 text-sm font-sans leading-7 text-slate-200/90">
            Upload diagrams, FEA screenshots, and prototype photos. Click an asset to
            copy its URL for figure blocks.
          </p>
        </div>
      </header>

      <section
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="rounded-2xl border border-dashed border-[#2563eb] bg-[#1e293b] px-6 py-8 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-sans text-sm font-semibold text-white">
              Drag &amp; Drop or Click to Upload
            </div>
            <div className="mt-1 text-sm font-sans text-slate-200/90">
              PNG/JPG recommended. Stored locally for now.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="rounded-full bg-[#2563eb] px-4 py-2 font-sans text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Choose file"}
            </button>
          </div>
        </div>
        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="font-sans text-sm font-semibold">Assets</div>
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-sans text-sm text-[#0f172a] transition-colors hover:bg-slate-50"
              onClick={() => void refresh()}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-6 text-sm font-sans text-gray-600">
            Loading…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((a) => (
              <button
                key={a._id}
                type="button"
                onClick={() => void copyUrl(a.url)}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-md transition-colors hover:bg-slate-50"
                title="Click to copy URL"
              >
                <div className="absolute right-2 top-2 rounded-lg bg-red-50 px-2 py-1 text-xs font-sans font-semibold text-red-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Delete
                </div>
                <div className="relative aspect-[4/3] bg-gray-50">
                  <Image
                    src={a.url}
                    alt={a.filename}
                    fill
                    className="object-contain p-3"
                  />
                </div>
                <div className="px-4 py-3">
                  <div className="truncate font-sans text-sm font-bold text-[#0f172a]">
                    {a.filename}
                  </div>
                  <div className="mt-1 text-xs font-sans text-slate-500">
                    {formatBytes(a.sizeBytes)} ·{" "}
                    <span className="font-mono">{a.url}</span>
                  </div>
                  <div className="mt-2 text-xs font-sans text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                    Click to copy URL
                  </div>
                </div>
              </button>
            ))}
            {sorted.length === 0 ? (
              <div className="text-sm font-sans text-gray-600">
                No assets uploaded yet.
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

