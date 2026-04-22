import { Font } from "@react-pdf/renderer";

let registered = false;

/** Latin-subset woff2 from Google Fonts CSS API (v20 Inter, v37 Lora) — verified 200, not legacy v13 .ttf paths. */
const INTER_WOFF2 = {
  normal: "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2",
  italic:
    "https://fonts.gstatic.com/s/inter/v20/UcC53FwrK3iLTcvneQg7Ca725JhhKnNqk6L5UUMbndwV.woff2",
} as const;

const LORA_WOFF2 = {
  normal: "https://fonts.gstatic.com/s/lora/v37/0QIvMX1D_JOuMwr7Iw.woff2",
  italic: "https://fonts.gstatic.com/s/lora/v37/0QIhMX1D_JOuMw_LIftL.woff2",
} as const;

function isBenignFontRegistrationError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return /already registered|already been registered|duplicate/i.test(msg);
}

/**
 * Register Lora + Inter with weight/style variants react-pdf resolves (e.g. 400 italic).
 * Uses current gstatic woff2 URLs (variable fonts: same file may serve multiple weights).
 */
export function registerThesisFonts() {
  if (registered) return;

  Font.registerHyphenationCallback((word) => [word]);

  try {
    Font.register({
      family: "Lora",
      fonts: [
        { src: LORA_WOFF2.normal, fontWeight: 400 },
        { src: LORA_WOFF2.italic, fontWeight: 400, fontStyle: "italic" },
        { src: LORA_WOFF2.normal, fontWeight: 700 },
        { src: LORA_WOFF2.italic, fontWeight: 700, fontStyle: "italic" },
      ],
    });
    Font.register({
      family: "Inter",
      fonts: [
        { src: INTER_WOFF2.normal, fontWeight: 400 },
        { src: INTER_WOFF2.italic, fontWeight: 400, fontStyle: "italic" },
        { src: INTER_WOFF2.normal, fontWeight: 700 },
        { src: INTER_WOFF2.italic, fontWeight: 700, fontStyle: "italic" },
      ],
    });
  } catch (e) {
    if (!isBenignFontRegistrationError(e)) throw e;
  }

  registered = true;
}
