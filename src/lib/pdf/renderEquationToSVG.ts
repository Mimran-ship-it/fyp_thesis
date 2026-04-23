import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";
import { getEquationSvgContainerWidthPt } from "@/lib/pdf/pdfEquationLayout";
import type { PdfEquationVector, PdfSvgNode, PdfSvgProps } from "@/lib/pdf/pdfEquationVector";

const MATH_COLOR = "#1a1a1a";

let mj: {
  adaptor: ReturnType<typeof liteAdaptor>;
  doc: ReturnType<typeof mathjax.document>;
} | null = null;

function getMathJax() {
  if (mj) return mj;
  const adaptor = liteAdaptor({ fontSize: 16 });
  RegisterHTMLHandler(adaptor);
  const tex = new TeX({
    packages: AllPackages,
    maxMacros: 20000,
  });
  const svgJax = new SVG({ fontCache: "none" });
  const doc = mathjax.document("", { InputJax: tex, OutputJax: svgJax });
  mj = { adaptor, doc };
  return mj;
}

function findSvg(adaptor: ReturnType<typeof liteAdaptor>, node: unknown): unknown | null {
  if (!node) return null;
  const kind = adaptor.kind(node as never);
  if (kind === "svg") return node;
  for (const c of adaptor.childNodes(node as never) || []) {
    const found = findSvg(adaptor, c);
    if (found) return found;
  }
  return null;
}

function kebabToCamel(name: string): string {
  return name.replace(/-([a-z])/gi, (_, ch: string) => ch.toUpperCase());
}

function normalizeColor(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (v === "currentColor") return MATH_COLOR;
  return v;
}

function collectProps(adaptor: ReturnType<typeof liteAdaptor>, node: unknown): PdfSvgProps {
  const props: PdfSvgProps = {};
  const list = adaptor.allAttributes(node as never) as { name: string; value: string }[];
  for (const { name, value } of list) {
    if (name === "xmlns" || name.startsWith("xmlns:")) continue;
    if (name === "class" || name === "role" || name === "focusable" || name.startsWith("data-"))
      continue;
    if (name === "style") continue;
    const key = kebabToCamel(name);
    if (key === "width" || key === "height" || key === "x" || key === "y" || key === "rx" || key === "ry") {
      const n = parseFloat(value);
      props[key] = Number.isFinite(n) ? n : value;
      continue;
    }
    if (
      key === "strokeWidth" ||
      key === "opacity" ||
      key === "strokeOpacity" ||
      key === "fillOpacity" ||
      key === "r" ||
      key === "cx" ||
      key === "cy" ||
      key === "rx" ||
      key === "ry" ||
      key === "x1" ||
      key === "y1" ||
      key === "x2" ||
      key === "y2"
    ) {
      const n = parseFloat(value);
      props[key] = Number.isFinite(n) ? n : value;
      continue;
    }
    if (key === "fill" || key === "stroke") {
      props[key] = normalizeColor(value) ?? value;
      continue;
    }
    props[key] = value;
  }
  return props;
}

let keySeq = 0;
function nextKey() {
  keySeq += 1;
  return `mj${keySeq}`;
}

function liteToPdfNodes(
  adaptor: ReturnType<typeof liteAdaptor>,
  node: unknown
): PdfSvgNode | null {
  if (!node) return null;
  const kind = adaptor.kind(node as never);
  if (kind === "#text" || kind === "#comment") return null;

  const childrenRaw = adaptor.childNodes(node as never) || [];
  const children = childrenRaw
    .map((c) => liteToPdfNodes(adaptor, c))
    .filter((c): c is PdfSvgNode => Boolean(c));

  const props = collectProps(adaptor, node);

  switch (kind) {
    case "path": {
      const d = typeof props.d === "string" ? props.d : String(props.d ?? "");
      if (!d.trim()) return null;
      delete props.d;
      return { t: "path", key: nextKey(), props: { ...props, d } };
    }
    case "rect": {
      if (props.width === undefined || props.height === undefined) {
        return children.length ? { t: "g", key: nextKey(), props: {}, children } : null;
      }
      return { t: "rect", key: nextKey(), props } as PdfSvgNode;
    }
    case "line":
      if (props.x1 === undefined || props.y1 === undefined || props.x2 === undefined || props.y2 === undefined) {
        return children.length ? { t: "g", key: nextKey(), props: {}, children } : null;
      }
      return { t: "line", key: nextKey(), props: props as never };
    case "circle":
      if (props.r === undefined) return children.length ? { t: "g", key: nextKey(), props: {}, children } : null;
      return { t: "circle", key: nextKey(), props: props as never };
    case "ellipse":
      if (props.rx === undefined || props.ry === undefined) {
        return children.length ? { t: "g", key: nextKey(), props: {}, children } : null;
      }
      return { t: "ellipse", key: nextKey(), props: props as never };
    case "polygon":
      if (typeof props.points !== "string" || !props.points.trim()) {
        return children.length ? { t: "g", key: nextKey(), props: {}, children } : null;
      }
      return { t: "polygon", key: nextKey(), props: props as never };
    case "polyline":
      if (typeof props.points !== "string" || !props.points.trim()) {
        return children.length ? { t: "g", key: nextKey(), props: {}, children } : null;
      }
      return { t: "polyline", key: nextKey(), props: props as never };
    case "defs":
      return { t: "defs", key: nextKey(), props, children };
    case "clippath":
      return { t: "clipPath", key: nextKey(), props, children };
    case "g":
      return { t: "g", key: nextKey(), props, children };
    default:
      if (children.length) {
        return { t: "g", key: nextKey(), props: {}, children };
      }
      return null;
  }
}

