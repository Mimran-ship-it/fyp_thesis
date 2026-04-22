import { renderLatexToHtml } from "@/lib/latex";
import type { ChapterDoc, ChapterBlock, TableBlock } from "@/models/Chapter";
import type { PdfSettingsDoc } from "@/models/PdfSettings";
import type { CSSProperties } from "react";

function escapeId(s: string) {
  return s.replace(/[^a-zA-Z0-9-_]/g, "-");
}

function isTbd(v: unknown) {
  if (v === null || v === undefined) return false;
  return String(v).trim().toUpperCase() === "TBD";
}

function sanitizeParagraphText(text: string) {
  return text.replace(/(\s*<br\s*\/?>\s*){2,}/gi, " ").replace(/^(<br\s*\/?>\s*)+|(\s*<br\s*\/?>)+$/gi, "");
}

function PlaceholderBlock({ label }: { label: string }) {
  return (
    <div className="placeholder-block">
      <span>{label}</span>
    </div>
  );
}

function isValidFigureSrc(src: unknown): boolean {
  if (src === undefined || src === null) return false;
  const s = String(src).trim();
  if (!s || s === "undefined" || s === "null") return false;
  if (s.startsWith("https://") || s.startsWith("http://")) return true;
  if (s.startsWith("/") && s.length > 1) return true;
  return false;
}

function Paragraph({ text }: { text: string }) {
  const clean = sanitizeParagraphText(text);
  if (!clean.trim()) {
    return <PlaceholderBlock label="[ Paragraph placeholder — add text in admin ]" />;
  }
  return <p className="pdf-p">{clean}</p>;
}

function Heading({
  level,
  text,
  anchor,
  chapterNumber,
}: {
  level: 1 | 2 | 3;
  text: string;
  anchor?: string;
  chapterNumber?: number;
}) {
  if (level === 1) {
    return (
      <div id={anchor} className="pdf-chapter-heading">
        <div className="pdf-chapter-label">CHAPTER {chapterNumber ?? ""}</div>
        <h1 className="pdf-h1">{text}</h1>
      </div>
    );
  }
  if (level === 2) {
    return (
      <h2 id={anchor} className="pdf-h2">
        {text}
      </h2>
    );
  }
  return (
    <h3 id={anchor} className="pdf-h3">
      {text}
    </h3>
  );
}

function Equation({
  latex,
  caption,
  numberLabel,
}: {
  latex: string;
  caption?: string;
  numberLabel: string;
}) {
  const trimmed = (latex || "").trim();
  if (!trimmed) {
    return (
      <div className="pdf-equation-outer">
        <PlaceholderBlock label="[ Equation placeholder — add LaTeX in admin ]" />
      </div>
    );
  }

  let html = "";
  try {
    html = renderLatexToHtml(trimmed, true);
  } catch (e) {
    console.error("KaTeX render failed for LaTeX:", trimmed, e);
    html = `<span class="katex-error">Equation render error</span>`;
  }

  return (
    <div className="pdf-equation-outer">
      <div className="pdf-equation-wrapper">
        <div className="pdf-equation-content" dangerouslySetInnerHTML={{ __html: html }} />
        <span className="pdf-equation-number">{numberLabel}</span>
      </div>
      {caption ? <p className="pdf-equation-caption">{caption}</p> : null}
    </div>
  );
}

