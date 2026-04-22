import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * Register Lora + Inter with weight/style variants react-pdf may resolve (e.g. 400 italic).
 * Uses Google Fonts gstatic URLs. Hyphenation disabled to reduce layout surprises.
 */
export function registerThesisFonts() {
  if (registered) return;
  try {
    Font.registerHyphenationCallback((word) => [word]);
    Font.register({
      family: "Lora",
      fonts: [
      {
        src: "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOxE7fSHMh3p3yk.ttf",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOxE7fSHMh3p3yk.ttf",
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOxE7fSHMh3p3yk.ttf",
        fontWeight: 700,
      },
      {
        src: "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOxE7fSHMh3p3yk.ttf",
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });
  Font.register({
    family: "Inter",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ.ttf",
        fontWeight: 400,
      },
      {
        src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ.ttf",
        fontWeight: 400,
        fontStyle: "italic",
      },
      {
        src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ.ttf",
        fontWeight: 700,
      },
      {
        src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ.ttf",
        fontWeight: 700,
        fontStyle: "italic",
      },
    ],
  });
  } catch {
    // Duplicate registration during dev HMR — hyphenation + fonts may already exist
  }
  registered = true;
}