/** Standard SVG viewBox "min-x min-y width height" from MathJax. */
function parseSvgViewBoxString(viewBox: string): {
  minX: number;
  minY: number;
  w: number;
  h: number;
} | null {
  const parts = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  if (parts.length !== 4) return null;
  const [minX, minY, w, h] = parts;
  if (!(w > 0) || !(h > 0)) return null;
  return { minX, minY, w, h };
}

/**
 * If the DB stored TeX with doubled backslashes before commands (`\\frac`), collapse to `\frac`.
 * Skips pairs where the character after `\\` is not a command start (keeps matrix row `\\` before `&`, newline, etc.).
 */
function normalizeDbLatexEscapes(s: string): string {
  const out: string[] = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && s[i + 1] === "\\") {
      const nxt = s[i + 2];
      if (nxt !== undefined && /[a-zA-Z@]/.test(nxt)) {
        out.push("\\");
        i++;
        continue;
      }
    }
    out.push(s[i]!);
  }
  return out.join("");
}

/** DB exports sometimes escape subscript underscores as `\_`; MathJax needs plain `_` (e.g. `C_{10}`). */
function normalizeSubscriptUnderscores(s: string): string {
  return s.replace(/\\_/g, "_");
}

/**
 * Common typo: `\frac{1}{\kappa)(1-\cos` (parenthesis closes the denominator) instead of `\frac{1}{\kappa}(1-\cos`.
 */
function fixKappaDenominatorParenTypo(s: string): string {
  return s.replace(/\\frac\{1\}\{\\kappa\)\(1-\\cos\(/g, "\\frac{1}{\\kappa}(1-\\cos(");
}

function wrapDisplayStyle(tex: string): string {
  const t = tex.trim();
  if (/^\\displaystyle\s*\{/i.test(t) || /^\\displaystyle\b/i.test(t)) return t;
  return `\\displaystyle{${t}}`;
}

/**
 * Converts LaTeX to a vector tree for @react-pdf (MathJax SVG, fontCache none).
 */
export function renderEquationToSVG(
  latex: string,
  displayMode = true
): PdfEquationVector | null {
  const trimmed = typeof latex === "string" ? latex.trim() : "";
  if (!trimmed) return null;

  const rawForLog = trimmed;
  let normalized = normalizeDbLatexEscapes(trimmed);
  normalized = normalizeSubscriptUnderscores(normalized);
  normalized = fixKappaDenominatorParenTypo(normalized);
  const texIn = displayMode ? wrapDisplayStyle(normalized) : normalized;

  try {
    keySeq = 0;
    const { adaptor, doc } = getMathJax();

    const containerWidthPt = getEquationSvgContainerWidthPt();
    const containerWidthPx = Math.max(80, Math.round(containerWidthPt * (96 / 72)));

    // Do not pass `end: false`: MathJax compares `item.priority > end`; `false` coerces to `0`, so
    // every render step is skipped and `convert` returns null (breaks PDF on Vercel and locally).
    const root = doc.convert(texIn, {
      display: displayMode,
      em: 16,
      ex: 8,
      containerWidth: containerWidthPx,
      lineWidth: 1000000,
    });
    const svg = findSvg(adaptor, root);
    if (!svg) return null;

    const viewBoxStr = adaptor.getAttribute(svg as never, "viewBox") || "0 0 100 50";
    const parsed = parseSvgViewBoxString(viewBoxStr);
    if (!parsed) return null;

    /**
     * MathJax viewBox is often `minX minY width height` with minY negative (flip + vertical align).
     * @react-pdf treats viewBox `{ maxX, maxY }` as **width/height**, not corners (see
     * resolveAspectRatio in @react-pdf/render). We normalize to 0,0 + width,height and
     * pre-translate children so nothing clips.
     */
    const viewBoxRect = { minX: 0, minY: 0, maxX: parsed.w, maxY: parsed.h };

    const topChildren = (adaptor.childNodes(svg as never) || [])
      .map((c) => liteToPdfNodes(adaptor, c))
      .filter((c): c is PdfSvgNode => Boolean(c));

    if (!topChildren.length) return null;

    const tx = -parsed.minX;
    const ty = -parsed.minY;
    const children: PdfSvgNode[] =
      tx !== 0 || ty !== 0
        ? [
            {
              t: "g",
              key: "mj-viewbox-shift",
              props: { transform: `translate(${tx}, ${ty})` },
              children: topChildren,
            },
          ]
        : topChildren;

    return {
      viewBox: viewBoxRect,
      viewBoxWidth: parsed.w,
      viewBoxHeight: parsed.h,
      children,
    };
  } catch (err) {
    console.error("MathJax SVG equation failed.", {
      rawFromDb: rawForLog,
      afterNormalize: normalized,
      sentToMathJax: texIn,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
