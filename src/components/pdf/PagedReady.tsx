"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    __PDF_READY__?: boolean;
  }
}

export function PagedReady() {
  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Ensure fonts are loaded before pagination to avoid reflow
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fontsReady = (document as any).fonts?.ready;
      if (fontsReady) await fontsReady;

      const paged = await import("pagedjs");
      // pagedjs attaches a global PagedPolyfill
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const polyfill = (paged as any)?.PagedPolyfill ?? (window as any).PagedPolyfill;
      if (!polyfill?.preview) {
        // Fallback: mark ready so Puppeteer can still print raw DOM
        window.__PDF_READY__ = true;
        return;
      }

      await polyfill.preview();
      if (!cancelled) window.__PDF_READY__ = true;
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

