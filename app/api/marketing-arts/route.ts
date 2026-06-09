import { NextResponse } from "next/server";
import sharp from "sharp";
import { jsonError } from "@/lib/api";
import { isAdminEmail } from "@/lib/admin";
import { blockedSubscriptionMessage, canUsePaidFeatures, planLimits } from "@/lib/billing-access";
import { renderMarketingArtHtml } from "@/lib/marketing-art-html";
import { currentMonthRange, plans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitError } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";
import { readLocalFile, saveFile } from "@/lib/storage";
import { cleanOptionalString, cleanString } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const artFormats: Record<string, { label: string; width: number; height: number }> = {
  instagram_post: { label: "Post quadrado", width: 1080, height: 1080 },
  instagram_story: { label: "Story", width: 1080, height: 1920 },
  whatsapp_status: { label: "Status WhatsApp", width: 1080, height: 1920 },
};

type SalesCopy = {
  badge: string;
  benefits: string[];
  caption: string;
  category: string;
  cta: string;
  headline: string;
  proof: string;
  subheadline: string;
  whatsappMessage: string;
};

export async function GET() {
  const session = await requireSession();
  const items = await prisma.marketingArtAsset.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await requireSession();
  const isAdmin = isAdminEmail(session.email);
  if (!rateLimit(`marketing-art:${session.id}`, 30, 60 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as {
    title?: string;
    format?: string;
    objective?: string;
    serviceName?: string;
    audience?: string;
    callToAction?: string;
    referenceImageUrl?: string | null;
    referenceImageUrls?: string[] | null;
    useImageAsBackground?: boolean;
  };

  const title = cleanString(body.title) || "Arte de divulgação";
  const format = artFormats[body.format || ""] ? body.format! : "instagram_post";
  const objective = cleanString(body.objective);
  const serviceName = cleanOptionalString(body.serviceName);
  const audience = cleanOptionalString(body.audience);
  const callToAction = cleanOptionalString(body.callToAction) || "Peça seu orçamento";
  const referenceImageUrl = cleanOptionalString(body.referenceImageUrl);
  const referenceImageUrls = Array.isArray(body.referenceImageUrls)
    ? body.referenceImageUrls.map((url) => cleanOptionalString(url)).filter((url): url is string => Boolean(url)).slice(0, 6)
    : referenceImageUrl
      ? [referenceImageUrl]
      : [];
  const useImageAsBackground = body.useImageAsBackground === true;
  let salesCopy = buildSalesCopy({
    audience,
    callToAction,
    objective,
    serviceName,
  });
  salesCopy = normalizeSalesCopy(salesCopy, salesCopy);

  if (!objective) return jsonError("Informe o objetivo da arte.");

  const subscription = await prisma.planSubscription.upsert({
    where: { userId: session.id },
    create: { userId: session.id, plan: "start", status: "pending" },
    update: {},
  });

  if (!isAdmin && !canUsePaidFeatures(subscription)) {
    return jsonError(blockedSubscriptionMessage(subscription.status), 402);
  }

  const plan = planLimits(subscription.plan);
  const { start, end } = currentMonthRange();
  const usedThisMonth = await prisma.marketingArtAsset.count({
    where: {
      userId: session.id,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });

  // Primeiro consome o lote mensal do plano (renovável); só depois usa os créditos
  // avulsos/de boas-vindas (artCreditBalance), que são acumulativos e não recorrentes.
  const withinMonthlyAllowance = usedThisMonth < plan.artLimit;
  const hasCredits = subscription.artCreditBalance > 0;
  const shouldUseExtraCredit = !withinMonthlyAllowance;

  if (!isAdmin && !withinMonthlyAllowance && !hasCredits) {
    return jsonError(
      plan.artLimit > 0
        ? "Limite de artes atingido. Compre um pacote individual para criar mais."
        : "Artes de divulgação estão disponíveis em pacotes individuais ou em planos com artes incluídas.",
      402,
    );
  }

  const item = await prisma.marketingArtAsset.create({
    data: {
      userId: session.id,
      title,
      format,
      objective,
      serviceName,
      audience,
      callToAction,
      caption: null,
      whatsappMessage: null,
      category: salesCopy.category,
      prompt: [
        `Formato: ${artFormats[format].label}`,
        `Pedido: ${objective}`,
        serviceName ? `Serviço/produto: ${serviceName}` : "",
        audience ? `Cidade/público: ${audience}` : "",
        callToAction ? `CTA: ${callToAction}` : "",
        referenceImageUrls.length ? `Referencias: ${referenceImageUrls.join(", ")}` : "",
        useImageAsBackground ? "Cliente pediu para usar uma referencia como fundo." : "",
      ].filter(Boolean).join("\n"),
      imageUrl: "",
      referenceImageUrl,
      source: "requested",
    },
  });

  if (!isAdmin && shouldUseExtraCredit) {
    await prisma.planSubscription.update({
      where: { userId: session.id },
      data: { artCreditBalance: { decrement: 1 } },
    });
  }

  return NextResponse.json(item, { status: 201 });
}

async function loadReferenceImage(referenceImageUrl: string | null) {
  if (!referenceImageUrl?.startsWith("/api/uploads/")) return null;
  const filename = referenceImageUrl.split("/").pop();
  if (!filename) return null;
  const bytes = await readLocalFile(filename);
  if (!bytes) return null;
  const metadata = await sharp(bytes).metadata().catch(() => null);
  const contentType = metadata?.format === "png" ? "image/png" : metadata?.format === "webp" ? "image/webp" : "image/jpeg";
  return { bytes, contentType };
}

async function loadImageDataUrl(imageUrl: string | null) {
  if (!imageUrl) return null;

  if (imageUrl.startsWith("/api/uploads/")) {
    const reference = await loadReferenceImage(imageUrl);
    return reference ? `data:${reference.contentType};base64,${reference.bytes.toString("base64")}` : null;
  }

  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) return null;

  try {
    const response = await fetch(imageUrl, { cache: "no-store" });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

async function createTemplateArt(input: {
  accentColor: string;
  brandName: string;
  callToAction: string;
  format: string;
  objective: string;
  primaryColor: string;
  referenceImageUrl?: string | null;
  referenceImageUrls?: string[] | null;
  portfolioImageUrl?: string | null;
  salesCopy: SalesCopy;
  secondaryColor: string;
  serviceName: string | null;
  useImageAsBackground?: boolean;
  whatsapp?: string | null;
}) {
  const uploadedUrls = input.referenceImageUrls?.length ? input.referenceImageUrls : input.referenceImageUrl ? [input.referenceImageUrl] : [];
  const reference = input.useImageAsBackground ? await loadReferenceImage(uploadedUrls[0] || null) : null;
  const backgroundDataUrl = reference ? `data:${reference.contentType};base64,${reference.bytes.toString("base64")}` : null;
  const mediaUrls = !input.useImageAsBackground ? (uploadedUrls.length ? uploadedUrls : input.portfolioImageUrl ? [input.portfolioImageUrl] : []) : [];
  const mediaDataUrls = (await Promise.all(mediaUrls.slice(0, 4).map((url) => loadImageDataUrl(url)))).filter((url): url is string => Boolean(url));
  const bytes = await renderMarketingArtHtml({
    ...input,
    backgroundDataUrl,
    mediaDataUrl: mediaDataUrls[0] || null,
    mediaDataUrls,
    category: input.salesCopy.category,
  });
  return saveFile(`${crypto.randomUUID()}.png`, bytes, "image/png");
}

async function createFallbackArt(input: Parameters<typeof createCleanFallbackArt>[0]) {
  return createCleanFallbackArt(input);
}

async function createCleanFallbackArt(input: {
  accentColor: string;
  brandName: string;
  callToAction: string;
  format: string;
  objective: string;
  primaryColor: string;
  referenceImageUrl?: string | null;
  salesCopy: SalesCopy;
  secondaryColor: string;
  serviceName: string | null;
  supportImage?: Buffer | null;
  useImageAsBackground?: boolean;
  whatsapp?: string | null;
}) {
  const dimensions = artFormats[input.format] || artFormats.instagram_post;
  const isStory = dimensions.height > dimensions.width;
  const brandColor = sanitizeColor(input.primaryColor, "#0f766e");
  const accentColor = sanitizeColor(input.accentColor, "#2563eb");
  const darkColor = sanitizeColor(input.secondaryColor, "#07122f");
  const margin = isStory ? 88 : 72;
  const titleLines = wrapTitle(input.salesCopy.headline, isStory ? 17 : 15).slice(0, isStory ? 3 : 2);
  const subtitleLines = wrapTitle(input.salesCopy.subheadline, isStory ? 34 : 30).slice(0, 2);
  const contact = input.whatsapp || "Fale conosco";
  const useBackground = Boolean(input.useImageAsBackground && input.referenceImageUrl);
  if (!useBackground) return createBrandCampaignFallbackArt(input);

  const panelX = useBackground ? (isStory ? 74 : 62) : 0;
  const panelY = useBackground ? (isStory ? 86 : 58) : 0;
  const panelWidth = useBackground ? dimensions.width - panelX * 2 : 0;
  const panelHeight = useBackground ? (isStory ? dimensions.height - 172 : dimensions.height - 132) : 0;
  const contentX = useBackground ? panelX + (isStory ? 58 : 50) : margin;
  const contentMaxWidth = useBackground ? panelWidth - (isStory ? 116 : 100) : dimensions.width - margin * 2;
  const titleTop = useBackground ? panelY + (isStory ? 330 : 270) : isStory ? 520 : 330;
  const titleSize = isStory ? 88 : 74;
  const titleLineHeight = isStory ? 98 : 82;
  const subtitleTop = titleTop + titleLines.length * titleLineHeight + (isStory ? 42 : 34);
  const ctaHeight = isStory ? 112 : 88;
  const ctaY = useBackground ? panelY + panelHeight - (isStory ? 190 : 162) : isStory ? dimensions.height - 270 : dimensions.height - 188;
  const footerY = useBackground ? panelY + panelHeight - (isStory ? 54 : 42) : isStory ? dimensions.height - 72 : dimensions.height - 56;
  const textColor = useBackground ? "#ffffff" : darkColor;
  const mutedColor = useBackground ? "#e8eefc" : "#475569";
  const logoY = useBackground ? panelY + (isStory ? 52 : 46) : isStory ? 94 : 72;

  const titleSvg = titleLines
    .map((line, index) => {
      const fill = useBackground ? "#ffffff" : index === 1 ? accentColor : darkColor;
      return `<text x="${contentX}" y="${titleTop + index * titleLineHeight}" fill="${fill}" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="900">${escapeXml(line)}</text>`;
    })
    .join("");
  const subtitleSvg = subtitleLines
    .map((line, index) => {
      return `<text x="${contentX}" y="${subtitleTop + index * (isStory ? 44 : 38)}" fill="${mutedColor}" font-family="Arial, sans-serif" font-size="${isStory ? 34 : 28}" font-weight="700">${escapeXml(line)}</text>`;
    })
    .join("");
  const price = extractPrice(input.objective);
  const priceSvg = price
    ? `<text x="${contentX}" y="${subtitleTop + subtitleLines.length * (isStory ? 44 : 38) + (isStory ? 104 : 78)}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${isStory ? 92 : 70}" font-weight="900">${escapeXml(price)}</text>`
    : "";

  const benefitTop = price ? subtitleTop + subtitleLines.length * (isStory ? 44 : 38) + (isStory ? 136 : 104) : subtitleTop + subtitleLines.length * (isStory ? 44 : 38) + (isStory ? 70 : 54);
  const benefitsSvg = input.salesCopy.benefits.slice(0, isStory ? 3 : 2).map((benefit, index) => {
    const y = benefitTop + index * (isStory ? 54 : 44);
    return `
      <g>
        <circle cx="${contentX + 14}" cy="${y - 10}" r="${isStory ? 14 : 11}" fill="${useBackground ? "#ffffff" : "#dcfce7"}" opacity="${useBackground ? 0.92 : 1}"/>
        <path d="M ${contentX + 7} ${y - 10} l 5 6 l 10 -12" fill="none" stroke="${brandColor}" stroke-width="${isStory ? 5 : 4}" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="${contentX + (isStory ? 44 : 36)}" y="${y}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${isStory ? 30 : 24}" font-weight="800">${escapeXml(truncate(benefit, isStory ? 42 : 34))}</text>
      </g>
    `;
  }).join("");

  const overlaySvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}">
      <defs>
        <linearGradient id="cleanBg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="58%" stop-color="#f5f9ff"/>
          <stop offset="100%" stop-color="#ecfdf5"/>
        </linearGradient>
        <linearGradient id="photoShade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#020617" stop-opacity="0.34"/>
          <stop offset="48%" stop-color="#020617" stop-opacity="0.54"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0.76"/>
        </linearGradient>
        <linearGradient id="greenCta" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stop-color="#00a63e"/>
          <stop offset="100%" stop-color="#13c56b"/>
        </linearGradient>
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.16"/>
        </filter>
      </defs>
      ${useBackground ? '<rect width="100%" height="100%" fill="url(#photoShade)"/>' : '<rect width="100%" height="100%" fill="url(#cleanBg)"/>'}
      ${
        useBackground
          ? `
            <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="${isStory ? 42 : 34}" fill="#020617" opacity="0.78"/>
            <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" rx="${isStory ? 42 : 34}" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2"/>
          `
          : ""
      }
      ${
        useBackground
          ? ""
          : `
            <circle cx="${dimensions.width - 78}" cy="${isStory ? 86 : 70}" r="${isStory ? 210 : 160}" fill="${accentColor}" opacity="0.92"/>
            <circle cx="${isStory ? 24 : 18}" cy="${dimensions.height - 42}" r="${isStory ? 165 : 115}" fill="${brandColor}" opacity="0.9"/>
            <circle cx="${Math.round(dimensions.width * 0.73)}" cy="${Math.round(dimensions.height * 0.15)}" r="${isStory ? 152 : 116}" fill="#dbeafe" opacity="0.7"/>
            <g opacity="0.28" fill="#bfdbfe">${dotPattern(dimensions.width - (isStory ? 430 : 330), isStory ? 190 : 140, isStory ? 260 : 210)}</g>
          `
      }
      <g transform="translate(${contentX} ${logoY})">
        <text x="0" y="${isStory ? 70 : 58}" fill="${useBackground ? "#ffffff" : accentColor}" font-family="Arial, sans-serif" font-size="${isStory ? 96 : 78}" font-weight="900">${escapeXml(input.brandName.trim().charAt(0).toUpperCase() || "F")}</text>
        <path d="M 3 ${isStory ? 86 : 72} H ${isStory ? 86 : 70}" stroke="${brandColor}" stroke-width="5"/>
        <text x="0" y="${isStory ? 122 : 102}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${isStory ? 25 : 20}" font-weight="800">${escapeXml(input.brandName.slice(0, 36))}</text>
      </g>
      <rect x="${contentX}" y="${titleTop - (isStory ? 128 : 104)}" width="${isStory ? 300 : 248}" height="${isStory ? 58 : 48}" rx="${isStory ? 29 : 24}" fill="${useBackground ? "#ffffff" : "#e8f8ef"}" opacity="${useBackground ? 0.18 : 1}"/>
      <text x="${contentX + 28}" y="${titleTop - (isStory ? 90 : 72)}" fill="${useBackground ? "#ffffff" : brandColor}" font-family="Arial, sans-serif" font-size="${isStory ? 28 : 23}" font-weight="900">${escapeXml(input.salesCopy.badge)}</text>
      ${titleSvg}
      ${subtitleSvg}
      ${priceSvg}
      ${benefitsSvg}
      <g filter="url(#softShadow)">
        <rect x="${contentX}" y="${ctaY}" width="${contentMaxWidth}" height="${ctaHeight}" rx="${ctaHeight / 2}" fill="url(#greenCta)"/>
      </g>
      <text x="${contentX + contentMaxWidth / 2}" y="${ctaY + (isStory ? 70 : 56)}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${isStory ? 42 : 34}" font-weight="900">${escapeXml(truncate(input.salesCopy.cta, isStory ? 34 : 26))}</text>
      <text x="${contentX}" y="${ctaY - (isStory ? 48 : 36)}" fill="${mutedColor}" font-family="Arial, sans-serif" font-size="${isStory ? 24 : 19}" font-weight="800">${escapeXml(truncate(input.salesCopy.proof, isStory ? 48 : 42))}</text>
      <text x="${contentX}" y="${footerY}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${isStory ? 25 : 20}" font-weight="800" opacity="${useBackground ? 0.92 : 0.76}">${escapeXml(contact)}</text>
    </svg>
  `;

  let bytes: Buffer;
  if (useBackground) {
    const reference = await loadReferenceImage(input.referenceImageUrl || null);
    if (reference) {
      const background = await sharp(reference.bytes)
        .rotate()
        .resize(dimensions.width, dimensions.height, { fit: "cover" })
        .blur(isStory ? 4 : 3)
        .modulate({ brightness: 0.72, saturation: 0.86 })
        .png()
        .toBuffer();
      bytes = await sharp(background)
        .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
        .png()
        .toBuffer();
    } else {
      bytes = await sharp(Buffer.from(overlaySvg)).png().toBuffer();
    }
  } else {
    bytes = await sharp(Buffer.from(overlaySvg)).png().toBuffer();
  }

  return saveFile(`${crypto.randomUUID()}.png`, bytes, "image/png");
}

async function createBrandCampaignFallbackArt(input: Parameters<typeof createAudienceCampaignFallbackArt>[0]) {
  return createAudienceCampaignFallbackArt(input);
}

async function createPolishedFallbackArt(input: {
  accentColor: string;
  brandName: string;
  callToAction: string;
  format: string;
  objective: string;
  primaryColor: string;
  secondaryColor: string;
  serviceName: string | null;
  whatsapp?: string | null;
}) {
  const dimensions = artFormats[input.format] || artFormats.instagram_post;
  const isStory = dimensions.height > dimensions.width;
  const margin = isStory ? 108 : 78;
  const brandColor = sanitizeColor(input.primaryColor, "#0f766e");
  const accentColor = sanitizeColor(input.accentColor, "#2563eb");
  const darkColor = sanitizeColor(input.secondaryColor, "#07122f");
  const brandInitial = input.brandName.trim().charAt(0).toUpperCase() || "F";
  const title = input.serviceName || extractHeadline(input.objective);
  const titleLines = wrapTitle(title, isStory ? 16 : 14).slice(0, isStory ? 3 : 2);
  const objectiveLines = wrapTitle(input.objective, isStory ? 34 : 30).slice(0, isStory ? 3 : 2);
  const price = extractPrice(input.objective);
  const benefits = buildBenefits(input.objective, input.serviceName).slice(0, isStory ? 3 : 2);

  const titleTop = isStory ? 320 : 220;
  const titleLineHeight = isStory ? 98 : 78;
  const titleSize = isStory ? 88 : 72;
  const badgeY = titleTop + titleLines.length * titleLineHeight + (isStory ? 36 : 30);
  const objectiveY = badgeY + (isStory ? 94 : 84);
  const priceY = price ? objectiveY + objectiveLines.length * (isStory ? 42 : 36) + (isStory ? 96 : 76) : 0;
  const cardStart = isStory ? Math.max(1010, price ? priceY + 120 : objectiveY + 190) : price ? 650 : 615;
  const cardHeight = isStory ? 122 : 86;
  const cardGap = isStory ? 154 : 112;
  const ctaY = isStory ? dimensions.height - 242 : 888;
  const footerY = isStory ? dimensions.height - 66 : 1030;

  const titleSvg = titleLines
    .map((line, index) => {
      const fill = index === 1 ? accentColor : darkColor;
      return `<text x="${margin}" y="${titleTop + index * titleLineHeight}" fill="${fill}" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="900">${escapeXml(line)}</text>`;
    })
    .join("");

  const objectiveSvg = objectiveLines
    .map((line, index) => {
      return `<text x="${margin}" y="${objectiveY + index * (isStory ? 42 : 36)}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 34 : 28}" font-weight="${index === 0 ? 800 : 500}" opacity="0.9">${escapeXml(line)}</text>`;
    })
    .join("");

  const benefitSvg = benefits
    .map((benefit, index) => {
      const y = cardStart + index * cardGap;
      const iconPath = index === 0 ? documentIcon() : index === 1 ? chartIcon() : checkIcon();
      const label = truncate(benefit, isStory ? 31 : 28);
      return `
        <g filter="url(#softShadow)">
          <rect x="${margin}" y="${y}" width="${dimensions.width - margin * 2}" height="${cardHeight}" rx="24" fill="#ffffff"/>
        </g>
        <rect x="${margin + 28}" y="${y + (isStory ? 20 : 15)}" width="${isStory ? 82 : 56}" height="${isStory ? 82 : 56}" rx="18" fill="#e9f8ef"/>
        <g transform="translate(${margin + (isStory ? 47 : 39)} ${y + (isStory ? 39 : 25)}) scale(${isStory ? 1.45 : 1})" fill="none" stroke="${brandColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${iconPath}</g>
        <circle cx="${margin + (isStory ? 188 : 130)}" cy="${y + (isStory ? 61 : 43)}" r="${isStory ? 22 : 16}" fill="#ffffff" stroke="#16a34a" stroke-width="5"/>
        <path d="M ${margin + (isStory ? 178 : 122)} ${y + (isStory ? 60 : 42)} l ${isStory ? 8 : 6} ${isStory ? 8 : 6} l ${isStory ? 18 : 13} -${isStory ? 20 : 15}" fill="none" stroke="#16a34a" stroke-width="${isStory ? 6 : 4}" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="${margin + (isStory ? 245 : 176)}" y="${y + (isStory ? 75 : 54)}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 42 : 30}" font-weight="900">${escapeXml(label)}</text>
      `;
    })
    .join("");

  const priceBlock = price
    ? `
      <text x="${margin}" y="${priceY}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 104 : 76}" font-weight="900">${escapeXml(price)}</text>
      <text x="${margin + (isStory ? 360 : 265)}" y="${priceY}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 44 : 32}" font-weight="500">/mês</text>
    `
    : "";

  const storyLead = isStory
    ? `
      <text x="${margin + 170}" y="${dimensions.height - 335}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="38" font-weight="500">Ideal para quem quer</text>
      <text x="${margin + 170}" y="${dimensions.height - 286}" fill="${accentColor}" font-family="Arial, sans-serif" font-size="38" font-weight="900">vender melhor com presença digital.</text>
    `
    : "";

  const ctaLeft = margin + (isStory ? 45 : 34);
  const ctaHeight = isStory ? 116 : 92;
  const ctaCenterY = ctaY + ctaHeight / 2;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}">
      <defs>
        <linearGradient id="blueGlow" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#1d4ed8"/>
          <stop offset="100%" stop-color="#06b6d4"/>
        </linearGradient>
        <linearGradient id="greenCta" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stop-color="#00a63e"/>
          <stop offset="100%" stop-color="#13c56b"/>
        </linearGradient>
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.14"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#f8fbff"/>
      <circle cx="${dimensions.width - 76}" cy="${isStory ? 82 : 62}" r="${isStory ? 220 : 160}" fill="url(#blueGlow)"/>
      <circle cx="${isStory ? 40 : 30}" cy="${dimensions.height - 58}" r="${isStory ? 180 : 120}" fill="#04b64f"/>
      <circle cx="${Math.round(dimensions.width * 0.75)}" cy="${Math.round(dimensions.height * 0.08)}" r="${isStory ? 170 : 112}" fill="#eaf2ff"/>
      <g opacity="0.35" fill="#bfdbfe">
        ${dotPattern(dimensions.width - (isStory ? 470 : 360), isStory ? 130 : 92, isStory ? 300 : 240)}
      </g>
      <g transform="translate(${margin} ${isStory ? 92 : 70})">
        <text x="0" y="72" fill="${accentColor}" font-family="Arial, sans-serif" font-size="${isStory ? 108 : 82}" font-weight="900">${escapeXml(brandInitial)}</text>
        <path d="M 4 88 H ${isStory ? 92 : 70}" stroke="${brandColor}" stroke-width="5"/>
        <text x="0" y="${isStory ? 124 : 106}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 25 : 20}" font-weight="600">${escapeXml(input.brandName.slice(0, 34))}</text>
      </g>
      ${titleSvg}
      <rect x="${margin}" y="${badgeY}" width="${isStory ? 350 : 250}" height="${isStory ? 66 : 54}" rx="${isStory ? 33 : 27}" fill="#0bbf5a"/>
      <circle cx="${margin + (isStory ? 54 : 42)}" cy="${badgeY + (isStory ? 33 : 27)}" r="${isStory ? 21 : 17}" fill="#ffffff"/>
      <path d="M ${margin + (isStory ? 45 : 35)} ${badgeY + (isStory ? 33 : 27)} l ${isStory ? 7 : 5} ${isStory ? 8 : 6} l ${isStory ? 15 : 12} -${isStory ? 17 : 13}" fill="none" stroke="#0bbf5a" stroke-width="${isStory ? 6 : 5}" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${margin + (isStory ? 116 : 78)}" y="${badgeY + (isStory ? 45 : 36)}" fill="#ffffff" font-family="Arial, sans-serif" font-size="${isStory ? 36 : 28}" font-weight="900">Destaque</text>
      ${objectiveSvg}
      ${priceBlock}
      ${benefitSvg}
      ${storyLead}
      <rect x="${ctaLeft}" y="${ctaY}" width="${dimensions.width - ctaLeft * 2}" height="${ctaHeight}" rx="${ctaHeight / 2}" fill="url(#greenCta)"/>
      <circle cx="${margin + (isStory ? 132 : 104)}" cy="${ctaCenterY}" r="${isStory ? 38 : 31}" fill="#ffffff"/>
      <path d="M ${margin + (isStory ? 116 : 91)} ${ctaCenterY} h ${isStory ? 32 : 26} m -10 -12 l 12 12 l -12 12" fill="none" stroke="#00a63e" stroke-width="${isStory ? 8 : 7}" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${dimensions.width / 2}" y="${ctaY + (isStory ? 73 : 58)}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${isStory ? 46 : 36}" font-weight="900">${escapeXml(truncate(input.callToAction, isStory ? 34 : 24))}</text>
      <text x="${margin}" y="${footerY}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 26 : 20}" font-weight="700" opacity="0.78">${escapeXml(input.whatsapp || "Fale conosco")}</text>
    </svg>
  `;
  const bytes = await sharp(Buffer.from(svg)).png().toBuffer();
  return saveFile(`${crypto.randomUUID()}.png`, bytes, "image/png");
}

async function createAudienceCampaignFallbackArt(input: {
  accentColor: string;
  brandName: string;
  callToAction: string;
  format: string;
  objective: string;
  primaryColor: string;
  referenceImageUrl?: string | null;
  salesCopy: SalesCopy;
  secondaryColor: string;
  serviceName: string | null;
  supportImage?: Buffer | null;
  useImageAsBackground?: boolean;
  whatsapp?: string | null;
}) {
  const dimensions = artFormats[input.format] || artFormats.instagram_post;
  const isStory = dimensions.height > dimensions.width;
  const brandColor = sanitizeColor(input.primaryColor, "#16a34a");
  const accentColor = sanitizeColor(input.accentColor, "#1455ff");
  const darkColor = "#061334";
  const margin = isStory ? 76 : 64;
  const headline = buildEditorialHeadline(input.salesCopy);
  const titleLines = wrapTitle(headline, isStory ? 19 : 22).slice(0, isStory ? 4 : 2);
  const titleSize = isStory ? 74 : 58;
  const titleLineHeight = isStory ? 82 : 66;
  const titleTop = isStory ? 300 : 292;
  const copyTop = titleTop + titleLines.length * titleLineHeight + (isStory ? 42 : 34);
  const copyLines = wrapTitle(input.salesCopy.subheadline, isStory ? 36 : 30).slice(0, 2);
  const cardTop = isStory ? copyTop + 150 : 682;
  const cardWidth = isStory ? Math.floor((dimensions.width - margin * 2 - 24) / 2) : 220;
  const cardHeight = isStory ? 146 : 128;
  const cards = buildEditorialCards(input.salesCopy).slice(0, isStory ? 4 : 3);
  const ctaWidth = isStory ? dimensions.width - margin * 2 : 690;
  const ctaHeight = isStory ? 104 : 86;
  const ctaX = isStory ? margin : Math.round((dimensions.width - ctaWidth) / 2);
  const ctaY = dimensions.height - (isStory ? 184 : 128);
  const mediaBox = {
    x: isStory ? dimensions.width - 450 : 650,
    y: isStory ? 250 : 190,
    width: isStory ? 360 : 350,
    height: isStory ? 520 : 430,
    radius: isStory ? 52 : 42,
  };
  const illustration = input.supportImage
    ? `
      <g filter="url(#softShadow)">
        <rect x="${mediaBox.x}" y="${mediaBox.y}" width="${mediaBox.width}" height="${mediaBox.height}" rx="${mediaBox.radius}" fill="#ffffff"/>
      </g>
      <rect x="${mediaBox.x}" y="${mediaBox.y}" width="${mediaBox.width}" height="${mediaBox.height}" rx="${mediaBox.radius}" fill="#dbeafe"/>
    `
    : buildAudienceIllustration({
    accentColor,
    brandColor,
    darkColor,
    isStory,
    x: isStory ? dimensions.width - 420 : 655,
    y: isStory ? 255 : 205,
  });
  const titleSvg = titleLines
    .map((line, index) => {
      return `<text x="${margin}" y="${titleTop + index * titleLineHeight}" fill="${index === 1 ? accentColor : darkColor}" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="900">${escapeXml(line)}</text>`;
    })
    .join("");
  const copySvg = copyLines
    .map((line, index) => {
      return `<text x="${margin}" y="${copyTop + index * (isStory ? 40 : 34)}" fill="${index === 1 ? accentColor : darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 30 : 25}" font-weight="${index === 1 ? 900 : 600}">${escapeXml(line)}</text>`;
    })
    .join("");
  const cardsSvg = cards
    .map((card, index) => {
      const col = isStory ? index % 2 : index;
      const row = isStory ? Math.floor(index / 2) : 0;
      const gap = isStory ? 24 : 20;
      const x = margin + col * (cardWidth + gap);
      const y = cardTop + row * (cardHeight + 24);
      const iconPath = index === 0 ? documentIcon() : index === 1 ? checkIcon() : index === 2 ? chartIcon() : peopleIcon();
      return `
        <g filter="url(#softShadow)">
          <rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="20" fill="#ffffff"/>
        </g>
        <g transform="translate(${x + 26} ${y + 22}) scale(${isStory ? 1.05 : 0.88})" fill="none" stroke="${index % 2 ? brandColor : darkColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${iconPath}</g>
        <text x="${x + 22}" y="${y + cardHeight - 44}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 22 : 18}" font-weight="900">${escapeXml(card[0])}</text>
        <text x="${x + 22}" y="${y + cardHeight - 18}" fill="${accentColor}" font-family="Arial, sans-serif" font-size="${isStory ? 22 : 18}" font-weight="900">${escapeXml(card[1])}</text>
      `;
    })
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}">
      <defs>
        <linearGradient id="pageBg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="56%" stop-color="#f7fbff"/>
          <stop offset="100%" stop-color="#eef6ff"/>
        </linearGradient>
        <linearGradient id="blueBlock" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#1455ff"/>
          <stop offset="100%" stop-color="#062d9f"/>
        </linearGradient>
        <linearGradient id="cta" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stop-color="#061334"/>
          <stop offset="100%" stop-color="#08245e"/>
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="14" stdDeviation="15" flood-color="#0f172a" flood-opacity="0.13"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#pageBg)"/>
      <path d="M ${dimensions.width * 0.7} 0 C ${dimensions.width * 0.82} ${isStory ? 120 : 72}, ${dimensions.width * 0.93} ${isStory ? 70 : 46}, ${dimensions.width} ${isStory ? 130 : 86} V 0 Z" fill="url(#blueBlock)"/>
      <path d="M 0 ${dimensions.height - (isStory ? 190 : 122)} C ${dimensions.width * 0.1} ${dimensions.height - (isStory ? 105 : 70)}, ${dimensions.width * 0.23} ${dimensions.height - (isStory ? 80 : 48)}, ${dimensions.width * 0.34} ${dimensions.height} H 0 Z" fill="#1455ff"/>
      <circle cx="${dimensions.width - (isStory ? 140 : 112)}" cy="${isStory ? 315 : 250}" r="${isStory ? 132 : 104}" fill="#dbeafe" opacity="0.76"/>
      <g opacity="0.32" fill="#bfdbfe">${dotPattern(dimensions.width - (isStory ? 520 : 455), isStory ? 180 : 120, isStory ? 260 : 220)}</g>
      <g transform="translate(${margin} ${isStory ? 76 : 66})">
        <rect x="0" y="0" width="${isStory ? 62 : 54}" height="${isStory ? 62 : 54}" rx="14" fill="#ffffff" stroke="${darkColor}" stroke-width="4"/>
        <path d="M ${isStory ? 17 : 15} ${isStory ? 33 : 29} l ${isStory ? 10 : 8} ${isStory ? 10 : 8} l ${isStory ? 21 : 17} -${isStory ? 25 : 20}" fill="none" stroke="${brandColor}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="${isStory ? 80 : 70}" y="${isStory ? 45 : 40}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 40 : 33}" font-weight="900">${escapeXml(truncate(input.brandName, isStory ? 22 : 20))}</text>
      </g>
      ${illustration}
      <rect x="${margin}" y="${titleTop - (isStory ? 98 : 118)}" width="${isStory ? 300 : 254}" height="${isStory ? 62 : 52}" rx="17" fill="${accentColor}"/>
      <path d="M ${margin + 44} ${titleTop - (isStory ? 36 : 68)} l -20 20 h 34 z" fill="${accentColor}"/>
      <text x="${margin + 28}" y="${titleTop - (isStory ? 58 : 83)}" fill="#ffffff" font-family="Arial, sans-serif" font-size="${isStory ? 31 : 25}" font-weight="900">${escapeXml(input.salesCopy.badge)}</text>
      ${titleSvg}
      <path d="M ${margin + 170} ${titleTop + titleLines.length * titleLineHeight - 18} C ${margin + 270} ${titleTop + titleLines.length * titleLineHeight - 36}, ${margin + 390} ${titleTop + titleLines.length * titleLineHeight - 34}, ${margin + 500} ${titleTop + titleLines.length * titleLineHeight - 48}" fill="none" stroke="${brandColor}" stroke-width="7" stroke-linecap="round"/>
      <g>
        <circle cx="${margin + 42}" cy="${copyTop - 18}" r="${isStory ? 34 : 28}" fill="${accentColor}"/>
        <path d="M ${margin + 42} ${copyTop - 36} v 36 M ${margin + 25} ${copyTop - 18} h 34" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
        ${copySvg.replaceAll(`x="${margin}"`, `x="${margin + (isStory ? 94 : 82)}"`)}
      </g>
      ${cardsSvg}
      <g filter="url(#softShadow)">
        <rect x="${ctaX}" y="${ctaY}" width="${ctaWidth}" height="${ctaHeight}" rx="${ctaHeight / 2}" fill="url(#cta)"/>
      </g>
      <text x="${ctaX + ctaWidth / 2}" y="${ctaY + (isStory ? 67 : 56)}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${isStory ? 38 : 32}" font-weight="900">${escapeXml(truncate(input.salesCopy.cta, isStory ? 34 : 30))}</text>
    </svg>
  `;
  let bytes = await sharp(Buffer.from(svg)).png().toBuffer();
  if (input.supportImage) {
    const roundedMask = Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${mediaBox.width}" height="${mediaBox.height}">
        <rect width="${mediaBox.width}" height="${mediaBox.height}" rx="${mediaBox.radius}" fill="#ffffff"/>
      </svg>
    `);
    const media = await sharp(input.supportImage)
      .rotate()
      .resize(mediaBox.width, mediaBox.height, { fit: "cover" })
      .composite([{ input: roundedMask, blend: "dest-in" }])
      .png()
      .toBuffer();
    const frame = Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}">
        <rect x="${mediaBox.x}" y="${mediaBox.y}" width="${mediaBox.width}" height="${mediaBox.height}" rx="${mediaBox.radius}" fill="none" stroke="#ffffff" stroke-width="10"/>
        <rect x="${mediaBox.x + 5}" y="${mediaBox.y + 5}" width="${mediaBox.width - 10}" height="${mediaBox.height - 10}" rx="${Math.max(1, mediaBox.radius - 5)}" fill="none" stroke="${accentColor}" stroke-opacity="0.34" stroke-width="3"/>
      </svg>
    `);
    bytes = await sharp(bytes)
      .composite([
        { input: media, left: mediaBox.x, top: mediaBox.y },
        { input: frame, left: 0, top: 0 },
      ])
      .png()
      .toBuffer();
  }
  return saveFile(`${crypto.randomUUID()}.png`, bytes, "image/png");
}

function buildBenefits(objective: string, serviceName: string | null) {
  const lower = objective.toLowerCase();
  if (lower.includes("site")) return ["Site one page", "Proposta + presença online", "Contato direto para orçamento"];
  if (lower.includes("proposta")) return ["Proposta profissional", "Link fácil de enviar", "Mais confiança para fechar"];
  if (lower.includes("promoc")) return ["Condição especial", "Atendimento rápido", "Chame no WhatsApp"];
  return [serviceName || "Serviço profissional", "Atendimento personalizado", "Orçamento rápido"];
}

function buildEditorialHeadline(copy: SalesCopy) {
  const lower = copy.headline.toLowerCase();
  if (lower.includes("site") || lower.includes("online")) return "3 motivos para ter um site profissional";
  if (lower.includes("anuncio") || lower.includes("clientes")) return "Anúncios que fazem clientes chamarem";
  if (lower.includes("agenda")) return "Agenda aberta para novos atendimentos";
  if (lower.includes("condicao") || lower.includes("oferta")) return "Oferta especial para fechar hoje";
  return copy.headline;
}

function buildEditorialCards(copy: SalesCopy) {
  return copy.benefits.map((benefit) => {
    const lower = benefit.toLowerCase();
    if (lower.includes("atendimento")) return ["Atendimento", "rápido"];
    if (lower.includes("escopo")) return ["Escopo", "explicado"];
    if (lower.includes("chamada") || lower.includes("whatsapp")) return ["Chamada", "direta"];
    if (lower.includes("visual")) return ["Visual", "profissional"];
    if (lower.includes("botao")) return ["Botão", "WhatsApp"];
    if (lower.includes("confianca")) return ["Mais", "confianca"];
    if (lower.includes("campanha")) return ["Campanhas", "ativas"];
    if (lower.includes("publico") || lower.includes("público")) return ["Público", "certo"];
    const words = wrapTitle(benefit, 20);
    return [words[0] || benefit, words[1] || "profissional"];
  });
}

function buildAudienceIllustration(input: {
  accentColor: string;
  brandColor: string;
  darkColor: string;
  isStory: boolean;
  x: number;
  y: number;
}) {
  const scale = input.isStory ? 1.22 : 0.95;
  return `
    <g transform="translate(${input.x} ${input.y}) scale(${scale})">
      <ellipse cx="175" cy="250" rx="150" ry="42" fill="#dbeafe" opacity="0.7"/>
      <circle cx="155" cy="82" r="58" fill="#c8793d"/>
      <path d="M 88 82 C 82 22, 136 -8, 184 14 C 239 36, 237 102, 208 132 C 211 88, 188 60, 151 61 C 122 62, 103 72, 88 82 Z" fill="#24140f"/>
      <circle cx="136" cy="82" r="7" fill="#061334"/>
      <circle cx="177" cy="82" r="7" fill="#061334"/>
      <path d="M 137 114 C 150 124, 166 124, 181 114" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
      <path d="M 76 198 C 82 148, 112 128, 158 128 C 218 128, 254 162, 262 220 L 278 390 H 48 Z" fill="${input.darkColor}"/>
      <path d="M 118 152 H 205 L 222 390 H 96 Z" fill="#ffffff"/>
      <path d="M 86 204 C 39 230, 20 277, 28 334" fill="none" stroke="${input.darkColor}" stroke-width="34" stroke-linecap="round"/>
      <path d="M 252 204 C 304 230, 326 280, 314 338" fill="none" stroke="${input.darkColor}" stroke-width="34" stroke-linecap="round"/>
      <path d="M 138 165 h 48" stroke="${input.accentColor}" stroke-width="11" stroke-linecap="round"/>
      <rect x="188" y="236" width="155" height="106" rx="16" fill="#ffffff" stroke="${input.accentColor}" stroke-width="7"/>
      <path d="M 218 302 l 32 -34 l 28 23 l 36 -45" fill="none" stroke="${input.brandColor}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="338" cy="232" r="32" fill="${input.brandColor}"/>
      <path d="M 324 232 l 11 12 l 22 -27" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 56 44 C 28 68, 22 112, 51 142" fill="none" stroke="${input.accentColor}" stroke-width="9" stroke-linecap="round"/>
      <path d="M 266 46 C 300 73, 305 112, 276 143" fill="none" stroke="${input.brandColor}" stroke-width="9" stroke-linecap="round"/>
    </g>
  `;
}

function buildSalesCopy(input: {
  audience: string | null;
  callToAction: string;
  objective: string;
  serviceName: string | null;
}): SalesCopy {
  const source = `${input.serviceName || ""} ${input.objective}`.toLowerCase();
  const audience = input.audience || "clientes certos";
  const cta = normalizeCta(input.callToAction);
  const price = extractPrice(input.objective);

  if (
    source.includes("marmita") ||
    source.includes("pastel") ||
    source.includes("acai") ||
    source.includes("açaí") ||
    source.includes("lanche") ||
    source.includes("combo") ||
    source.includes("cardapio") ||
    source.includes("cardápio") ||
    source.includes("comida")
  ) {
    const product = extractFoodOffer(input.objective, input.serviceName);
    return {
      badge: "Pedido rápido",
      headline: product,
      subheadline: price
        ? `Aproveite hoje por ${price} e peça pelo WhatsApp.`
        : "Peça hoje com praticidade e receba atendimento rápido pelo WhatsApp.",
      benefits: ["Sabor e praticidade", "Atendimento pelo WhatsApp", "Pedido fácil hoje"],
      proof: `Ideal para ${audience} que querem pedir sem complicacao`,
      caption: `${product} com pedido fácil pelo WhatsApp. Aproveite hoje e faça seu pedido agora.`,
      whatsappMessage: `Olá! Quero fazer um pedido: ${product}. Pode me passar as opções?`,
      category: "food",
      cta: cta || "Fazer pedido",
    };
  }

  if (source.includes("site") || source.includes("landing") || source.includes("pagina")) {
    return {
      badge: "Presença online",
      headline: price ? `Site profissional por ${price}` : "Seu negócio precisa aparecer online",
      subheadline: "Transforme visitantes em pedidos de orçamento com uma página clara, bonita e fácil de enviar.",
      benefits: ["Visual profissional no celular", "Botão direto para WhatsApp", "Mais confiança antes do primeiro contato"],
      proof: `Ideal para ${audience} que querem vender melhor`,
      caption: "Seu negócio merece uma presença online mais profissional. Chame no WhatsApp e veja como começar.",
      whatsappMessage: "Olá! Quero saber mais sobre site profissional para meu negócio.",
      category: "site",
      cta,
    };
  }

  if (source.includes("trafego") || source.includes("ads") || source.includes("anuncio")) {
    return {
      badge: "Mais clientes",
      headline: "Anúncios que trazem pedidos reais",
      subheadline: "Campanhas organizadas para atrair pessoas prontas para chamar e pedir orçamento.",
      benefits: ["Público bem segmentado", "Campanhas no Meta/Google", "Acompanhamento dos resultados"],
      proof: `Para ${audience} que precisam vender com previsibilidade`,
      caption: "Campanhas bem organizadas ajudam seu negócio a receber pedidos mais qualificados. Chame para conversar.",
      whatsappMessage: "Olá! Quero saber mais sobre anúncios para atrair clientes.",
      category: "traffic",
      cta,
    };
  }

  if (source.includes("estetica") || source.includes("beleza") || source.includes("salao") || source.includes("clinica")) {
    return {
      badge: "Agenda aberta",
      headline: "Realce sua melhor versão",
      subheadline: "Atendimento profissional, cuidado nos detalhes e uma experiência pensada para você.",
      benefits: ["Horário com agendamento", "Atendimento personalizado", "Resultado com acabamento profissional"],
      proof: `Perfeito para ${audience}`,
      caption: "Agenda aberta para você cuidar de si com atendimento profissional. Chame e reserve seu horário.",
      whatsappMessage: "Olá! Quero reservar um horário.",
      category: "beauty",
      cta,
    };
  }

  if (source.includes("limpeza") || source.includes("obra") || source.includes("manutencao") || source.includes("reforma")) {
    return {
      badge: "Serviço confiável",
      headline: "Resolva sem dor de cabeça",
      subheadline: "Equipe preparada, prazo combinado e entrega organizada para deixar tudo no ponto.",
      benefits: ["Orçamento rápido", "Execução profissional", "Atendimento com compromisso"],
      proof: `Para ${audience} que querem praticidade`,
      caption: "Serviço profissional, atendimento claro e entrega com compromisso. Solicite seu orçamento.",
      whatsappMessage: "Olá! Quero solicitar um orçamento.",
      category: "service",
      cta,
    };
  }

  if (source.includes("promoc") || source.includes("oferta") || price) {
    return {
      badge: "Oferta especial",
      headline: price ? `Condição especial: ${price}` : "Condição especial por tempo limitado",
      subheadline: "Aproveite para contratar com mais segurança, clareza e atendimento profissional.",
      benefits: ["Atendimento rápido", "Escopo explicado antes de fechar", "Chamada direta para orçamento"],
      proof: `Criado para ${audience}`,
      caption: "Condição especial por tempo limitado. Chame no WhatsApp e aproveite antes que acabe.",
      whatsappMessage: "Olá! Quero aproveitar essa condição especial.",
      category: "promotion",
      cta,
    };
  }

  const service = input.serviceName || extractHeadline(input.objective);
  return {
    badge: "Solução profissional",
    headline: `${service} com atendimento profissional`,
    subheadline: "Mostre seu valor com uma oferta clara, objetiva e fácil de entender.",
    benefits: ["Orçamento rápido", "Atendimento personalizado", "Entrega com padrão profissional"],
    proof: `Para ${audience} que buscam uma solução confiável`,
    caption: `${service} com atendimento profissional e proposta clara. Chame no WhatsApp e solicite seu orçamento.`,
    whatsappMessage: `Olá! Quero saber mais sobre ${service}.`,
    category: "general",
    cta,
  };
}

function normalizeSalesCopy(value: Partial<SalesCopy>, fallback: SalesCopy): SalesCopy {
  const benefits = Array.isArray(value.benefits)
    ? value.benefits
        .map((item) => cleanOptionalString(item))
        .filter((item): item is string => Boolean(item))
        .slice(0, 3)
    : [];

  while (benefits.length < 3) {
    benefits.push(fallback.benefits[benefits.length] || "Atendimento profissional");
  }

  return {
    badge: truncate(cleanOptionalString(value.badge) || fallback.badge, 24),
    headline: truncate(cleanOptionalString(value.headline) || fallback.headline, 54),
    subheadline: truncate(cleanOptionalString(value.subheadline) || fallback.subheadline, 110),
    benefits: benefits.map((item) => truncate(item, 42)),
    proof: truncate(cleanOptionalString(value.proof) || fallback.proof, 70),
    cta: normalizeCta(cleanOptionalString(value.cta) || fallback.cta),
    caption: truncate(cleanOptionalString(value.caption) || fallback.caption, 260),
    whatsappMessage: truncate(cleanOptionalString(value.whatsappMessage) || fallback.whatsappMessage, 180),
    category: normalizeCategory(cleanOptionalString(value.category) || fallback.category),
  };
}

function normalizeCategory(value: string) {
  const allowed = new Set(["food", "promotion", "service", "beauty", "traffic", "site", "notice", "agenda", "general"]);
  return allowed.has(value) ? value : "general";
}

function buildLogoParts(brandName: string) {
  const clean = brandName
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!clean.length) return { main: "Fecha", accent: "Pro" };
  if (clean.length === 1) return { main: clean[0].slice(0, 10), accent: "" };
  return {
    main: clean[0].slice(0, 10),
    accent: clean[1].slice(0, 8),
  };
}

function normalizeCta(value: string) {
  const cta = value.trim();
  if (!cta) return "Peça seu orçamento";
  return cta.length > 34 ? "Peça seu orçamento" : cta;
}

function extractHeadline(objective: string) {
  return objective
    .replace(/\b(crie|criar|uma|arte|pra|para|divulgar|divulgacao|promoção|promocao)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim() || "Oferta especial";
}

function extractPrice(objective: string) {
  const match = objective.match(/r\$\s?[\d.,]+|(?:^|\s)(\d{2,5})(?:\s?reais|\s?\/mes|\s?\/mês)/i);
  if (!match) return "";
  const raw = match[0].trim();
  if (raw.toLowerCase().includes("r$")) return raw.replace(/\s+/g, " ");
  return `R$ ${raw.replace(/reais|\/mes|\/mês/gi, "").trim()}`;
}

function extractFoodOffer(objective: string, serviceName: string | null) {
  const source = `${serviceName || ""} ${objective}`.toLowerCase();
  const items: string[] = [];
  if (source.includes("marmita")) items.push("marmita");
  if (source.includes("pastel")) items.push("pastel");
  if (source.includes("açaí") || source.includes("acai")) items.push("acai");
  if (source.includes("lanche")) items.push("lanche");
  if (source.includes("combo")) items.push("combo");
  if (source.includes("suco")) items.push("suco");

  if (items.length >= 2) {
    return `${capitalizeWords(items.slice(0, 2).join(" + "))} hoje`;
  }
  if (items.length === 1) return `${capitalizeWords(items[0])} fresquinho hoje`;
  return serviceName || "Pedido gostoso para hoje";
}

function capitalizeWords(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function sanitizeColor(value: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…` : value;
}

