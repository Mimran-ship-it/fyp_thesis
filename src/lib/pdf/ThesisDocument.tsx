import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { ChapterBlock, ChapterDoc, EquationBlock, TableBlock } from "@/models/Chapter";
import type { PdfSettingsDoc } from "@/models/PdfSettings";
import { THESIS_TITLE } from "@/lib/pdf/constants";
import { EquationPdfSvg } from "@/lib/pdf/EquationPdfSvg";
import {
  columnWidthPercent,
  safeText,
  sanitizeDimension,
  sanitizeHexColor,
  sanitizeNumber,
} from "@/lib/pdf/sanitizeStyles";

function isTbd(v: unknown) {
  if (v === null || v === undefined) return false;
  return String(v).trim().toUpperCase() === "TBD";
}

function sanitizeParagraphText(text: string) {
  return text
    .replace(/(\s*<br\s*\/?>\s*){2,}/gi, " ")
    .replace(/^(<br\s*\/?>\s*)+|(\s*<br\s*\/?>)+$/gi, "");
}

function plainTextFromBlockText(text: string) {
  const s = sanitizeParagraphText(text);
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function resolveImageSrc(src: string | undefined, baseUrl: string): string | null {
  if (!src?.trim()) return null;
  const s = src.trim();
  if (s === "undefined" || s === "null") return null;
  if (s.startsWith("https://") || s.startsWith("http://")) return s;
  if (s.startsWith("/")) return `${baseUrl.replace(/\/$/, "")}${s}`;
  return null;
}

function buildNumbering(
  chapters: ChapterDoc[],
  settings: PdfSettingsDoc
): {
  eqLabelByKey: Record<string, string>;
  figLabelByKey: Record<string, string>;
  tabLabelByKey: Record<string, string>;
  figures: Array<{ key: string; label: string; caption: string }>;
  tables: Array<{ key: string; label: string; title: string }>;
} {
  const eqLabelByKey: Record<string, string> = {};
  const figLabelByKey: Record<string, string> = {};
  const tabLabelByKey: Record<string, string> = {};
  const figures: Array<{ key: string; label: string; caption: string }> = [];
  const tables: Array<{ key: string; label: string; title: string }> = [];
  let eqGlobal = 0;
  const chs = Array.isArray(chapters) ? chapters : [];

  for (const c of chs) {
    const chapNo = sanitizeNumber(c.chapterNumber, 1);
    let eqChap = 0;
    let figChap = 0;
    let tabChap = 0;

    (Array.isArray(c.blocks) ? c.blocks : []).forEach((b, i) => {
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
        figLabelByKey[key] = `Figure ${chapNo}.${figChap}`;
        figures.push({
          key,
          label: `Figure ${chapNo}.${figChap}`,
          caption: (b.caption || "").trim() || "(No caption)",
        });
      }
      if (b.type === "table") {
        tabChap += 1;
        tabLabelByKey[key] = `Table ${chapNo}.${tabChap}`;
        tables.push({
          key,
          label: `Table ${chapNo}.${tabChap}`,
          title: (b.title || "").trim() || "(Untitled table)",
        });
      }
    });
  }
  return { eqLabelByKey, figLabelByKey, tabLabelByKey, figures, tables };
}

