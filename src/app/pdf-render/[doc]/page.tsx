import { getPublishedChapters } from "@/lib/chapters";
import { getPdfSettings } from "@/lib/pdfSettings";
import { PdfDocument } from "@/components/pdf/PdfDocument";
import { PagedReady } from "@/components/pdf/PagedReady";
import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const THESIS_TITLE =
  "Design, Fabrication & Control of a Bio-Inspired Soft Robotic Gripping Mechanism";

function printCss(settings: Awaited<ReturnType<typeof getPdfSettings>>) {
  const bodyFont =
    settings.bodyFont === "Times New Roman"
      ? `"Times New Roman", Times, serif`
      : settings.bodyFont === "Garamond"
        ? `Garamond, "EB Garamond", serif`
        : `"Lora", Georgia, serif`;
  const uiFont =
    settings.uiFont === "Helvetica" ? `Helvetica, Arial, sans-serif` : `"Inter", Arial, sans-serif`;

  return `
/* Dedicated print stylesheet. Inline @import ensures fonts load in headless PDF. */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Lora:wght@400;600;700&display=swap');

:root{
  --ink:#1a1a1a;
  --muted:#6b7280;
  --accent:${settings.accentColor};
}

@page{
  size: A4;
  margin: 25mm 20mm 25mm 30mm;
  @top-left{
    content: "NUST · SMME · FYP Thesis";
    font-family: ${uiFont};
    font-size: 8pt;
    color: #64748b;
    letter-spacing: 0.08em;
    vertical-align: bottom;
    padding-bottom: 2pt;
    border-bottom: 0.5pt solid #e2e8f0;
    width: 100%;
  }
  @top-right{
    content: string(chapterName);
    font-family: ${uiFont};
    font-size: 8pt;
    color: #64748b;
    vertical-align: bottom;
    padding-bottom: 2pt;
    border-bottom: 0.5pt solid #e2e8f0;
  }
  @bottom-center{
    content: "— " counter(page) " —";
    font-family: ${uiFont};
    font-size: 8pt;
    color: #64748b;
  }
}

@page cover{
  size: A4;
  margin: 25mm 20mm 25mm 30mm;
  @top-left { content: none; border: none; }
  @top-right { content: none; border: none; }
  @bottom-center { content: none; }
}

@page toc{
  size: A4;
  margin: 25mm 20mm 25mm 30mm;
  @top-left { content: none; border: none; }
  @top-right { content: none; border: none; }
  @bottom-center { content: none; }
}

html,body{
  padding:0;
  margin:0;
  color: #1a1a1a;
  background:white;
}

.placeholder-block{
  border: 2px dashed #cbd5e1;
  border-radius: 4px;
  padding: 24px;
  text-align: center;
  color: #94a3b8;
  font-style: italic;
  font-size: 10pt;
  margin: 16px 0;
  background: #f8fafc;
  font-family: ${bodyFont};
}

.pdf-root{
  font-family: ${bodyFont};
  font-size: 11pt;
  line-height: 1.5;
  color: #1a1a1a;
}

.pdf-root{
  string-set: thesisShort "${settings.thesisTitleShort}";
}
.pdf-chapter{
  string-set: chapterName attr(data-chapter-name);
}

.pdf-cover{
  page: cover;
  break-after: page;
  height: 100%;
  display:flex;
  flex-direction:column;
}
.pdf-toc.no-header-footer{
  page: toc;
  break-after: page;
}

.pdf-cover-top{ display:flex; justify-content:center; }
.pdf-crest{ width:42mm; height:42mm; display:flex; align-items:center; justify-content:center;}
.pdf-crest img{ max-width:100%; max-height:100%; }
.pdf-crest-ph{ width:100%; height:100%; border:1px solid #cbd5e1; display:flex; align-items:center; justify-content:center; font-family:${uiFont}; font-size:9pt; color:var(--muted);}

.pdf-cover-center{ margin-top: 16mm; text-align:center; }
.pdf-cover-uni{ font-family:${uiFont}; font-size:11pt; font-variant-caps: all-small-caps; letter-spacing:0.14em; color:var(--ink); }
.pdf-cover-school{ font-family:${uiFont}; font-size:10pt; margin-top:3mm; color:var(--ink); }
.pdf-rule-thick{ height:2px; background:var(--ink); margin:8mm auto 6mm; width: 80%; }
.pdf-cover-title{ font-family:${bodyFont}; font-size:26pt; font-weight:700; line-height:1.15; margin:0 auto; max-width: 140mm; }
.pdf-rule-thin{ height:1px; background:#334155; margin:6mm auto 6mm; width: 70%; opacity:0.7;}
.pdf-cover-sub{ font-family:${uiFont}; font-size:10pt; color:var(--ink); max-width: 150mm; margin: 0 auto; }
.pdf-cover-meta{ margin: 10mm auto 0; border-collapse: collapse; font-family:${uiFont}; font-size:10pt; }
.pdf-cover-meta td{ padding: 2mm 6mm; }
.pdf-cover-meta td:first-child{ font-variant-caps: all-small-caps; letter-spacing:0.06em; color:var(--muted); text-align:right;}
.pdf-cover-meta td:last-child{ text-align:left; }
.pdf-cover-bottom{ margin-top:auto; display:flex; justify-content:center; padding-top:10mm;}
.pdf-seal{ width:36mm; height:36mm; display:flex; align-items:center; justify-content:center;}
.pdf-seal img{ max-width:100%; max-height:100%; }
.pdf-seal-ph{ width:100%; height:100%; border:1px solid #cbd5e1; display:flex; align-items:center; justify-content:center; font-family:${uiFont}; font-size:9pt; color:var(--muted);}

.pdf-toc-title{
  font-family:${uiFont};
  font-size:14pt;
  font-variant-caps: all-small-caps;
  letter-spacing:0.12em;
  border-bottom: 0.5pt solid #cbd5e1;
  padding-bottom: 3mm;
  margin: 0 0 6mm;
}
.pdf-toc-list{ list-style:none; padding:0; margin:0; }
.pdf-toc-item{ margin: 0 0 2.5mm; }
.pdf-toc-link{
  display:flex;
  gap:6mm;
  text-decoration:none;
  color: var(--ink);
  font-family:${uiFont};
  font-size:11pt;
}
.pdf-toc-left{ flex: 1 1 auto; }
.pdf-toc-no{ font-variant-caps: all-small-caps; letter-spacing:0.06em; color: var(--muted); }
.pdf-toc-link::after{
  content: leader('.') " " target-counter(attr(href), page);
  font-family:${uiFont};
  font-size:11pt;
  color: var(--ink);
}

.pdf-lox{ break-after: page; }
.pdf-lox-list{ list-style:none; padding:0; margin:0; }
.pdf-lox-item{ margin: 0 0 2.5mm; }
.pdf-lox-link{
  display:flex;
  gap:6mm;
  text-decoration:none;
  color: var(--ink);
  font-family:${uiFont};
  font-size:11pt;
}
.pdf-lox-left{ flex: 1 1 auto; }
.pdf-lox-no{ font-weight:700; }
.pdf-lox-link::after{
  content: leader('.') " " target-counter(attr(href), page);
  font-family:${uiFont};
  font-size:11pt;
  color: var(--ink);
}
.pdf-lox-empty{ font-family:${uiFont}; color: var(--muted); }

.pdf-chapter{
  page-break-before: always;
  break-before: page;
  padding-top: 48px;
}

.pdf-body p,
.pdf-body .pdf-p{
  margin-top: 0;
  margin-bottom: 8pt;
  text-indent: 1.5em;
  text-align: justify;
  color: #1a1a1a;
  line-height: 1.5;
  font-size: 11pt;
}
.pdf-body p:first-of-type,
.pdf-body .pdf-p:first-of-type{
  text-indent: 0;
}
.pdf-chapter-heading + .pdf-p,
.pdf-body .pdf-h2 + .pdf-p,
.pdf-body .pdf-h3 + .pdf-p{
  text-indent: 0;
}

.pdf-chapter-heading{
  margin: 0 0 18pt;
}
.pdf-chapter-label{
  font-family: ${uiFont};
  font-size: 9pt;
  letter-spacing: 0.2em;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 6pt;
}

.pdf-h1{
  font-family: ${uiFont};
  font-size: 22pt;
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-left: 5px solid var(--accent);
  padding-left: 12px;
  margin: 0 0 24pt;
  color: #0f172a;
  line-height: 1.2;
}

.pdf-h2{
  font-family: ${uiFont};
  font-size: 13pt;
  font-weight: 700;
  text-align: left;
  color: #0f172a;
  margin-top: 18pt;
  margin-bottom: 8pt;
  padding-bottom: 3pt;
  border-bottom: 1px solid #e2e8f0;
}

.pdf-h3{
  font-family: ${bodyFont};
  font-size: 11pt;
  font-weight: 700;
  font-style: italic;
  color: #1e3a5f;
  margin-top: 12pt;
  margin-bottom: 6pt;
}

.pdf-equation-outer{
  margin: 0;
}

.pdf-equation-wrapper{
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 18px 56px;
  margin: 18pt 0 4pt 0;
  page-break-inside: avoid;
  break-inside: avoid;
}
.pdf-equation-content{
  flex: 1;
  text-align: center;
}
.pdf-equation-content .katex,
.pdf-equation-content .katex * {
  color: #1a1a1a !important;
  fill: #1a1a1a !important;
  font-size: 12pt;
}
.pdf-equation-number{
  position: absolute;
  right: 16px;
  font-family: ${bodyFont};
  font-size: 11pt;
  color: #374151;
}
.pdf-equation-caption{
  text-align: center;
  font-style: italic;
  font-size: 9.5pt;
  color: #4b5563;
  margin-top: 4pt;
  margin-bottom: 16pt;
  font-family: ${bodyFont};
}

.katex svg, .katex svg * { fill: #1a1a1a !important; stroke: #1a1a1a !important; }
.katex-display { margin: 0; }

.pdf-table-figure{
  margin: 8pt 0 16pt 0;
  break-inside: avoid;
  page-break-inside: avoid;
}
.pdf-table-caption{
  font-family: ${uiFont};
  font-size: 9.5pt;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4pt;
  margin-top: 0;
}
.pdf-table{
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 8pt 0;
  font-size: 10.5pt;
  font-family: ${uiFont};
  page-break-inside: avoid;
  break-inside: avoid;
}
.pdf-table thead tr{
  border-top: 2px solid #0f172a;
  border-bottom: 1.5px solid #0f172a;
}
.pdf-table tbody tr:last-child{
  border-bottom: 2px solid #0f172a;
}
.pdf-table td,
.pdf-table th{
  border: none;
  padding: 7pt 10pt;
  text-align: left;
  color: #1a1a1a;
}
.pdf-table thead th{
  font-weight: 700;
  font-size: 10pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: transparent;
  color: #0f172a;
}
.pdf-table tbody tr:nth-child(even){
  background: #f8fafc;
}
.pdf-table td.tbd{
  color: #b45309;
  font-style: italic;
}
.pdf-table-footnote{
  font-family: ${bodyFont};
  font-size: 9.5pt;
  color: #4b5563;
  text-align: center;
  font-style: italic;
  margin: 4pt 0 0 0;
}
.pdf-unit{ opacity:0.85; font-weight:600; }

.pdf-figure{
  break-inside: avoid;
  page-break-inside: avoid;
  text-align:center;
  margin: 16pt 0;
}
.pdf-figure-img{
  max-width: 90%;
  max-height: 400px;
  object-fit: contain;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  display:block;
  margin: 0 auto;
}
.pdf-figure-caption{
  font-family: ${bodyFont};
  font-size: 9.5pt;
  font-style: italic;
  font-weight: 600;
  text-align: center;
  color: #374151;
  border-top: 1px solid #e2e8f0;
  padding-top: 6pt;
  margin-top: 6pt;
}
.pdf-figure-no{ font-weight: 700; font-style: normal; }

.pdf-references{
  break-before: page;
  padding-top: 30mm;
}
.pdf-ref-title{
  font-family:${uiFont};
  font-size:14pt;
  font-variant-caps: all-small-caps;
  letter-spacing:0.12em;
  border-bottom: 0.5pt solid #cbd5e1;
  padding-bottom: 3mm;
  margin: 0 0 6mm;
}
.pdf-ref-list{
  font-family:${bodyFont};
  font-size:10pt;
  line-height:1.4;
  padding-left: 5mm;
}
.pdf-ref-list li{
  padding-left: 6mm;
  text-indent: -6mm;
  margin: 0 0 2mm;
}
`;
}

export default async function PdfRenderDocPage({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  // For now, only one document id is supported.
  if (doc !== "thesis") {
    // minimal render (still valid)
  }

  const [chapters, settings] = await Promise.all([
    getPublishedChapters(),
    getPdfSettings(),
  ]);

  const katexCssPath = path.join(
    process.cwd(),
    "node_modules",
    "katex",
    "dist",
    "katex.min.css"
  );
  const katexCss = await readFile(katexCssPath, "utf8");

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>PDF Render</title>
        <style dangerouslySetInnerHTML={{ __html: katexCss + "\n" + printCss(settings) }} />
      </head>
      <body>
        <PagedReady />
        <PdfDocument chapters={chapters} settings={settings} title={THESIS_TITLE} />
      </body>
    </html>
  );
}

