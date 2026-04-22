import type { ChapterBlock } from "../models/Chapter";

/**
 * Canonical thesis terminology (NUST PDF / content consistency).
 * Applied on chapter save and via migration script.
 */
export function normalizeThesisText(input: string): string {
  let s = input;
  // Ecoflex 00-30 (long form first; avoid duplicating "00-30")
  s = s.replace(/\bEco[-\s]?Flex\s*00[-\s]*30\b/gi, "Ecoflex 00-30");
  s = s.replace(/\bEcoflex\s*00[-\s]*30\b/gi, "Ecoflex 00-30");
  s = s.replace(/\bEco[-\s]?Flex\b/gi, "Ecoflex 00-30");
  s = s.replace(/\bEcoflex\b(?!\s*00[-\s]*30\b)/gi, "Ecoflex 00-30");
  s = s.replace(/\becoflex\b(?!\s*00[-\s]*30\b)/g, "Ecoflex 00-30");

  // Pneu-Net
  s = s.replace(/\bPneu\s*Net\b/g, "Pneu-Net");
  s = s.replace(/\bpneu[-\s]?net\b/gi, "Pneu-Net");
  s = s.replace(/\bPneuNet\b/g, "Pneu-Net");

  // Model C
  s = s.replace(/\bmodel\s+c\b/gi, "Model C");

  // Arduino Mega
  s = s.replace(/\bArduino\s+Mega\b/g, "Arduino Mega");
  s = s.replace(/\barduino\s+mega\b/gi, "Arduino Mega");

  // Festo (not all-caps FESTO)
  s = s.replace(/\bFESTO\b/g, "Festo");

  return s;
}

export function normalizeChapterBlocks(blocks: ChapterBlock[]): ChapterBlock[] {
  if (!Array.isArray(blocks)) return blocks;
  return blocks.map((b): ChapterBlock => {
    if (!b || typeof b !== "object") return b as ChapterBlock;
    if (b.type === "heading") {
      return { ...b, text: normalizeThesisText(b.text) };
    }
    if (b.type === "paragraph") {
      return { ...b, text: normalizeThesisText(b.text) };
    }
    if (b.type === "equation") {
      return {
        ...b,
        latex: typeof b.latex === "string" ? normalizeThesisText(b.latex) : b.latex,
        caption:
          typeof b.caption === "string" ? normalizeThesisText(b.caption) : b.caption,
        label: typeof b.label === "string" ? normalizeThesisText(b.label) : b.label,
      };
    }
    if (b.type === "figure") {
      return {
        ...b,
        caption: typeof b.caption === "string" ? normalizeThesisText(b.caption) : b.caption,
        alt: typeof b.alt === "string" ? normalizeThesisText(b.alt) : b.alt,
      };
    }
    if (b.type === "table") {
      const title =
        typeof b.title === "string" ? normalizeThesisText(b.title) : b.title;
      const caption =
        typeof b.caption === "string" ? normalizeThesisText(b.caption) : b.caption;
      const columns = Array.isArray(b.columns)
        ? b.columns.map((col) => ({
            ...col,
            label: typeof col.label === "string" ? normalizeThesisText(col.label) : col.label,
            unit: typeof col.unit === "string" ? normalizeThesisText(col.unit) : col.unit,
          }))
        : b.columns;
      const rows = Array.isArray(b.rows)
        ? b.rows.map((row) => {
            const next: Record<string, string | number | null> = { ...row };
            for (const k of Object.keys(next)) {
              const v = next[k];
              if (typeof v === "string") next[k] = normalizeThesisText(v);
            }
            return next;
          })
        : b.rows;
      return { ...b, title, caption, columns, rows };
    }
    return b;
  });
}
