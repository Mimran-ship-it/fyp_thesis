/**
 * Serializable MathJax SVG subtree for @react-pdf vector rendering (paths only).
 */

export type PdfSvgProps = Record<string, string | number | undefined>;

export type PdfSvgNode =
  | { t: "g"; key: string; props: PdfSvgProps; children: PdfSvgNode[] }
  | { t: "defs"; key: string; props: PdfSvgProps; children: PdfSvgNode[] }
  | { t: "clipPath"; key: string; props: PdfSvgProps; children: PdfSvgNode[] }
  | { t: "path"; key: string; props: PdfSvgProps & { d: string } }
  | {
      t: "rect";
      key: string;
      props: PdfSvgProps & {
        width: string | number;
        height: string | number;
        x?: string | number;
        y?: string | number;
        rx?: string | number;
        ry?: string | number;
      };
    }
  | {
      t: "line";
      key: string;
      props: PdfSvgProps & {
        x1: string | number;
        y1: string | number;
        x2: string | number;
        y2: string | number;
      };
    }
  | {
      t: "circle";
      key: string;
      props: PdfSvgProps & { r: string | number; cx?: string | number; cy?: string | number };
    }
  | {
      t: "ellipse";
      key: string;
      props: PdfSvgProps & {
        rx: string | number;
        ry: string | number;
        cx?: string | number;
        cy?: string | number;
      };
    }
  | { t: "polygon"; key: string; props: PdfSvgProps & { points: string } }
  | { t: "polyline"; key: string; props: PdfSvgProps & { points: string } };

/** react-pdf: min at origin; maxX/maxY are logical width/height (see @react-pdf/render resolveAspectRatio). */
export type PdfEquationViewBoxRect = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type PdfEquationVector = {
  viewBox: PdfEquationViewBoxRect;
  viewBoxWidth: number;
  viewBoxHeight: number;
  children: PdfSvgNode[];
};
