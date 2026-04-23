/**
 * Horizontal space for equation math in the thesis PDF (Letter, ThesisDocument `page` padding).
 * Used for MathJax line-breaking and for SVG height from viewBox aspect ratio.
 */

const PDF_PAGE_WIDTH_PT = 612;
const PAGE_PADDING_LEFT_PT = 80;
const PAGE_PADDING_RIGHT_PT = 56;

/** Inner body width (pt) inside page margins. */
export const PDF_BODY_INNER_WIDTH_PT =
  PDF_PAGE_WIDTH_PT - PAGE_PADDING_LEFT_PT - PAGE_PADDING_RIGHT_PT;

const EQUATION_BOX_PADDING_H_PT = 20 + 20;
const EQUATION_NUMBER_MARGIN_LEFT_PT = 16;
const EQUATION_NUMBER_MIN_WIDTH_PT = 36;

/**
 * Width (pt) available for the `<Svg width="100%">` column (math only, beside equation number).
 */
export function getEquationSvgContainerWidthPt(): number {
  return (
    PDF_BODY_INNER_WIDTH_PT -
    EQUATION_BOX_PADDING_H_PT -
    EQUATION_NUMBER_MARGIN_LEFT_PT -
    EQUATION_NUMBER_MIN_WIDTH_PT
  );
}
