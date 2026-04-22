import katex from "katex";

export function renderLatexToHtml(latex: string, displayMode = true) {
  return katex.renderToString(latex, {
    throwOnError: false,
    displayMode,
    strict: "ignore",
    output: "html",
  });
}

export function renderLatexToSvgDataUri(latex: string, displayMode = true) {
  // KaTeX types don't expose `output: "svg"` even though KaTeX supports SVG.
  const svg = katex.renderToString(
    latex,
    {
      throwOnError: false,
      displayMode,
      strict: "ignore",
      output: "svg",
    } as unknown as katex.KatexOptions
  );
  // KaTeX outputs <span>...<svg>..; extract the svg element.
  const match = svg.match(/<svg[\s\S]*<\/svg>/);
  const svgOnly = match ? match[0] : svg;
  const encoded = encodeURIComponent(svgOnly)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

