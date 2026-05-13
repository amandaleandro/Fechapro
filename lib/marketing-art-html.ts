import puppeteer from "puppeteer";

type ArtFormat = "instagram_post" | "instagram_story" | "whatsapp_status";

type SalesCopy = {
  badge: string;
  benefits: string[];
  cta: string;
  headline: string;
  proof: string;
  subheadline: string;
};

export type MarketingArtHtmlInput = {
  accentColor: string;
  backgroundDataUrl?: string | null;
  brandName: string;
  category?: string | null;
  format: ArtFormat | string;
  mediaDataUrl?: string | null;
  mediaDataUrls?: string[] | null;
  primaryColor: string;
  salesCopy: SalesCopy;
  secondaryColor: string;
  serviceName: string | null;
  whatsapp?: string | null;
};

const artFormats: Record<ArtFormat, { width: number; height: number; type: "feed" | "story" }> = {
  instagram_post: { width: 1080, height: 1080, type: "feed" },
  instagram_story: { width: 1080, height: 1920, type: "story" },
  whatsapp_status: { width: 1080, height: 1920, type: "story" },
};

export async function renderMarketingArtHtml(input: MarketingArtHtmlInput) {
  const format = isArtFormat(input.format) ? input.format : "instagram_post";
  const dimensions = artFormats[format];
  const html = buildMarketingArtHtml(input, dimensions);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: dimensions.width,
      height: dimensions.height,
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const bytes = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: dimensions.width, height: dimensions.height },
    });
    return Buffer.from(bytes);
  } finally {
    await browser.close();
  }
}