function dotPattern(x: number, y: number, width: number) {
  const dots: string[] = [];
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      dots.push(`<circle cx="${x + col * (width / 9)}" cy="${y + row * (width / 9)}" r="5"/>`);
    }
  }
  return dots.join("");
}

function documentIcon() {
  return '<path d="M8 4h20l8 8v28H8z"/><path d="M28 4v10h8"/><path d="M15 20h14M15 28h18M15 36h12"/>';
}

function chartIcon() {
  return '<path d="M8 36h30"/><path d="M12 30l7-8l7 4l10-14"/><path d="M36 12v10H26"/>';
}

function checkIcon() {
  return '<circle cx="22" cy="22" r="17"/><path d="M14 23l6 6l12-14"/>';
}

function peopleIcon() {
  return '<circle cx="15" cy="16" r="5"/><circle cx="30" cy="16" r="5"/><path d="M6 36c2-7 8-11 16-11s14 4 16 11"/><path d="M24 26c2-3 5-5 9-5c6 0 10 4 12 10"/>';
}

function wrapTitle(value: string, size: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (const word of words) {
    const next = [lines[lines.length - 1], word].filter(Boolean).join(" ");
    if (!lines.length || next.length > size) lines.push(word);
    else lines[lines.length - 1] = next;
  }
  return lines;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
