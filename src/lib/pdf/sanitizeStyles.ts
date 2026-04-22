/**
 * Guards react-pdf / Yoga from NaN, Infinity, null, or absurd magnitudes that produce
 * errors like "unsupported number: -9.73e+21".
 */
export function sanitizeNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback;
  if (Math.abs(n) > 1e6) return fallback;
  return n;
}

/** Font sizes in pt — react-pdf is happiest with sensible integers. */
export function sanitizeFontSize(val: unknown, fallback = 11): number {
  const n = sanitizeNumber(val, fallback);
  const r = Math.round(n * 10) / 10;
  if (r < 6) return 6;
  if (r > 24) return 24;
  return r;
}

/** Line height multiplier (e.g. 1.5), not undefined. */
export function sanitizeLineHeight(val: unknown, fallback = 1.5): number {
  const n = sanitizeNumber(val, fallback);
  if (n < 1) return 1;
  if (n > 3) return 3;
  return n;
}

/** Table column width string: equal % columns, floored so sum ≤ 100. */
export function columnWidthPercent(columnCount: unknown): string {
  const n = Math.max(1, Math.floor(sanitizeNumber(columnCount, 1)));
  const pct = Math.floor(100 / n);
  return `${Math.min(100, Math.max(1, pct))}%`;
}

/** Safe hex for borders / text — invalid DB values must not reach the layout engine. */
export function sanitizeHexColor(val: unknown, fallback = "#2563eb"): string {
  if (typeof val !== "string") return fallback;
  const s = val.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s;
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

/** Safe string for <Text> — never pass null/undefined. */
export function safeText(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

/** Image max height/width in pt — clamps Mongo odd values. */
export function sanitizeDimension(val: unknown, fallback: number, min = 80, max = 480): number {
  const n = Math.round(sanitizeNumber(val, fallback));
  return Math.min(max, Math.max(min, n));
}