function Table({
  block,
  label,
  anchorId,
}: {
  block: TableBlock;
  label: string;
  anchorId: string;
}) {
  const dataRows = (block.rows || []).filter((row) =>
    block.columns.some((c) => {
      const v = row[c.key];
      return v !== null && v !== undefined && String(v).trim() !== "";
    })
  );

  const titlePart = (block.title || "").trim();
  const capText = titlePart ? `${label} — ${titlePart}` : label;

  if (dataRows.length === 0) {
    return (
      <figure className="pdf-table-figure" id={anchorId}>
        <p className="pdf-table-caption">{capText}</p>
        <PlaceholderBlock label="[ Table placeholder — add data rows in admin ]" />
      </figure>
    );
  }

  return (
    <figure className="pdf-table-figure" id={anchorId}>
      <p className="pdf-table-caption">{capText}</p>
      <table className="pdf-table">
        <thead>
          <tr>
            {block.columns.map((c) => (
              <th key={c.key}>
                {c.label}
                {c.unit ? <span className="pdf-unit"> ({c.unit})</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, idx) => (
            <tr key={idx}>
              {block.columns.map((c) => {
                const v = row[c.key];
                return (
                  <td key={c.key} className={isTbd(v) ? "tbd" : undefined}>
                    {v ?? ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {block.caption ? <p className="pdf-table-footnote">{block.caption}</p> : null}
    </figure>
  );
}

function Figure({
  src,
  caption,
  alt,
  label,
  anchorId,
}: {
  src?: string;
  caption?: string;
  alt?: string;
  label: string;
  anchorId: string;
}) {
  const ok = isValidFigureSrc(src);
  return (
    <figure className="pdf-figure" id={anchorId}>
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="pdf-figure-img" src={String(src).trim()} alt={alt || caption || "Figure"} />
      ) : (
        <div className="placeholder-block">
          <span>[ Figure placeholder — upload image in admin ]</span>
        </div>
      )}
      <figcaption className="pdf-figure-caption">
        <span className="pdf-figure-no">{label} — </span>
        {caption || ""}
      </figcaption>
    </figure>
  );
}

function renderBlocks({
  blocks,
  chapterNumber,
  eqLabelByKey,
  figLabelByKey,
  tabLabelByKey,
  figAnchorByKey,
  tabAnchorByKey,
  chapterSlug,
}: {
  blocks: ChapterBlock[];
  chapterNumber: number;
  chapterSlug: string;
  eqLabelByKey: Record<string, string>;
  figLabelByKey: Record<string, string>;
  tabLabelByKey: Record<string, string>;
  figAnchorByKey: Record<string, string>;
  tabAnchorByKey: Record<string, string>;
}) {
  return blocks.map((b, i) => {
    const key = `${chapterSlug}:${i}`;
    if (b.type === "heading")
      return (
        <Heading
          key={i}
          level={b.level}
          text={b.text}
          anchor={b.anchor || undefined}
          chapterNumber={b.level === 1 ? chapterNumber : undefined}
        />
      );
    if (b.type === "paragraph") return <Paragraph key={i} text={b.text} />;
    if (b.type === "equation")
      return (
        <Equation
          key={i}
          latex={b.latex}
          caption={b.caption}
          numberLabel={eqLabelByKey[key] || "(?)"}
        />
      );
    if (b.type === "table")
      return (
        <Table
          key={i}
          block={b as TableBlock}
          label={tabLabelByKey[key] || "Table ?"}
          anchorId={tabAnchorByKey[key] || `tab-${escapeId(key)}`}
        />
      );
    if (b.type === "figure")
      return (
        <Figure
          key={i}
          src={b.src}
          caption={b.caption}
          alt={b.alt}
          label={figLabelByKey[key] || "Figure ?"}
          anchorId={figAnchorByKey[key] || `fig-${escapeId(key)}`}
        />
      );
    return null;
  });
}

export function PdfDocument({
  chapters,
  settings,
  title,
}: {
  chapters: ChapterDoc[];
  settings: PdfSettingsDoc;
  title: string;
}) {
  const eqLabelByKey: Record<string, string> = {};
  const figLabelByKey: Record<string, string> = {};
  const tabLabelByKey: Record<string, string> = {};
  const figAnchorByKey: Record<string, string> = {};
  const tabAnchorByKey: Record<string, string> = {};

  let eqGlobal = 0;

  const figures: Array<{
    key: string;
    label: string;
    caption: string;
    anchorId: string;
  }> = [];
  const tables: Array<{
    key: string;
    label: string;
    title: string;
    anchorId: string;
  }> = [];

  for (const c of chapters) {
    const chapNo = c.chapterNumber;
    let eqChap = 0;
    let figChap = 0;
    let tabChap = 0;

    c.blocks.forEach((b, i) => {
      const key = `${c.slug}:${i}`;
      if (b.type === "equation") {
        const latex = (b.latex || "").trim();
        if (!latex) return;
        if (settings.equationNumberingMode === "sequential") {
          eqGlobal += 1;
          eqLabelByKey[key] = `(${eqGlobal})`;
        } else {
          eqChap += 1;
          eqLabelByKey[key] = `(${chapNo}.${eqChap})`;
        }
      }

      if (b.type === "figure") {
        figChap += 1;
        const label = `Figure ${chapNo}.${figChap}`;
        const anchorId = `fig-${chapNo}-${figChap}`;
        figLabelByKey[key] = label;
        figAnchorByKey[key] = anchorId;
        figures.push({
          key,
          label,
          caption: (b.caption || "").trim() || "(No caption)",
          anchorId,
        });
      }

      if (b.type === "table") {
        tabChap += 1;
        const label = `Table ${chapNo}.${tabChap}`;
        const anchorId = `tab-${chapNo}-${tabChap}`;
        tabLabelByKey[key] = label;
        tabAnchorByKey[key] = anchorId;
        const titleText = (b.title || "").trim() || "(Untitled table)";
        tables.push({
          key,
          label,
          title: titleText,
          anchorId,
        });
      }
    });
  }

  const rootStyle = {
    "--accent": settings.accentColor,
  } as CSSProperties;

  return (
    <div className="pdf-root" style={rootStyle}>
      {settings.showCoverPage ? (
        <section className="pdf-cover no-header-footer" data-chapter-name="Cover">
          <div className="pdf-cover-top">
            <div className="pdf-crest">
              {settings.crestUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.crestUrl} alt="NUST crest" />
              ) : (
                <div className="pdf-crest-ph">NUST CREST</div>
              )}
            </div>
          </div>

          <div className="pdf-cover-center">
            <div className="pdf-cover-uni">NATIONAL UNIVERSITY OF SCIENCES AND TECHNOLOGY</div>
            <div className="pdf-cover-school">School of Mechanical &amp; Manufacturing Engineering</div>
            <div className="pdf-rule-thick" />
            <div className="pdf-cover-title">{title}</div>
            <div className="pdf-rule-thin" />
            <div className="pdf-cover-sub">
              Submitted in partial fulfillment of the requirements for the degree of{" "}
              {settings.degreeTitle}
            </div>

            <table className="pdf-cover-meta">
              <tbody>
                <tr>
                  <td>Author</td>
                  <td>{settings.authorName}</td>
                </tr>
                <tr>
                  <td>Supervisor</td>
                  <td>{settings.supervisorName}</td>
                </tr>
                <tr>
                  <td>Year</td>
                  <td>{settings.submissionYear}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pdf-cover-bottom">
            <div className="pdf-seal">
              {settings.sealUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.sealUrl} alt="Department seal" />
              ) : (
                <div className="pdf-seal-ph">DEPARTMENT SEAL</div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {settings.showToc ? (
        <section
          className="pdf-toc no-header-footer"
          data-chapter-name="Table of Contents"
        >
          <h1 className="pdf-toc-title">Table of Contents</h1>
          <ol className="pdf-toc-list">
            {chapters.map((c) => {
              const anchor = `chap-${escapeId(c.slug)}`;
              return (
                <li key={c.slug} className="pdf-toc-item">
                  <a className="pdf-toc-link" href={`#${anchor}`}>
                    <span className="pdf-toc-left">
                      <span className="pdf-toc-no">{c.chapterNumber}.</span> {c.title}
                    </span>
                    <span className="pdf-toc-page" />
                  </a>
                </li>
              );
            })}
            <li className="pdf-toc-item">
              <a className="pdf-toc-link" href="#pdf-lof">
                <span className="pdf-toc-left">List of Figures</span>
                <span className="pdf-toc-page" />
              </a>
            </li>
            <li className="pdf-toc-item">
              <a className="pdf-toc-link" href="#pdf-lot">
                <span className="pdf-toc-left">List of Tables</span>
                <span className="pdf-toc-page" />
              </a>
            </li>
            <li className="pdf-toc-item">
              <a className="pdf-toc-link" href="#pdf-references">
                <span className="pdf-toc-left">References</span>
                <span className="pdf-toc-page" />
              </a>
            </li>
          </ol>
        </section>
      ) : null}

      <section className="pdf-lox" id="pdf-lof" data-chapter-name="List of Figures">
        <h1 className="pdf-toc-title">List of Figures</h1>
        <ol className="pdf-lox-list">
          {figures.map((f) => (
            <li key={f.key} className="pdf-lox-item">
              <a className="pdf-lox-link" href={`#${f.anchorId}`}>
                <span className="pdf-lox-left">
                  <span className="pdf-lox-no">{f.label}</span> {f.caption}
                </span>
              </a>
            </li>
          ))}
          {figures.length === 0 ? (
            <li className="pdf-lox-item pdf-lox-empty">No figures.</li>
          ) : null}
        </ol>
      </section>

      <section className="pdf-lox" id="pdf-lot" data-chapter-name="List of Tables">
        <h1 className="pdf-toc-title">List of Tables</h1>
        <ol className="pdf-lox-list">
          {tables.map((t) => (
            <li key={t.key} className="pdf-lox-item">
              <a className="pdf-lox-link" href={`#${t.anchorId}`}>
                <span className="pdf-lox-left">
                  <span className="pdf-lox-no">{t.label}</span> {t.title}
                </span>
              </a>
            </li>
          ))}
          {tables.length === 0 ? (
            <li className="pdf-lox-item pdf-lox-empty">No tables.</li>
          ) : null}
        </ol>
      </section>

      {chapters.map((c) => {
        const anchor = `chap-${escapeId(c.slug)}`;
        return (
          <section
            key={c.slug}
            className="pdf-chapter"
            id={anchor}
            data-chapter-name={c.title}
            data-chapter-index={c.chapterNumber}
          >
            <div className="pdf-body">
              {renderBlocks({
                blocks: c.blocks,
                chapterNumber: c.chapterNumber,
                chapterSlug: c.slug,
                eqLabelByKey,
                figLabelByKey,
                tabLabelByKey,
                figAnchorByKey,
                tabAnchorByKey,
              })}
            </div>
          </section>
        );
      })}

      <section id="pdf-references" className="pdf-references" data-chapter-name="References">
        <h1 className="pdf-ref-title">References</h1>
        <ol className="pdf-ref-list">
          <li>
            Placeholder reference list. (Next step: structured citation blocks + superscript
            linking.)
          </li>
        </ol>
      </section>
    </div>
  );
}
