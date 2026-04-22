import type { ChapterBlock } from "@/models/Chapter";

export type ChapterContentWarning = {
  code: string;
  message: string;
  blockIndex: number;
};

function isBlankLatex(latex: unknown) {
  return latex === undefined || latex === null || String(latex).trim() === "";
}

function isValidFigureSrc(src: unknown): boolean {
  if (src === undefined || src === null) return false;
  const s = String(src).trim();
  if (!s) return false;
  if (s.startsWith("https://") || s.startsWith("http://")) return true;
  if (s.startsWith("/") && s.length > 1) return true;
  return false;
}

export function auditChapterBlocks(blocks: ChapterBlock[]): ChapterContentWarning[] {
  const out: ChapterContentWarning[] = [];
  blocks.forEach((b, blockIndex) => {
    if (b.type === "equation" && isBlankLatex(b.latex)) {
      out.push({
        code: "empty_equation",
        message: "Equation block has empty LaTeX — add an expression or remove the block.",
        blockIndex,
      });
    }
    if (b.type === "figure" && !isValidFigureSrc(b.src)) {
      out.push({
        code: "figure_src",
        message:
          "Figure has no valid image URL — upload in admin (Cloudinary or absolute http(s) URL).",
        blockIndex,
      });
    }
    if (b.type === "table") {
      const dataRows = (b.rows || []).filter((row) =>
        b.columns.some((c) => {
          const v = row[c.key];
          return v !== null && v !== undefined && String(v).trim() !== "";
        })
      );
      if (dataRows.length === 0) {
        out.push({
          code: "table_no_rows",
          message: "Table has no data rows beyond headers — add rows or remove the block.",
          blockIndex,
        });
      }
    }
  });
  return out;
}
