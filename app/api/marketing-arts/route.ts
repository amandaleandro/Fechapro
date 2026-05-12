import { NextResponse } from "next/server";
import sharp from "sharp";
import { jsonError } from "@/lib/api";
import { currentMonthRange, plans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitError } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";
import { readLocalFile, saveFile } from "@/lib/storage";
import { cleanOptionalString, cleanString } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";

const artFormats: Record<string, { label: string; width: number; height: number }> = {
  instagram_post: { label: "Post quadrado", width: 1080, height: 1080 },
  instagram_story: { label: "Story", width: 1080, height: 1920 },
  whatsapp_status: { label: "Status WhatsApp", width: 1080, height: 1920 },
};

type SalesCopy = {
  badge: string;
  benefits: string[];
  cta: string;
  headline: string;
  proof: string;
  subheadline: string;
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
    useImageAsBackground?: boolean;
  };

  const title = cleanString(body.title) || "Arte de divulgacao";
  const format = artFormats[body.format || ""] ? body.format! : "instagram_post";
  const objective = cleanString(body.objective);
  const serviceName = cleanOptionalString(body.serviceName);
  const audience = cleanOptionalString(body.audience);
  const callToAction = cleanOptionalString(body.callToAction) || "Peca seu orcamento";
  const referenceImageUrl = cleanOptionalString(body.referenceImageUrl);
  const useImageAsBackground = body.useImageAsBackground === true;
  const salesCopy = buildSalesCopy({
    audience,
    callToAction,
    objective,
    serviceName,
  });

  if (!objective) return jsonError("Informe o objetivo da arte.");

  const subscription = await prisma.planSubscription.upsert({
    where: { userId: session.id },
    create: { userId: session.id, plan: "start" },
    update: {},
  });
  const plan = plans[subscription.plan];
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

  if (plan.artLimit <= 0) {
    return jsonError("Artes IA estao disponiveis a partir do plano Essencial.", 402);
  }

  if (usedThisMonth >= plan.artLimit) {
    return jsonError(`Limite mensal de ${plan.artLimit} artes do plano ${plan.name} atingido.`, 402);
  }

  const brand = await prisma.brandProfile.findUnique({ where: { userId: session.id } });
  const prompt = buildArtPrompt({
    audience,
    brandName: brand?.businessName || session.name,
    callToAction,
    formatLabel: artFormats[format].label,
    objective,
    primaryColor: brand?.primaryColor || "#106b5b",
    secondaryColor: brand?.secondaryColor || "#0F172A",
    accentColor: brand?.accentColor || "#2563EB",
    serviceName,
    salesCopy,
    whatsapp: brand?.whatsapp,
    instagram: brand?.instagram,
    referenceImageUrl,
    useImageAsBackground,
  });

  const generated = process.env.OPENAI_API_KEY
    ? await generateWithOpenAI(prompt, {
        format,
        referenceImageUrl,
        useImageAsBackground,
      }).catch(() => null)
    : null;
  const source = generated ? "openai" : "fallback";
  const imageUrl = generated
    ? await saveFile(`${crypto.randomUUID()}.png`, generated, "image/png")
    : await createFallbackArt({
        brandName: brand?.businessName || session.name,
        callToAction,
        format,
        objective,
        primaryColor: brand?.primaryColor || "#106b5b",
        referenceImageUrl,
        salesCopy,
        secondaryColor: brand?.secondaryColor || "#0F172A",
        accentColor: brand?.accentColor || "#2563EB",
        serviceName,
        useImageAsBackground,
        whatsapp: brand?.whatsapp,
      });

  const item = await prisma.marketingArtAsset.create({
    data: {
      userId: session.id,
      title,
      format,
      objective,
      serviceName,
      audience,
      callToAction,
      prompt,
      imageUrl,
      referenceImageUrl,
      source,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

function buildArtPrompt(input: {
  audience: string | null;
  brandName: string;
  callToAction: string;
  formatLabel: string;
  objective: string;
  primaryColor: string;
  salesCopy: SalesCopy;
  secondaryColor: string;
  accentColor: string;
  serviceName: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  referenceImageUrl: string | null;
  useImageAsBackground: boolean;
}) {
  return [
    `Crie uma arte de divulgacao profissional para ${input.formatLabel}, com acabamento de designer de social media.`,
    `Marca: ${input.brandName}.`,
    `Pedido bruto do usuario: ${input.objective}.`,
    input.serviceName ? `Servico: ${input.serviceName}.` : "",
    input.audience ? `Publico-alvo: ${input.audience}.` : "",
    `Use esta estrategia de venda na arte: headline "${input.salesCopy.headline}", apoio "${input.salesCopy.subheadline}", beneficios "${input.salesCopy.benefits.join("; ")}", CTA "${input.salesCopy.cta}".`,
    `Usar paleta da marca de forma sutil: principal ${input.primaryColor}, fundo ${input.secondaryColor}, destaque ${input.accentColor}.`,
    `Chamada principal no botao: ${input.salesCopy.cta}.`,
    input.whatsapp ? `Incluir WhatsApp: ${input.whatsapp}.` : "",
    input.instagram ? `Incluir Instagram: ${input.instagram}.` : "",
    input.referenceImageUrl && input.useImageAsBackground
      ? "Use a imagem enviada como fundo principal da arte, com overlay/gradiente para garantir leitura do texto por cima."
      : input.referenceImageUrl
        ? "Use a imagem enviada como referencia visual, mas mantenha a composicao limpa."
        : "",
    "Direcao visual: clean, sofisticada, universal para qualquer estabelecimento, com bastante respiro, tipografia forte, poucos elementos, sem poluicao visual, sem texto sobreposto.",
    "A arte precisa vender: mostre problema/beneficio claro, promessa especifica, 2 ou 3 motivos para chamar e um CTA evidente.",
    "Crie uma composicao parecida com o que um designer e copywriter fariam no ChatGPT/console: imagem final pronta para publicar, texto grande e legivel, CTA claro, sem marcas d'agua.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function generateWithOpenAI(prompt: string, options: {
  format: string;
  referenceImageUrl: string | null;
  useImageAsBackground: boolean;
}) {
  if (options.referenceImageUrl) {
    const reference = await loadReferenceImage(options.referenceImageUrl);
    if (reference) {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_RESPONSES_MODEL || process.env.OPENAI_MODEL || "gpt-5",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: prompt,
                },
                {
                  type: "input_image",
                  image_url: `data:${reference.contentType};base64,${reference.bytes.toString("base64")}`,
                },
              ],
            },
          ],
          tools: [
            {
              type: "image_generation",
              action: options.useImageAsBackground ? "edit" : "auto",
              size: options.format === "instagram_post" ? "1024x1024" : "1024x1536",
              quality: "high",
            },
          ],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          output?: Array<{ type?: string; result?: string }>;
        };
        const base64 = data.output?.find((item) => item.type === "image_generation_call")?.result;
        if (base64) return Buffer.from(base64, "base64");
      }
    }
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: imageModel,
      prompt,
      size: options.format === "instagram_post" ? "1024x1024" : "1024x1536",
      quality: "high",
      n: 1,
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { data?: Array<{ b64_json?: string }> };
  const base64 = data.data?.[0]?.b64_json;
  return base64 ? Buffer.from(base64, "base64") : null;
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