function createStyles(accentColor: string) {
  const accent = sanitizeHexColor(accentColor);
  return StyleSheet.create({
    page: {
      fontFamily: "Times-Roman",
      fontSize: 11,
      lineHeight: 1.5,
      color: "#1a1a1a",
      paddingTop: 56,
      paddingBottom: 48,
      paddingLeft: 80,
      paddingRight: 56,
    },
    coverPage: {
      fontFamily: "Times-Roman",
      fontSize: 11,
      color: "#1a1a1a",
      paddingTop: 48,
      paddingBottom: 48,
      paddingLeft: 56,
      paddingRight: 56,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    coverUni: {
      fontFamily: "Helvetica",
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: "#0f172a",
      textAlign: "center",
      marginTop: 24,
    },
    coverSchool: {
      fontFamily: "Helvetica",
      fontSize: 9,
      color: "#334155",
      textAlign: "center",
      marginTop: 6,
    },
    coverRuleThick: {
      height: 2,
      backgroundColor: "#0f172a",
      width: "80%",
      marginTop: 28,
      marginBottom: 20,
    },
    coverTitle: {
      fontFamily: "Times-Bold",
      fontSize: 22,
      textAlign: "center",
      color: "#0f172a",
      lineHeight: 1.2,
      maxWidth: 420,
    },
    coverRuleThin: {
      height: 1,
      backgroundColor: "#64748b",
      width: "70%",
      marginTop: 20,
      marginBottom: 16,
    },
    coverSub: {
      fontFamily: "Helvetica",
      fontSize: 9,
      color: "#0f172a",
      textAlign: "center",
      maxWidth: 400,
      lineHeight: 1.45,
    },
    coverMetaRow: {
      flexDirection: "row",
      marginTop: 4,
      width: 280,
    },
    coverMetaLabel: {
      fontFamily: "Helvetica",
      fontSize: 9,
      width: 90,
      textAlign: "right",
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      paddingRight: 8,
    },
    coverMetaValue: {
      fontFamily: "Helvetica",
      fontSize: 9,
      flex: 1,
      textAlign: "left",
      color: "#0f172a",
    },
    crestBox: {
      width: 120,
      height: 120,
      marginTop: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    crestPh: {
      width: 120,
      height: 120,
      borderWidth: 1,
      borderColor: "#cbd5e1",
      borderStyle: "solid",
      alignItems: "center",
      justifyContent: "center",
    },
    crestPhText: {
      fontFamily: "Helvetica",
      fontSize: 8,
      color: "#94a3b8",
    },
    tocTitle: {
      fontFamily: "Helvetica",
      fontSize: 14,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: "#0f172a",
      borderBottomWidth: 0.5,
      borderBottomColor: "#cbd5e1",
      paddingBottom: 8,
      marginBottom: 16,
    },
    tocRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: 8,
    },
    tocLeft: {
      fontFamily: "Times-Roman",
      fontSize: 11,
      color: "#1a1a1a",
      maxWidth: "72%",
    },
    tocDots: {
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: "#94a3b8",
      borderStyle: "solid",
      marginHorizontal: 6,
      marginBottom: 3,
      minHeight: 1,
    },
    sectionTitle: {
      fontFamily: "Helvetica",
      fontSize: 14,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: "#0f172a",
      borderBottomWidth: 0.5,
      borderBottomColor: "#cbd5e1",
      paddingBottom: 8,
      marginBottom: 12,
    },
    loxItem: {
      fontFamily: "Times-Roman",
      fontSize: 10,
      color: "#1a1a1a",
      marginBottom: 6,
      paddingLeft: 4,
    },
    pageHeader: {
      position: "absolute",
      top: 20,
      left: 80,
      right: 56,
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 0.5,
      borderBottomColor: "#e2e8f0",
      paddingBottom: 4,
    },
    pageHeaderText: {
      fontFamily: "Helvetica",
      fontSize: 8,
      color: "#64748b",
      letterSpacing: 0.8,
    },
    /** Outer shell is fixed + absolute; inner Text uses `render` only (no `fixed` on that Text). */
    pageFooterShell: {
      position: "absolute",
      bottom: 20,
      left: 80,
      right: 56,
      height: 14,
      justifyContent: "flex-end",
    },
    pageFooterText: {
      fontFamily: "Helvetica",
      fontSize: 8,
      color: "#64748b",
      textAlign: "center",
    },
    chapterLabel: {
      fontFamily: "Helvetica",
      fontSize: 9,
      letterSpacing: 2,
      color: "#64748b",
      textTransform: "uppercase",
      marginBottom: 6,
    },
    chapterTitle: {
      fontFamily: "Helvetica-Bold",
      fontSize: 22,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: "#0f172a",
      marginBottom: 20,
      borderLeftWidth: 5,
      borderLeftColor: accent,
      borderLeftStyle: "solid",
      paddingLeft: 10,
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: "Helvetica-Bold",
      fontSize: 13,
      color: "#0f172a",
      marginTop: 14,
      marginBottom: 8,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
    },
    h3: {
      fontFamily: "Times-BoldItalic",
      fontSize: 11,
      color: "#1e3a5f",
      marginTop: 10,
      marginBottom: 6,
    },
    paragraph: {
      fontFamily: "Times-Roman",
      fontSize: 11,
      lineHeight: 1.5,
      textAlign: "justify",
      marginBottom: 8,
      color: "#1a1a1a",
    },
    placeholder: {
      borderWidth: 2,
      borderColor: "#cbd5e1",
      borderStyle: "dashed",
      borderRadius: 4,
      padding: 16,
      textAlign: "center",
      color: "#94a3b8",
      fontFamily: "Times-Italic",
      fontSize: 10,
      marginVertical: 10,
      backgroundColor: "#f8fafc",
    },
    equationOuter: {
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      marginTop: 14,
      marginBottom: 4,
    },
    equationBox: {
      display: "flex",
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-between",
      backgroundColor: "#f0f4ff",
      borderWidth: 1,
      borderColor: "#cbd5e1",
      borderStyle: "solid",
      borderRadius: 8,
      paddingVertical: 32,
      paddingLeft: 16,
      paddingRight: 16,
    },
    /** Matches site preview: row cluster (accent + math) beside equation number */
    equationMainRow: {
      display: "flex",
      flexDirection: "row",
      alignItems: "stretch",
      flex: 1,
      minWidth: 0,
    },
    equationPurpleAccent: {
      width: 4,
      backgroundColor: "#8b5cf6",
      borderRadius: 2,
      alignSelf: "stretch",
    },
    equationMathColumn: {
      display: "flex",
      flex: 1,
      minWidth: 0,
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "center",
      paddingLeft: 12,
    },
    equationSvgHolder: {
      display: "flex",
      width: "100%",
      flexDirection: "column",
      alignItems: "stretch",
    },
    equationNumberCell: {
      display: "flex",
      width: 44,
      marginLeft: 10,
      alignItems: "center",
      justifyContent: "flex-end",
      alignSelf: "stretch",
    },
    equationNumber: {
      fontFamily: "Times-Roman",
      fontSize: 11,
      color: "#374151",
      textAlign: "right",
    },
    equationCaption: {
      fontFamily: "Times-Italic",
      fontSize: 9,
      color: "#4b5563",
      textAlign: "center",
      marginTop: 10,
      marginBottom: 14,
    },
    tableCaption: {
      fontFamily: "Helvetica-Bold",
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: "#0f172a",
      marginBottom: 4,
    },
    tableHeaderRow: {
      flexDirection: "row",
      borderTopWidth: 2,
      borderTopColor: "#0f172a",
      borderBottomWidth: 2,
      borderBottomColor: "#0f172a",
      borderStyle: "solid",
      paddingVertical: 5,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 5,
    },
    tableRowEven: {
      backgroundColor: "#f8fafc",
    },
    tableLastRow: {
      borderBottomWidth: 2,
      borderBottomColor: "#0f172a",
      borderStyle: "solid",
    },
    tableHeaderCell: {
      fontFamily: "Helvetica-Bold",
      fontSize: 9,
      color: "#0f172a",
      paddingVertical: 2,
      paddingHorizontal: 6,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    tableCell: {
      fontFamily: "Times-Roman",
      fontSize: 10,
      color: "#1a1a1a",
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    tableCellTbd: {
      fontFamily: "Times-Italic",
      fontSize: 10,
      color: "#b45309",
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    tableFoot: {
      fontFamily: "Times-Italic",
      fontSize: 10,
      color: "#4b5563",
      textAlign: "center",
      marginTop: 4,
    },
    figureWrap: {
      alignItems: "center",
      marginVertical: 12,
    },
    figureImg: {
      maxWidth: "90%",
      maxHeight: 280,
      objectFit: "contain",
    },
    figureCaption: {
      fontFamily: "Times-BoldItalic",
      fontSize: 10,
      color: "#374151",
      textAlign: "center",
      marginTop: 6,
      borderTopWidth: 0.5,
      borderTopColor: "#e2e8f0",
      borderStyle: "solid",
      paddingTop: 4,
      width: "100%",
    },
    refTitle: {
      fontFamily: "Helvetica",
      fontSize: 14,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: "#0f172a",
      borderBottomWidth: 0.5,
      borderBottomColor: "#cbd5e1",
      paddingBottom: 8,
      marginBottom: 12,
    },
    refItem: {
      fontFamily: "Times-Roman",
      fontSize: 10,
      lineHeight: 1.45,
      color: "#1a1a1a",
      marginBottom: 6,
      paddingLeft: 8,
    },
  });
}

function BlockViews({
  blocks,
  chapterNumber,
  chapterSlug,
  styles,
  eqLabelByKey,
  figLabelByKey,
  tabLabelByKey,
  baseUrl,
}: {
  blocks: ChapterBlock[];
  chapterNumber: number;
  chapterSlug: string;
  styles: ReturnType<typeof createStyles>;
  eqLabelByKey: Record<string, string>;
  figLabelByKey: Record<string, string>;
  tabLabelByKey: Record<string, string>;
  baseUrl: string;
}) {
  const list = Array.isArray(blocks) ? blocks : [];
  const chapDisplay = sanitizeNumber(chapterNumber, 1);

  return (
    <>
      {list.map((b, i) => {
        const key = `${chapterSlug}:${i}`;
        if (b.type === "heading") {
          if (typeof b.text !== "string" || !b.text.trim()) return null;
          if (b.level === 1) {
            return (
              <View key={i} wrap={false}>
                <Text style={styles.chapterLabel}>CHAPTER {chapDisplay}</Text>
                <Text style={styles.chapterTitle}>{safeText(b.text)}</Text>
              </View>
            );
          }
          if (b.level === 2) {
            return (
              <Text key={i} style={styles.h2} wrap={false}>
                {safeText(b.text)}
              </Text>
            );
          }
          return (
            <Text key={i} style={styles.h3} wrap={false}>
              {safeText(b.text)}
            </Text>
          );
        }
        if (b.type === "paragraph") {
          if (typeof b.text !== "string") {
            return (
              <View key={i} style={styles.placeholder} wrap={false}>
                <Text>[ Paragraph placeholder — add text in admin ]</Text>
              </View>
            );
          }
          const t = plainTextFromBlockText(b.text);
          if (!t) {
            return (
              <View key={i} style={styles.placeholder} wrap={false}>
                <Text>[ Paragraph placeholder — add text in admin ]</Text>
              </View>
            );
          }
          return (
            <Text key={i} style={styles.paragraph}>
              {t}
            </Text>
          );
        }
        if (b.type === "equation") {
          if (typeof b.latex !== "string" || !b.latex.trim()) {
            return (
              <View key={i} style={styles.placeholder} wrap={false}>
                <Text>[ Equation placeholder — add LaTeX in admin ]</Text>
              </View>
            );
          }
          const eq = b as EquationBlock;
          const latex = eq.latex.trim();
          const num = eqLabelByKey[key] || "";
          const vec = eq._equationVector;
          return (
            <View key={i} style={styles.equationOuter}>
              <View style={styles.equationBox}>
                <View style={styles.equationMainRow}>
                  <View style={styles.equationPurpleAccent} wrap={false} />
                  <View style={styles.equationMathColumn}>
                    <View style={styles.equationSvgHolder}>
                      <EquationPdfSvg data={vec ?? null} latexForLog={latex} />
                    </View>
                  </View>
                </View>
                {num ? (
                  <View style={styles.equationNumberCell} wrap={false}>
                    <Text style={styles.equationNumber} wrap={false}>
                      {num}
                    </Text>
                  </View>
                ) : null}
              </View>
              {b.caption ? (
                <Text style={styles.equationCaption} wrap={false}>
                  {safeText(b.caption)}
                </Text>
              ) : null}
            </View>
          );
        }
        if (b.type === "table") {
          const block = b as TableBlock;
          const columns = Array.isArray(block.columns) ? block.columns : [];
          const rows = Array.isArray(block.rows) ? block.rows : [];
          if (!columns.length || !rows.length) {
            return (
              <View key={i} wrap={false}>
                <Text style={styles.tableCaption}>Table</Text>
                <View style={styles.placeholder}>
                  <Text>[ Table placeholder — add columns and rows in admin ]</Text>
                </View>
              </View>
            );
          }
          const colWidth = columnWidthPercent(columns.length);
          const dataRows = rows.filter((row) =>
            columns.some((c) => {
              const v = row?.[c.key];
              return v !== null && v !== undefined && String(v).trim() !== "";
            })
          );
          const label = tabLabelByKey[key] || "Table";
          const titlePart = typeof block.title === "string" ? block.title.trim() : "";
          const capText = titlePart ? `${label} — ${titlePart}` : label;
          if (dataRows.length === 0) {
            return (
              <View key={i} wrap={false}>
                <Text style={styles.tableCaption}>{capText}</Text>
                <View style={styles.placeholder}>
                  <Text>[ Table placeholder — add data rows in admin ]</Text>
                </View>
              </View>
            );
          }
          return (
            <View key={i} style={{ marginBottom: sanitizeNumber(12, 12) }} wrap={false}>
              <Text style={styles.tableCaption}>{capText}</Text>
              <View style={styles.tableHeaderRow}>
                {columns.map((c) => (
                  <Text
                    key={String(c.key)}
                    style={[styles.tableHeaderCell, { width: colWidth }]}
                  >
                    {safeText(c.label)}
                    {c.unit ? ` (${safeText(c.unit)})` : ""}
                  </Text>
                ))}
              </View>
              {rows.map((row, ri) => {
                const rowStyle: Style[] = [styles.tableRow];
                if (ri % 2 === 1) rowStyle.push(styles.tableRowEven);
                if (ri === rows.length - 1) rowStyle.push(styles.tableLastRow);
                return (
                  <View key={ri} style={rowStyle}>
                    {columns.map((c) => {
                      const v = row?.[c.key];
                      const cellStyle = isTbd(v) ? styles.tableCellTbd : styles.tableCell;
                      return (
                        <Text
                          key={String(c.key)}
                          style={[cellStyle, { width: colWidth }]}
                        >
                          {v === null || v === undefined ? "" : safeText(v)}
                        </Text>
                      );
                    })}
                  </View>
                );
              })}
              {block.caption ? (
                <Text style={styles.tableFoot}>{safeText(block.caption)}</Text>
              ) : null}
            </View>
          );
        }
        if (b.type === "figure") {
          const label = figLabelByKey[key] || "Figure";
          const srcOk = typeof b.src === "string" && b.src.trim().length > 0;
          const resolved = srcOk ? resolveImageSrc(b.src, baseUrl) : null;
          const maxImg = sanitizeDimension(b.height, 280);
          return (
            <View key={i} style={styles.figureWrap} wrap={false}>
              {resolved ? (
                <Image
                  style={[styles.figureImg, { maxHeight: maxImg }]}
                  src={resolved}
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text>[ Figure placeholder — upload image in admin ]</Text>
                </View>
              )}
              <Text style={styles.figureCaption}>
                {`${label} — ${safeText(b.caption)}`}
              </Text>
            </View>
          );
        }
        return null;
      })}
    </>
  );
}

export function ThesisDocument({
  chapters,
  settings,
  baseUrl,
}: {
  chapters: ChapterDoc[];
  settings: PdfSettingsDoc;
  /** Absolute origin (e.g. https://your-app.vercel.app) for resolving relative figure URLs */
  baseUrl: string;
}) {
  const safeChapters = Array.isArray(chapters) ? chapters : [];
  const accent = settings.accentColor || "#2563eb";
  const styles = createStyles(accent);
  const { eqLabelByKey, figLabelByKey, tabLabelByKey, figures, tables } = buildNumbering(
    safeChapters,
    settings
  );

  const title = THESIS_TITLE;
  const headerRight = settings.thesisTitleShort || "Bio-Inspired Soft Robotic Gripper";

  const runningHeaderFooter = (
    <>
      <View style={styles.pageHeader} fixed>
        <Text style={styles.pageHeaderText}>NUST · SMME · FYP Thesis</Text>
        <Text style={styles.pageHeaderText}>{headerRight}</Text>
      </View>
      <View style={styles.pageFooterShell} fixed>
        <Text
          style={styles.pageFooterText}
          render={({ pageNumber }) => `— ${pageNumber ?? 1} —`}
        />
      </View>
    </>
  );

  return (
    <Document
      title={title}
      author={safeText(settings.authorName, "Author")}
      subject="FYP Thesis"
    >
      {settings.showCoverPage ? (
        <Page size="A4" style={styles.coverPage}>
          <View style={styles.crestBox}>
            {settings.crestUrl && resolveImageSrc(settings.crestUrl, baseUrl) ? (
              <Image
                style={{ width: 100, height: 100, objectFit: "contain" }}
                src={resolveImageSrc(settings.crestUrl, baseUrl)!}
              />
            ) : (
              <View style={styles.crestPh}>
                <Text style={styles.crestPhText}>NUST CREST</Text>
              </View>
            )}
          </View>
          <Text style={styles.coverUni}>NATIONAL UNIVERSITY OF SCIENCES AND TECHNOLOGY</Text>
          <Text style={styles.coverSchool}>
            School of Mechanical & Manufacturing Engineering
          </Text>
          <View style={styles.coverRuleThick} />
          <Text style={styles.coverTitle}>{title}</Text>
          <View style={styles.coverRuleThin} />
          <Text style={styles.coverSub}>
            Submitted in partial fulfillment of the requirements for the degree of{" "}
            {safeText(settings.degreeTitle)}
          </Text>
          <View style={{ marginTop: 28, width: 300 }}>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Author</Text>
              <Text style={styles.coverMetaValue}>{safeText(settings.authorName)}</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Supervisor</Text>
              <Text style={styles.coverMetaValue}>{safeText(settings.supervisorName)}</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Year</Text>
              <Text style={styles.coverMetaValue}>{safeText(settings.submissionYear)}</Text>
            </View>
          </View>
          <View style={{ marginTop: 48, alignItems: "center" }}>
            {settings.sealUrl && resolveImageSrc(settings.sealUrl, baseUrl) ? (
              <Image
                style={{ width: 90, height: 90, objectFit: "contain" }}
                src={resolveImageSrc(settings.sealUrl, baseUrl)!}
              />
            ) : (
              <View style={[styles.crestPh, { width: 90, height: 90 }]}>
                <Text style={styles.crestPhText}>SEAL</Text>
              </View>
            )}
          </View>
        </Page>
      ) : null}

      {settings.showToc ? (
        <Page size="A4" style={styles.page}>
          <Text style={styles.tocTitle}>Table of Contents</Text>
          {safeChapters.map((c) => (
            <View key={c.slug} style={styles.tocRow}>
              <Text style={styles.tocLeft}>
                {sanitizeNumber(c.chapterNumber, 0)}. {safeText(c.title)}
              </Text>
              <View style={styles.tocDots} />
            </View>
          ))}
          <View style={styles.tocRow}>
            <Text style={styles.tocLeft}>List of Figures</Text>
            <View style={styles.tocDots} />
          </View>
          <View style={styles.tocRow}>
            <Text style={styles.tocLeft}>List of Tables</Text>
            <View style={styles.tocDots} />
          </View>
          <View style={styles.tocRow}>
            <Text style={styles.tocLeft}>References</Text>
            <View style={styles.tocDots} />
          </View>
        </Page>
      ) : null}

      <Page size="A4" style={styles.page} wrap>
        {runningHeaderFooter}
        <Text style={styles.sectionTitle}>List of Figures</Text>
        {figures.length === 0 ? (
          <Text style={styles.loxItem}>No figures.</Text>
        ) : (
          figures.map((f) => (
            <Text key={f.key} style={styles.loxItem}>
              {`${safeText(f.label)} — ${safeText(f.caption)}`}
            </Text>
          ))
        )}
        <View style={{ marginTop: 16 }} break />
        <Text style={styles.sectionTitle}>List of Tables</Text>
        {tables.length === 0 ? (
          <Text style={styles.loxItem}>No tables.</Text>
        ) : (
          tables.map((t) => (
            <Text key={t.key} style={styles.loxItem}>
              {`${safeText(t.label)} — ${safeText(t.title)}`}
            </Text>
          ))
        )}
        {safeChapters.map((c) => (
          <View key={c.slug} break>
            <BlockViews
              blocks={Array.isArray(c.blocks) ? c.blocks : []}
              chapterNumber={c.chapterNumber}
              chapterSlug={c.slug}
              styles={styles}
              eqLabelByKey={eqLabelByKey}
              figLabelByKey={figLabelByKey}
              tabLabelByKey={tabLabelByKey}
              baseUrl={baseUrl}
            />
          </View>
        ))}
        <View break />
        <Text style={styles.refTitle}>References</Text>
        <Text style={styles.refItem}>
          Placeholder reference list. (Next step: structured citation blocks + superscript
          linking.)
        </Text>
      </Page>
    </Document>
  );
}