function buildMarketingArtHtml(
  input: MarketingArtHtmlInput,
  dimensions: { width: number; height: number; type: "feed" | "story" }
) {
  const isStory = dimensions.type === "story";
  const hasBackground = Boolean(input.backgroundDataUrl);
  const mediaImages = (input.mediaDataUrls?.length ? input.mediaDataUrls : input.mediaDataUrl ? [input.mediaDataUrl] : []).slice(0, 4);
  const hasMedia = mediaImages.length > 0 && !hasBackground;
  const palette = categoryPalette(input.category);
  const brandColor = sanitizeColor(input.primaryColor, palette.brand);
  const accentColor = sanitizeColor(input.accentColor, palette.accent);
  const darkColor = sanitizeColor(input.secondaryColor, "#07122f");
  const textColor = hasBackground ? "#ffffff" : darkColor;
  const bodyTextColor = hasBackground ? "#e5edf8" : "#334155";
  const cardBackground = hasBackground ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.94)";
  const logo = buildLogoParts(input.brandName);
  const benefits = input.salesCopy.benefits.slice(0, isStory ? 4 : 2);
  const contact = input.whatsapp || "Chame no WhatsApp";
  const backgroundCss = hasBackground
    ? `linear-gradient(90deg, rgba(2,6,23,.86) 0%, rgba(2,6,23,.68) 52%, rgba(2,6,23,.36) 100%), url("${input.backgroundDataUrl}") center / cover no-repeat`
    : `radial-gradient(circle at 88% 12%, ${accentColor} 0 16%, transparent 16.3%),
        radial-gradient(circle at 7% 98%, ${brandColor} 0 15%, transparent 15.3%),
        linear-gradient(135deg, #ffffff 0%, #f7fbff 58%, #eef6ff 100%)`;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=${dimensions.width}, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      margin: 0;
      overflow: hidden;
      font-family: Arial, Helvetica, sans-serif;
      color: ${darkColor};
      background: #f8fbff;
    }
    .art {
      position: relative;
      width: ${dimensions.width}px;
      height: ${dimensions.height}px;
      padding: ${isStory ? "78px 76px" : "64px"};
      overflow: hidden;
      background: ${hasBackground ? backgroundCss : palette.background};
    }
    .curve-top {
      position: absolute;
      inset: 0 0 auto auto;
      width: ${isStory ? "430px" : "360px"};
      height: ${isStory ? "170px" : "120px"};
      background: ${hasBackground ? "rgba(37,99,235,.38)" : palette.topShape};
      border-bottom-left-radius: 100%;
      z-index: 0;
    }
    .curve-bottom {
      position: absolute;
      left: 0;
      bottom: 0;
      width: ${isStory ? "420px" : "340px"};
      height: ${isStory ? "220px" : "145px"};
      background: ${hasBackground ? "rgba(16,185,129,.46)" : palette.bottomShape};
      border-top-right-radius: 100%;
      z-index: 0;
    }
    .dots {
      position: absolute;
      right: ${isStory ? "200px" : "185px"};
      top: ${isStory ? "190px" : "118px"};
      width: ${isStory ? "290px" : "230px"};
      height: ${isStory ? "290px" : "230px"};
      background-image: radial-gradient(#bfdbfe 0 5px, transparent 5px);
      background-size: 32px 32px;
      opacity: ${hasBackground ? ".16" : ".38"};
      z-index: 0;
    }
    .brand {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 18px;
      min-height: 72px;
      font-weight: 900;
    }
    .mark {
      display: grid;
      place-items: center;
      width: ${isStory ? "74px" : "62px"};
      height: ${isStory ? "74px" : "62px"};
      border: 4px solid ${hasBackground ? "#ffffff" : darkColor};
      border-radius: 16px;
      background: white;
      color: ${brandColor};
      font-size: ${isStory ? "42px" : "34px"};
      line-height: 1;
    }
    .brand-name {
      font-size: ${isStory ? "46px" : "38px"};
      line-height: 1;
      letter-spacing: 0;
      max-width: ${isStory ? "650px" : "610px"};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .brand-name span { color: ${accentColor}; }
    .brand-name span::before { content: " "; }
    .badge {
      position: relative;
      z-index: 2;
      display: inline-flex;
      margin-top: ${isStory ? "110px" : "82px"};
      padding: ${isStory ? "17px 30px" : "13px 24px"};
      border-radius: 18px;
      background: ${hasBackground ? "rgba(37,99,235,.94)" : accentColor};
      color: white;
      font-size: ${isStory ? "32px" : "26px"};
      font-weight: 900;
      line-height: 1;
      max-width: 520px;
    }
    .main {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: ${isStory || !hasMedia ? "1fr" : "1fr 330px"};
      gap: ${isStory ? "54px" : "34px"};
      align-items: start;
      margin-top: ${isStory ? "34px" : "26px"};
    }
    .headline {
      margin: 0;
      max-width: ${isStory ? "850px" : hasBackground || !hasMedia ? "760px" : "610px"};
      font-size: ${isStory ? "86px" : "66px"};
      line-height: .98;
      font-weight: 900;
      letter-spacing: 0;
      max-height: ${isStory ? "420px" : "260px"};
      overflow: hidden;
    }
    .headline, .brand-name { color: ${textColor}; }
    .headline strong { color: ${hasBackground ? "#93c5fd" : accentColor}; }
    .subheadline {
      max-width: ${isStory ? "800px" : "600px"};
      margin: ${isStory ? "36px 0 0" : "28px 0 0"};
      font-size: ${isStory ? "36px" : "28px"};
      line-height: 1.28;
      font-weight: 700;
      color: ${bodyTextColor};
      max-height: ${isStory ? "140px" : "108px"};
      overflow: hidden;
    }
    .benefits {
      display: grid;
      gap: ${isStory ? "22px" : "16px"};
      margin-top: ${isStory ? "72px" : "38px"};
      max-width: ${isStory ? "850px" : "920px"};
    }
    .benefit {
      display: grid;
      grid-template-columns: ${isStory ? "72px 1fr" : "56px 1fr"};
      align-items: center;
      min-height: ${isStory ? "104px" : "76px"};
      padding: ${isStory ? "16px 24px" : "13px 18px"};
      border-radius: 22px;
      background: ${cardBackground};
      box-shadow: 0 16px 30px rgba(15,23,42,.12);
      font-size: ${isStory ? "31px" : "23px"};
      font-weight: 900;
    }
    .check {
      display: grid;
      place-items: center;
      width: ${isStory ? "54px" : "42px"};
      height: ${isStory ? "54px" : "42px"};
      border-radius: 50%;
      background: #dcfce7;
      color: ${brandColor};
      font-size: ${isStory ? "34px" : "26px"};
    }
    .media {
      display: ${isStory || hasBackground || !hasMedia ? "none" : "block"};
      align-self: center;
      justify-self: end;
      width: 320px;
      height: 400px;
      border-radius: 42px;
      background: linear-gradient(155deg, #e0f2fe, #ffffff);
      box-shadow: 0 18px 40px rgba(15,23,42,.14);
      overflow: hidden;
    }
    .media-count-2, .media-count-3, .media-count-4 {
      display: ${isStory || hasBackground || !hasMedia ? "none" : "grid"};
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      padding: 6px;
      background: rgba(255,255,255,.92);
    }
    .media img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .media-count-2 img,
    .media-count-3 img,
    .media-count-4 img {
      border-radius: 28px;
    }
    .media-count-3 img:first-child {
      grid-column: span 2;
    }
    .proof {
      position: absolute;
      left: ${isStory ? "76px" : "64px"};
      right: ${isStory ? "76px" : "64px"};
      bottom: ${isStory ? "230px" : "154px"};
      z-index: 2;
      display: ${isStory ? "block" : "none"};
      color: ${bodyTextColor};
      font-size: ${isStory ? "28px" : "22px"};
      font-weight: 800;
      line-height: 1.25;
    }
    .cta {
      position: absolute;
      left: ${isStory ? "76px" : "150px"};
      right: ${isStory ? "76px" : "150px"};
      bottom: ${isStory ? "92px" : "58px"};
      z-index: 3;
      display: grid;
      place-items: center;
      min-height: ${isStory ? "112px" : "86px"};
      border-radius: 999px;
      background: linear-gradient(90deg, ${brandColor}, #18c96d);
      color: white;
      font-size: ${isStory ? "42px" : "34px"};
      font-weight: 900;
      box-shadow: 0 18px 36px rgba(16,185,129,.28);
    }
    .footer {
      position: absolute;
      left: ${isStory ? "76px" : "150px"};
      right: ${isStory ? "76px" : "150px"};
      bottom: ${isStory ? "34px" : "18px"};
      z-index: 4;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: ${isStory ? "18px" : "12px"};
      min-height: ${isStory ? "58px" : "42px"};
      padding: ${isStory ? "12px 24px" : "8px 18px"};
      border-radius: 999px;
      background: ${hasBackground ? "rgba(2,6,23,.46)" : "rgba(255,255,255,.78)"};
      border: 1px solid ${hasBackground ? "rgba(255,255,255,.18)" : "rgba(15,23,42,.08)"};
      backdrop-filter: blur(10px);
      font-size: ${isStory ? "23px" : "18px"};
      font-weight: 800;
      color: ${hasBackground ? "#dbeafe" : "#475569"};
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .footer strong {
      color: ${hasBackground ? "#ffffff" : darkColor};
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .footer span {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .footer span::before {
      content: "";
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: ${brandColor};
    }
  </style>
</head>
<body>
  <section class="art">
    <div class="curve-top"></div>
    <div class="curve-bottom"></div>
    <div class="dots"></div>
    <header class="brand">
      <div class="mark">✓</div>
      <div class="brand-name">${escapeHtml(logo.main)}<span>${escapeHtml(logo.accent)}</span></div>
    </header>
    <div class="badge">${escapeHtml(input.salesCopy.badge)}</div>
    <main class="main">
      <div>
        <h1 class="headline">${highlightHeadline(input.salesCopy.headline)}</h1>
        <p class="subheadline">${escapeHtml(input.salesCopy.subheadline)}</p>
      </div>
      ${
        hasMedia
          ? `<div class="media media-count-${mediaImages.length}">${mediaImages.map((url) => `<img alt="" src="${url}" />`).join("")}</div>`
          : ""
      }
    </main>
    <div class="benefits">
      ${benefits.map((benefit) => `<div class="benefit"><span class="check">✓</span><span>${escapeHtml(benefit)}</span></div>`).join("")}
    </div>
    <div class="proof">${escapeHtml(input.salesCopy.proof)}</div>
    <div class="cta">${escapeHtml(input.salesCopy.cta)}</div>
    <footer class="footer"><strong>${escapeHtml(input.brandName)}</strong><span>${escapeHtml(contact)}</span></footer>
  </section>
</body>
</html>`;
}

function buildLogoParts(brandName: string) {
  const clean = brandName
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!clean.length) return { main: "Fecha", accent: "Pro" };
  if (clean.length === 1) return { main: clean[0].slice(0, 13), accent: "" };
  return {
    main: clean[0].slice(0, 13),
    accent: clean[1].slice(0, 10),
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightHeadline(headline: string) {
  const words = headline.split(/\s+/).filter(Boolean);
  if (words.length < 3) return escapeHtml(headline);
  const first = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const second = words.slice(Math.ceil(words.length / 2)).join(" ");
  return `${escapeHtml(first)} <strong>${escapeHtml(second)}</strong>`;
}

function isArtFormat(value: string): value is ArtFormat {
  return value === "instagram_post" || value === "instagram_story" || value === "whatsapp_status";
}

function categoryPalette(category?: string | null) {
  if (category === "food") {
    return {
      brand: "#16a34a",
      accent: "#f97316",
      background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 48%, #ecfdf5 100%)",
      topShape: "linear-gradient(135deg, #f97316, #dc2626)",
      bottomShape: "#16a34a",
    };
  }
  if (category === "beauty") {
    return {
      brand: "#10b981",
      accent: "#db2777",
      background: "linear-gradient(135deg, #fff1f2 0%, #ffffff 52%, #eef2ff 100%)",
      topShape: "linear-gradient(135deg, #db2777, #7c3aed)",
      bottomShape: "#10b981",
    };
  }
  if (category === "promotion") {
    return {
      brand: "#16a34a",
      accent: "#f59e0b",
      background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 54%, #eff6ff 100%)",
      topShape: "linear-gradient(135deg, #f59e0b, #2563eb)",
      bottomShape: "#16a34a",
    };
  }
  if (category === "traffic" || category === "site") {
    return {
      brand: "#10b981",
      accent: "#2563eb",
      background: "linear-gradient(135deg, #ffffff 0%, #f7fbff 58%, #eef6ff 100%)",
      topShape: "linear-gradient(135deg, #2563eb, #0b3aa8)",
      bottomShape: "#10b981",
    };
  }
  return {
    brand: "#10b981",
    accent: "#2563eb",
    background: "linear-gradient(135deg, #ffffff 0%, #f7fbff 58%, #eef6ff 100%)",
    topShape: "linear-gradient(135deg, #2563eb, #0b3aa8)",
    bottomShape: "#10b981",
  };
}

function sanitizeColor(value: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
