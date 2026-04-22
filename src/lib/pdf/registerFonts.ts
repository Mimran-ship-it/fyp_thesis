import { Font } from "@react-pdf/renderer";

let registered = false;

/**
 * Register web fonts once per Node process (react-pdf / @react-pdf/fontkit).
 * Uses jsDelivr mirror of google/fonts OFL files for stable Vercel fetches.
 */
export function registerThesisFonts() {
  if (registered) return;
  try {
    Font.register({
      family: "Lora",
      fonts: [
        {
          src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/lora/Lora-Regular.ttf",
          fontWeight: 400,
        },
        {
          src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/lora/Lora-Bold.ttf",
          fontWeight: 700,
        },
        {
          src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/lora/Lora-Italic.ttf",
          fontWeight: 400,
          fontStyle: "italic",
        },
      ],
    });
    Font.register({
      family: "Inter",
      fonts: [
        {
          src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/Inter-Regular.ttf",
          fontWeight: 400,
        },
        {
          src: "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/inter/Inter-Bold.ttf",
          fontWeight: 700,
        },
      ],
    });
  } catch {
    // Duplicate registration during HMR — safe to ignore
  }
  registered = true;
}
