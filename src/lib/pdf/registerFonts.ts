import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * Thesis PDF uses PDF built-in fonts (Times-Roman, Helvetica, Courier) in {@link ThesisDocument}
 * so react-pdf/fontkit never embeds remote WOFF2 variable subsets (those caused fontkit
 * "Offset is outside the bounds of the DataView" and unstable layout).
 *
 * Optional: later swap to committed `.ttf` files via Font.register if custom branding is required.
 */
export function registerThesisFonts() {
  if (registered) return;
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
