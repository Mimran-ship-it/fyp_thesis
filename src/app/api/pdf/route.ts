import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs";

function getBaseUrl(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get("host") || url.host;
  const proto =
    req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const baseUrl = getBaseUrl(req);
  const target = `${baseUrl}/pdf-render/thesis`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });
    await page.goto(target, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");

    // Wait for Paged.js to paginate and for fonts to settle
    await page.waitForFunction("window.__PDF_READY__ === true", {
      timeout: 120000,
    });

    // Running headers, footers, and A4 margins are handled by Paged.js + @page rules in
    // pdf-render (Chromium cannot hide Puppeteer headerTemplate on specific pages).
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="thesis.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}

