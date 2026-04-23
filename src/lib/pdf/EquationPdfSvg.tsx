import type { ReactNode } from "react";
import {
  Svg,
  G,
  Path,
  Rect,
  Line,
  Circle,
  Ellipse,
  Polygon,
  Polyline,
  Defs,
  ClipPath,
  Text,
} from "@react-pdf/renderer";
import type { PdfEquationVector, PdfSvgNode } from "@/lib/pdf/pdfEquationVector";

type N<T extends PdfSvgNode["t"]> = Extract<PdfSvgNode, { t: T }>;

function renderBranch(node: PdfSvgNode): ReactNode {
  switch (node.t) {
    case "g":
      return (
        <G key={node.key} {...node.props}>
          {node.children.map((c) => renderBranch(c))}
        </G>
      );
    case "defs":
      return (
        <Defs key={node.key}>
          {node.children.map((c) => renderBranch(c))}
        </Defs>
      );
    case "clipPath":
      return (
        <ClipPath
          key={node.key}
          id={typeof node.props.id === "string" ? node.props.id : undefined}
        >
          {node.children.map((c) => renderBranch(c))}
        </ClipPath>
      );
    case "path":
      return <Path key={node.key} {...(node as N<"path">).props} />;
    case "rect":
      return <Rect key={node.key} {...(node as N<"rect">).props} />;
    case "line":
      return <Line key={node.key} {...(node as N<"line">).props} />;
    case "circle":
      return <Circle key={node.key} {...(node as N<"circle">).props} />;
    case "ellipse":
      return <Ellipse key={node.key} {...(node as N<"ellipse">).props} />;
    case "polygon":
      return <Polygon key={node.key} {...(node as N<"polygon">).props} />;
    case "polyline":
      return <Polyline key={node.key} {...(node as N<"polyline">).props} />;
    default:
      return null;
  }
}

/**
 * Vector math: width fills the column; height comes from Yoga + viewBox object
 * (maxX-minX)/(maxY-minY) aspect). No explicit height — avoids wrong 1:1 sizing when
 * viewBox was passed as a string.
 */
export function EquationPdfSvg({
  data,
  latexForLog,
}: {
  data: PdfEquationVector | null;
  latexForLog?: string;
}) {
  if (!data) {
    console.error("[Math Rendering Error] Equation PDF: MathJax produced no vector for PDF.", {
      latexSnippet:
        typeof latexForLog === "string" && latexForLog.trim()
          ? latexForLog.trim().slice(0, 800)
          : undefined,
    });
    return (
      <Text
        style={{
          fontFamily: "Times-Roman",
          fontSize: 11,
          color: "#991b1b",
          textAlign: "center",
        }}
        wrap={false}
      >
        [Math Rendering Error]
      </Text>
    );
  }

  const ar =
    data.viewBoxHeight > 0 && data.viewBoxWidth > 0
      ? data.viewBoxWidth / data.viewBoxHeight
      : 1;

  return (
    <Svg
      // @react-pdf/layout expects a viewBox rect object (see measureCanvas$1 getAspectRatio); d.ts only lists string.
      viewBox={data.viewBox as never}
      width="100%"
      style={{ aspectRatio: ar }}
      preserveAspectRatio="xMidYMid meet"
    >
      {data.children.map((c) => renderBranch(c))}
    </Svg>
  );
}