async function createFallbackArt(input: {
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
  useImageAsBackground?: boolean;
  whatsapp?: string | null;
}) {
  return createCleanFallbackArt(input);

  const dimensions = artFormats[input.format] || artFormats.instagram_post;
  const isStory = dimensions.height > dimensions.width;
  const margin = isStory ? 112 : 76;
  const brandColor = sanitizeColor(input.primaryColor, "#0f766e");
  const accentColor = sanitizeColor(input.accentColor, "#2563eb");
  const darkColor = sanitizeColor(input.secondaryColor, "#07122f");
  const title = input.serviceName || extractHeadline(input.objective);
  const titleLines = wrapTitle(title, isStory ? 16 : 15).slice(0, 3);
  const objectiveLines = wrapTitle(input.objective, isStory ? 32 : 28).slice(0, 3);
  const price = extractPrice(input.objective);
  const benefits = buildBenefits(input.objective, input.serviceName);
  const brandInitial = input.brandName.trim().charAt(0).toUpperCase() || "F";
  const titleTop = isStory ? 330 : 260;
  const cardStart = isStory ? 1030 : 650;
  const cardGap = isStory ? 154 : 112;
  const ctaY = isStory ? dimensions.height - 240 : dimensions.height - 154;
  const footerY = isStory ? dimensions.height - 70 : dimensions.height - 44;
  const titleSvg = titleLines
    .map((line, index) => {
      const fill = index === 1 ? accentColor : darkColor;
      return `<text x="${margin}" y="${titleTop + index * (isStory ? 100 : 82)}" fill="${fill}" font-family="Arial, sans-serif" font-size="${isStory ? 90 : 76}" font-weight="900">${escapeXml(line)}</text>`;
    })
    .join("");
  const objectiveSvg = objectiveLines
    .map((line, index) => {
      return `<text x="${margin}" y="${titleTop + (titleLines.length * (isStory ? 100 : 82)) + 52 + index * 42}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 34 : 28}" font-weight="${index === 0 ? 800 : 500}" opacity="0.9">${escapeXml(line)}</text>`;
    })
    .join("");
  const benefitSvg = benefits
    .map((benefit, index) => {
      const y = cardStart + index * cardGap;
      const iconPath = index === 0 ? documentIcon() : index === 1 ? chartIcon() : checkIcon();
      return `
        <g filter="url(#softShadow)">
          <rect x="${margin}" y="${y}" width="${dimensions.width - margin * 2}" height="${isStory ? 122 : 88}" rx="24" fill="#ffffff"/>
        </g>
        <rect x="${margin + 28}" y="${y + 20}" width="${isStory ? 82 : 56}" height="${isStory ? 82 : 56}" rx="18" fill="#e9f8ef"/>
        <g transform="translate(${margin + (isStory ? 47 : 39)} ${y + (isStory ? 39 : 30)}) scale(${isStory ? 1.45 : 1})" fill="none" stroke="${brandColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${iconPath}</g>
        <circle cx="${margin + (isStory ? 188 : 132)}" cy="${y + (isStory ? 61 : 44)}" r="${isStory ? 22 : 16}" fill="#ffffff" stroke="#16a34a" stroke-width="5"/>
        <path d="M ${margin + (isStory ? 178 : 124)} ${y + (isStory ? 60 : 43)} l ${isStory ? 8 : 6} ${isStory ? 8 : 6} l ${isStory ? 18 : 13} -${isStory ? 20 : 15}" fill="none" stroke="#16a34a" stroke-width="${isStory ? 6 : 4}" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="${margin + (isStory ? 245 : 178)}" y="${y + (isStory ? 75 : 54)}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 42 : 30}" font-weight="900">${escapeXml(benefit)}</text>
      `;
    })
    .join("");
  const priceBlock = price
    ? `
      <text x="${margin}" y="${isStory ? 790 : 520}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 104 : 78}" font-weight="900">${escapeXml(price)}</text>
      <text x="${margin + (isStory ? 360 : 270)}" y="${isStory ? 790 : 520}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 44 : 34}" font-weight="500">/mês</text>
    `
    : "";

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
      <circle cx="${dimensions.width - 80}" cy="${isStory ? 90 : 70}" r="${isStory ? 220 : 170}" fill="url(#blueGlow)"/>
      <circle cx="${isStory ? 40 : 30}" cy="${dimensions.height - 70}" r="${isStory ? 180 : 130}" fill="#04b64f"/>
      <circle cx="${Math.round(dimensions.width * 0.76)}" cy="${Math.round(dimensions.height * 0.08)}" r="${isStory ? 170 : 120}" fill="#eaf2ff"/>
      <g opacity="0.35" fill="#bfdbfe">
        ${dotPattern(dimensions.width - (isStory ? 470 : 360), isStory ? 130 : 92, isStory ? 300 : 240)}
      </g>
      <g transform="translate(${margin} ${isStory ? 92 : 70})">
        <text x="0" y="72" fill="${accentColor}" font-family="Arial, sans-serif" font-size="${isStory ? 108 : 82}" font-weight="900">${escapeXml(brandInitial)}</text>
        <path d="M 4 88 H ${isStory ? 92 : 70}" stroke="${brandColor}" stroke-width="5"/>
        <text x="0" y="${isStory ? 124 : 106}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 25 : 20}" font-weight="600">${escapeXml(input.brandName.slice(0, 34))}</text>
      </g>
      <rect x="${margin}" y="${isStory ? 500 : 405}" width="${isStory ? 350 : 290}" height="${isStory ? 66 : 54}" rx="27" fill="#0bbf5a"/>
      <circle cx="${margin + (isStory ? 54 : 44)}" cy="${isStory ? 532 : 432}" r="${isStory ? 21 : 17}" fill="#ffffff"/>
      <path d="M ${margin + (isStory ? 45 : 37)} ${isStory ? 532 : 432} l ${isStory ? 7 : 5} ${isStory ? 8 : 6} l ${isStory ? 15 : 12} -${isStory ? 17 : 13}" fill="none" stroke="#0bbf5a" stroke-width="${isStory ? 6 : 5}" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${margin + (isStory ? 116 : 88)}" y="${isStory ? 545 : 440}" fill="#ffffff" font-family="Arial, sans-serif" font-size="${isStory ? 36 : 28}" font-weight="900">Oferta em destaque</text>
      ${titleSvg}
      ${objectiveSvg}
      ${priceBlock}
      ${benefitSvg}
      <text x="${margin + (isStory ? 170 : 110)}" y="${isStory ? dimensions.height - 332 : dimensions.height - 232}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 38 : 26}" font-weight="500">Ideal para quem quer</text>
      <text x="${margin + (isStory ? 170 : 110)}" y="${isStory ? dimensions.height - 284 : dimensions.height - 198}" fill="${accentColor}" font-family="Arial, sans-serif" font-size="${isStory ? 38 : 26}" font-weight="900">vender melhor com presença digital.</text>
      <rect x="${margin + 45}" y="${ctaY}" width="${dimensions.width - (margin + 45) * 2}" height="${isStory ? 116 : 82}" rx="${isStory ? 58 : 41}" fill="url(#greenCta)"/>
      <circle cx="${margin + (isStory ? 132 : 100)}" cy="${ctaY + (isStory ? 58 : 41)}" r="${isStory ? 38 : 28}" fill="#ffffff"/>
      <path d="M ${margin + (isStory ? 116 : 90)} ${ctaY + (isStory ? 58 : 41)} h ${isStory ? 32 : 22} m -10 -12 l 12 12 l -12 12" fill="none" stroke="#00a63e" stroke-width="${isStory ? 8 : 6}" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${dimensions.width / 2}" y="${ctaY + (isStory ? 73 : 52)}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${isStory ? 46 : 34}" font-weight="900">${escapeXml(input.callToAction.slice(0, 34))}</text>
      <text x="${margin}" y="${footerY}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 26 : 20}" font-weight="700" opacity="0.78">${escapeXml(input.whatsapp || "Fale conosco")}</text>
    </svg>
  `;
  const bytes = await sharp(Buffer.from(svg)).png().toBuffer();
  return saveFile(`${crypto.randomUUID()}.png`, bytes, "image/png");
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
  const titleTop = isStory ? 520 : 330;
  const titleSize = isStory ? 88 : 74;
  const titleLineHeight = isStory ? 98 : 82;
  const subtitleTop = titleTop + titleLines.length * titleLineHeight + (isStory ? 42 : 34);
  const ctaHeight = isStory ? 112 : 88;
  const ctaY = isStory ? dimensions.height - 270 : dimensions.height - 188;
  const footerY = isStory ? dimensions.height - 72 : dimensions.height - 56;
  const textColor = useBackground ? "#ffffff" : darkColor;
  const mutedColor = useBackground ? "#e8eefc" : "#475569";
  const logoY = isStory ? 94 : 72;

  const titleSvg = titleLines
    .map((line, index) => {
      const fill = useBackground ? "#ffffff" : index === 1 ? accentColor : darkColor;
      return `<text x="${margin}" y="${titleTop + index * titleLineHeight}" fill="${fill}" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="900">${escapeXml(line)}</text>`;
    })
    .join("");
  const subtitleSvg = subtitleLines
    .map((line, index) => {
      return `<text x="${margin}" y="${subtitleTop + index * (isStory ? 44 : 38)}" fill="${mutedColor}" font-family="Arial, sans-serif" font-size="${isStory ? 34 : 28}" font-weight="700">${escapeXml(line)}</text>`;
    })
    .join("");
  const price = extractPrice(input.objective);
  const priceSvg = price
    ? `<text x="${margin}" y="${subtitleTop + subtitleLines.length * (isStory ? 44 : 38) + (isStory ? 104 : 78)}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${isStory ? 92 : 70}" font-weight="900">${escapeXml(price)}</text>`
    : "";

  const benefitTop = price ? subtitleTop + subtitleLines.length * (isStory ? 44 : 38) + (isStory ? 136 : 104) : subtitleTop + subtitleLines.length * (isStory ? 44 : 38) + (isStory ? 70 : 54);
  const benefitsSvg = input.salesCopy.benefits.slice(0, isStory ? 3 : 2).map((benefit, index) => {
    const y = benefitTop + index * (isStory ? 54 : 44);
    return `
      <g>
        <circle cx="${margin + 14}" cy="${y - 10}" r="${isStory ? 14 : 11}" fill="${useBackground ? "#ffffff" : "#dcfce7"}" opacity="${useBackground ? 0.92 : 1}"/>
        <path d="M ${margin + 7} ${y - 10} l 5 6 l 10 -12" fill="none" stroke="${brandColor}" stroke-width="${isStory ? 5 : 4}" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="${margin + (isStory ? 44 : 36)}" y="${y}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${isStory ? 30 : 24}" font-weight="800">${escapeXml(truncate(benefit, isStory ? 42 : 36))}</text>
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
          ? ""
          : `
            <circle cx="${dimensions.width - 78}" cy="${isStory ? 86 : 70}" r="${isStory ? 210 : 160}" fill="${accentColor}" opacity="0.92"/>
            <circle cx="${isStory ? 24 : 18}" cy="${dimensions.height - 42}" r="${isStory ? 165 : 115}" fill="${brandColor}" opacity="0.9"/>
            <circle cx="${Math.round(dimensions.width * 0.73)}" cy="${Math.round(dimensions.height * 0.15)}" r="${isStory ? 152 : 116}" fill="#dbeafe" opacity="0.7"/>
            <g opacity="0.28" fill="#bfdbfe">${dotPattern(dimensions.width - (isStory ? 430 : 330), isStory ? 190 : 140, isStory ? 260 : 210)}</g>
          `
      }
      <g transform="translate(${margin} ${logoY})">
        <text x="0" y="${isStory ? 70 : 58}" fill="${useBackground ? "#ffffff" : accentColor}" font-family="Arial, sans-serif" font-size="${isStory ? 96 : 78}" font-weight="900">${escapeXml(input.brandName.trim().charAt(0).toUpperCase() || "F")}</text>
        <path d="M 3 ${isStory ? 86 : 72} H ${isStory ? 86 : 70}" stroke="${brandColor}" stroke-width="5"/>
        <text x="0" y="${isStory ? 122 : 102}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${isStory ? 25 : 20}" font-weight="800">${escapeXml(input.brandName.slice(0, 36))}</text>
      </g>
      <rect x="${margin}" y="${titleTop - (isStory ? 128 : 104)}" width="${isStory ? 300 : 248}" height="${isStory ? 58 : 48}" rx="${isStory ? 29 : 24}" fill="${useBackground ? "#ffffff" : "#e8f8ef"}" opacity="${useBackground ? 0.18 : 1}"/>
      <text x="${margin + 28}" y="${titleTop - (isStory ? 90 : 72)}" fill="${useBackground ? "#ffffff" : brandColor}" font-family="Arial, sans-serif" font-size="${isStory ? 28 : 23}" font-weight="900">${escapeXml(input.salesCopy.badge)}</text>
      ${titleSvg}
      ${subtitleSvg}
      ${priceSvg}
      ${benefitsSvg}
      <g filter="url(#softShadow)">
        <rect x="${margin}" y="${ctaY}" width="${dimensions.width - margin * 2}" height="${ctaHeight}" rx="${ctaHeight / 2}" fill="url(#greenCta)"/>
      </g>
      <text x="${dimensions.width / 2}" y="${ctaY + (isStory ? 70 : 56)}" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="${isStory ? 42 : 34}" font-weight="900">${escapeXml(truncate(input.salesCopy.cta, isStory ? 34 : 26))}</text>
      <text x="${margin}" y="${footerY - (isStory ? 42 : 34)}" fill="${mutedColor}" font-family="Arial, sans-serif" font-size="${isStory ? 24 : 19}" font-weight="800">${escapeXml(truncate(input.salesCopy.proof, isStory ? 48 : 44))}</text>
      <text x="${margin}" y="${footerY}" fill="${textColor}" font-family="Arial, sans-serif" font-size="${isStory ? 25 : 20}" font-weight="800" opacity="${useBackground ? 0.92 : 0.76}">${escapeXml(contact)}</text>
    </svg>
  `;

  let bytes: Buffer;
  if (useBackground) {
    const reference = await loadReferenceImage(input.referenceImageUrl || null);
    if (reference) {
      const background = await sharp(reference.bytes)
        .rotate()
        .resize(dimensions.width, dimensions.height, { fit: "cover" })
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
      <text x="${margin + (isStory ? 360 : 265)}" y="${priceY}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="${isStory ? 44 : 32}" font-weight="500">/mes</text>
    `
    : "";

  const storyLead = isStory
    ? `
      <text x="${margin + 170}" y="${dimensions.height - 335}" fill="${darkColor}" font-family="Arial, sans-serif" font-size="38" font-weight="500">Ideal para quem quer</text>
      <text x="${margin + 170}" y="${dimensions.height - 286}" fill="${accentColor}" font-family="Arial, sans-serif" font-size="38" font-weight="900">vender melhor com presenca digital.</text>
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

function buildBenefits(objective: string, serviceName: string | null) {
  const lower = objective.toLowerCase();
  if (lower.includes("site")) return ["Site one page", "Proposta + presenca online", "Contato direto para orcamento"];
  if (lower.includes("proposta")) return ["Proposta profissional", "Link facil de enviar", "Mais confianca para fechar"];
  if (lower.includes("promoc")) return ["Condicao especial", "Atendimento rapido", "Chame no WhatsApp"];
  return [serviceName || "Servico profissional", "Atendimento personalizado", "Orcamento rapido"];
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

  if (source.includes("site") || source.includes("landing") || source.includes("pagina")) {
    return {
      badge: "Presenca online",
      headline: price ? `Site profissional por ${price}` : "Seu negocio precisa aparecer online",
      subheadline: "Transforme visitantes em pedidos de orcamento com uma pagina clara, bonita e facil de enviar.",
      benefits: ["Visual profissional no celular", "Botao direto para WhatsApp", "Mais confianca antes do primeiro contato"],
      proof: `Ideal para ${audience} que querem vender melhor`,
      cta,
    };
  }

  if (source.includes("trafego") || source.includes("ads") || source.includes("anuncio")) {
    return {
      badge: "Mais clientes",
      headline: "Anuncios que trazem pedidos reais",
      subheadline: "Campanhas organizadas para atrair pessoas prontas para chamar e pedir orcamento.",
      benefits: ["Publico bem segmentado", "Campanhas no Meta/Google", "Acompanhamento dos resultados"],
      proof: `Para ${audience} que precisam vender com previsibilidade`,
      cta,
    };
  }

  if (source.includes("estetica") || source.includes("beleza") || source.includes("salao") || source.includes("clinica")) {
    return {
      badge: "Agenda aberta",
      headline: "Realce sua melhor versao",
      subheadline: "Atendimento profissional, cuidado nos detalhes e uma experiencia pensada para voce.",
      benefits: ["Horario com agendamento", "Atendimento personalizado", "Resultado com acabamento profissional"],
      proof: `Perfeito para ${audience}`,
      cta,
    };
  }

  if (source.includes("limpeza") || source.includes("obra") || source.includes("manutencao") || source.includes("reforma")) {
    return {
      badge: "Servico confiavel",
      headline: "Resolva sem dor de cabeca",
      subheadline: "Equipe preparada, prazo combinado e entrega organizada para deixar tudo no ponto.",
      benefits: ["Orcamento rapido", "Execucao profissional", "Atendimento com compromisso"],
      proof: `Para ${audience} que querem praticidade`,
      cta,
    };
  }

  if (source.includes("promoc") || source.includes("oferta") || price) {
    return {
      badge: "Oferta especial",
      headline: price ? `Condicao especial: ${price}` : "Condicao especial por tempo limitado",
      subheadline: "Aproveite para contratar com mais seguranca, clareza e atendimento profissional.",
      benefits: ["Atendimento rapido", "Escopo explicado antes de fechar", "Chamada direta para orcamento"],
      proof: `Criado para ${audience}`,
      cta,
    };
  }

  const service = input.serviceName || extractHeadline(input.objective);
  return {
    badge: "Solucao profissional",
    headline: `${service} com atendimento profissional`,
    subheadline: "Mostre seu valor com uma oferta clara, objetiva e facil de entender.",
    benefits: ["Orcamento rapido", "Atendimento personalizado", "Entrega com padrao profissional"],
    proof: `Para ${audience} que buscam uma solucao confiavel`,
    cta,
  };
}

function normalizeCta(value: string) {
  const cta = value.trim();
  if (!cta) return "Peca seu orcamento";
  return cta.length > 34 ? "Peca seu orcamento" : cta;
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

function wrapTitle(value: string, size: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (const word of words) {
    const next = [lines[lines.length - 1], word].filter(Boolean).join(" ");
    if (!lines.length || next.length > size) lines.push(word);
    else lines[lines.length - 1] = next;
    if (lines.length === 2) break;
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
