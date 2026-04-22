"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type TocItem = {
  slug: string;
  title: string;
  summary?: string;
};

export function TocSidebar({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  const slugs = useMemo(() => items.map((i) => i.slug), [items]);

  useEffect(() => {
    const els = slugs
      .map((s) => document.getElementById(s))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      {
        root: null,
        threshold: [0.1, 0.2, 0.4, 0.6],
        rootMargin: "-20% 0px -70% 0px",
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [slugs]);

  return (
    <aside className="hidden lg:block lg:sticky lg:top-0 lg:h-screen lg:overflow-auto">
      <div className="h-full border-r border-black/10 bg-white px-4 py-6">
        <div className="text-xs font-sans font-bold tracking-[0.16em] uppercase text-[#374151]">
          Table of Contents
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {items.map((c) => (
            <Link
              key={c.slug}
              href={`/#${c.slug}`}
              className={[
                "group relative rounded-lg px-3 py-2 transition-colors hover:bg-gray-50",
                active === c.slug ? "bg-gray-50" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute left-0 top-2 bottom-2 w-[3px] rounded-r transition-colors",
                  active === c.slug ? "bg-blue-600" : "bg-transparent",
                ].join(" ")}
              />
              <div className="font-sans text-sm font-semibold text-[#0f172a]">
                {c.title}
              </div>
              {c.summary ? (
                <div className="mt-0.5 text-xs leading-5 text-[#4b5563]">
                  {c.summary}
                </div>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}

