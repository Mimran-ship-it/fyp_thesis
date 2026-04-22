import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { ChapterBlock, ChapterDoc, TableBlock } from "@/models/Chapter";
import type { PdfSettingsDoc } from "@/models/PdfSettings";
import { THESIS_TITLE } from "@/lib/pdf/constants";

function escapeId(s: string) {
  return s.replace(/[^a-zA-Z0-9-_]/g, "-");
}

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
  return StyleSheet.create({
    page: {
      fontFamily: "Lora",
      fontSize: 11,
      lineHeight: 1.5,
      color: "#1a1a1a",
      paddingTop: 56,
      paddingBottom: 48,
      paddingLeft: 80,
      paddingRight: 56,
    },
    coverPage: {
      fontFamily: "Lora",
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
      fontFamily: "Inter",
      fontSize: 10,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: "#0f172a",
      textAlign: "center",
      marginTop: 24,
    },
    coverSchool: {
      fontFamily: "Inter",
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
      fontFamily: "Lora",
      fontSize: 22,
      fontWeight: 700,
      textAlign: "center",
      color: "#0f172a",
      lineHeight: 1.2,
      maxWidth: 420,
    },
    coverRuleThin: {
      height: 1,
      backgroundColor: "#334155",
      width: "70%",
      marginTop: 20,
      marginBottom: 16,
      opacity: 0.75,
    },
    coverSub: {
      fontFamily: "Inter",
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
      fontFamily: "Inter",
      fontSize: 9,
      width: 90,
      textAlign: "right",
      color: "#64748b",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      paddingRight: 8,
    },
    coverMetaValue: {
      fontFamily: "Inter",
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
      fontFamily: "Inter",
      fontSize: 8,
      color: "#94a3b8",
    },
    tocTitle: {
      fontFamily: "Inter",
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
      fontFamily: "Lora",
      fontSize: 11,
      color: "#1a1a1a",
      maxWidth: "72%",
    },
    tocDots: {
      flex: 1,
      borderBottomWidth: 0.5,
      borderBottomColor: "#94a3b8",
      borderStyle: "dotted",
      marginHorizontal: 6,
      marginBottom: 3,
      minHeight: 1,
    },
    sectionTitle: {
      fontFamily: "Inter",
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
      fontFamily: "Lora",
      fontSize: 10,
      color: "#1a1a1a",
      marginBottom: 6,
      paddingLeft: 4,
    },
    loxLabel: {
      fontFamily: "Lora",
      fontSize: 10,
      fontWeight: 700,
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
      fontFamily: "Inter",
      fontSize: 8,
      color: "#64748b",
      letterSpacing: 0.8,
    },
    pageFooterText: {
      position: "absolute",
      bottom: 20,
      left: 0,
      right: 0,
      fontFamily: "Inter",
      fontSize: 8,
      color: "#64748b",
      textAlign: "center",
    },
    chapterLabel: {
      fontFamily: "Inter",
      fontSize: 9,
      letterSpacing: 2,
      color: "#64748b",
      textTransform: "uppercase",
      marginBottom: 6,
    },
    chapterTitle: {
      fontFamily: "Inter",
      fontSize: 22,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: "#0f172a",
      marginBottom: 20,
      borderLeftWidth: 5,
      borderLeftColor: accentColor,
      borderLeftStyle: "solid",
      paddingLeft: 10,
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: "Inter",
      fontSize: 13,
      fontWeight: 700,
      color: "#0f172a",
      marginTop: 14,
      marginBottom: 8,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
    },
    h3: {
      fontFamily: "Lora",
      fontSize: 11,
      fontWeight: 700,
      fontStyle: "italic",
      color: "#1e3a5f",
      marginTop: 10,
      marginBottom: 6,
    },
    paragraph: {
      fontFamily: "Lora",
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
      fontStyle: "italic",
      fontSize: 10,
      marginVertical: 10,
      backgroundColor: "#f8fafc",
    },
    equationOuter: {
      marginVertical: 8,
    },
    equationBox: {
      position: "relative",
      backgroundColor: "#f8fafc",
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderStyle: "solid",
      borderRadius: 4,
      paddingVertical: 12,
      paddingLeft: 12,
      paddingRight: 48,
      marginTop: 12,
      marginBottom: 4,
    },
    equationMono: {
      fontFamily: "Courier",
      fontSize: 9,
      color: "#1a1a1a",
      lineHeight: 1.35,
    },
    equationNote: {
      fontFamily: "Inter",
      fontSize: 7,
      color: "#64748b",
      marginTop: 6,
      fontStyle: "italic",
    },
    equationNumber: {
      position: "absolute",
      right: 12,
      top: 12,
      fontFamily: "Lora",
      fontSize: 11,
      color: "#374151",
    },
    equationCaption: {
      fontFamily: "Lora",
      fontSize: 9.5,
      fontStyle: "italic",
      color: "#4b5563",
      textAlign: "center",
      marginBottom: 12,
    },
    tableCaption: {
      fontFamily: "Inter",
      fontSize: 9.5,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: "#0f172a",
      marginBottom: 4,
    },
    tableHeaderRow: {
      flexDirection: "row",
      borderTopWidth: 2,
      borderTopColor: "#0f172a",
      borderBottomWidth: 1.5,
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
      fontFamily: "Inter",
      fontSize: 9,
      fontWeight: 700,
      color: "#0f172a",
      flex: 1,
      paddingHorizontal: 6,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    tableCell: {
      fontFamily: "Lora",
      fontSize: 10,
      color: "#1a1a1a",
      flex: 1,
      paddingHorizontal: 6,
    },
    tableCellTbd: {
      fontFamily: "Lora",
      fontSize: 10,
      color: "#b45309",
      fontStyle: "italic",
      flex: 1,
      paddingHorizontal: 6,
    },
    tableFoot: {
      fontFamily: "Lora",
      fontSize: 9.5,
      fontStyle: "italic",
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
      fontFamily: "Lora",
      fontSize: 9.5,
      fontStyle: "italic",
      fontWeight: 700,
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
      fontFamily: "Inter",
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
      fontFamily: "Lora",
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
  return (
    <>
      {blocks.map((b, i) => {
        const key = `${chapterSlug}:${i}`;
        if (b.type === "heading") {
          if (b.level === 1) {
            return (
              <View key={i} wrap={false}>
                <Text style={styles.chapterLabel}>CHAPTER {chapterNumber}</Text>
                <Text style={styles.chapterTitle}>{b.text}</Text>
              </View>
            );
          }
          if (b.level === 2) {
            return (
              <Text key={i} style={styles.h2} wrap={false}>
                {b.text}
              </Text>
            );
          }
          return (
            <Text key={i} style={styles.h3} wrap={false}>
              {b.text}
            </Text>
          );
        }
        if (b.type === "paragraph") {
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
          const latex = (b.latex || "").trim();
          if (!latex) {
            return (
              <View key={i} style={styles.placeholder} wrap={false}>
                <Text>[ Equation placeholder — add LaTeX in admin ]</Text>
              </View>
            );
          }
          const num = eqLabelByKey[key] || "";
          return (
            <View key={i} style={styles.equationOuter} wrap={false}>
              <View style={styles.equationBox}>
                <Text style={styles.equationMono}>{latex}</Text>
                <Text style={styles.equationNote}>
                  Full typeset math (KaTeX) is available in the web chapter preview; PDF uses
                  LaTeX source for portability on serverless hosts.
                </Text>
                {num ? <Text style={styles.equationNumber}>{num}</Text> : null}
              </View>
              {b.caption ? (
                <Text style={styles.equationCaption}>{b.caption}</Text>
              ) : null}
            </View>
          );
        }
        if (b.type === "table") {
          const block = b as TableBlock;
          const dataRows = (block.rows || []).filter((row) =>
            block.columns.some((c) => {
              const v = row[c.key];
              return v !== null && v !== undefined && String(v).trim() !== "";
            })
          );
          const label = tabLabelByKey[key] || "Table";
          const titlePart = (block.title || "").trim();
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
            <View key={i} style={{ marginBottom: 12 }} wrap={false}>
              <Text style={styles.tableCaption}>{capText}</Text>
              <View style={styles.tableHeaderRow}>
                {block.columns.map((c) => (
                  <Text key={c.key} style={styles.tableHeaderCell}>
                    {c.label}
                    {c.unit ? ` (${c.unit})` : ""}
                  </Text>
                ))}
              </View>
              {block.rows.map((row, ri) => (
                <View
                  key={ri}
                  style={{
                    ...styles.tableRow,
                    ...(ri % 2 === 1 ? styles.tableRowEven : {}),
                    ...(ri === block.rows.length - 1 ? styles.tableLastRow : {}),
                  }}
                >
                  {block.columns.map((c) => {
                    const v = row[c.key];
                    const cellStyle = isTbd(v) ? styles.tableCellTbd : styles.tableCell;
                    return (
                      <Text key={c.key} style={cellStyle}>
                        {v === null || v === undefined ? "" : String(v)}
                      </Text>
                    );
                  })}
                </View>
              ))}
              {block.caption ? (
                <Text style={styles.tableFoot}>{block.caption}</Text>
              ) : null}
            </View>
          );
        }
        if (b.type === "figure") {
          const label = figLabelByKey[key] || "Figure";
          const resolved = resolveImageSrc(b.src, baseUrl);
          return (
            <View key={i} style={styles.figureWrap} wrap={false}>
              {resolved ? (
                <Image style={styles.figureImg} src={resolved} />
              ) : (
                <View style={styles.placeholder}>
                  <Text>[ Figure placeholder — upload image in admin ]</Text>
                </View>
              )}
              <Text style={styles.figureCaption}>
                {`${label} — ${b.caption || ""}`}
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
  const accent = settings.accentColor || "#2563eb";
  const styles = createStyles(accent);
  const { eqLabelByKey, figLabelByKey, tabLabelByKey, figures, tables } = buildNumbering(
    chapters,
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
      <Text
        style={styles.pageFooterText}
        fixed
        render={({ pageNumber }) => `— ${pageNumber} —`}
      />
    </>
  );

  return (
    <Document title={title} author={settings.authorName} subject="FYP Thesis">
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
            {settings.degreeTitle}
          </Text>
          <View style={{ marginTop: 28, width: 300 }}>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Author</Text>
              <Text style={styles.coverMetaValue}>{settings.authorName}</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Supervisor</Text>
              <Text style={styles.coverMetaValue}>{settings.supervisorName}</Text>
            </View>
            <View style={styles.coverMetaRow}>
              <Text style={styles.coverMetaLabel}>Year</Text>
              <Text style={styles.coverMetaValue}>{settings.submissionYear}</Text>
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
          {chapters.map((c) => (
            <View key={c.slug} style={styles.tocRow}>
              <Text style={styles.tocLeft}>
                {c.chapterNumber}. {c.title}
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
              <Text style={styles.loxLabel}>{f.label}</Text> {f.caption}
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
              <Text style={styles.loxLabel}>{t.label}</Text> {t.title}
            </Text>
          ))
        )}
        {chapters.map((c) => (
          <View key={c.slug} break>
            <BlockViews
              blocks={c.blocks}
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
