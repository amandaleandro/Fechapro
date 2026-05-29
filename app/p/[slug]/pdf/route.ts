import path from "node:path";
import { readFile } from "node:fs/promises";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { notFound } from "next/navigation";
import sharp from "sharp";
import { slugBase } from "@/lib/api";
import { readLocalUploadFile } from "@/lib/local-upload-file";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 44;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const INK = "#0F172A";
const MUTED = "#64748B";
const LINE = "#E2E8F0";
const SOFT = "#F8FAFC";
const PAPER = "#FBFCFE";
const PAGE_BOTTOM = PAGE.height - 104;
const DEMO_SERVICE_IMAGE_URL = "/landing/hero-proposta.png";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    include: { user: { include: { brandProfile: true } } },
  });

  if (!proposal) notFound();

  const [portfolio, serviceImages, testimonials] = await Promise.all([
    findProposalPortfolio(proposal.userId, proposal.publicSlug),
    findProposalServiceImages(proposal.userId, proposal.serviceName),
    prisma.testimonialAsset.findMany({
      where: { userId: proposal.userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const brand = proposal.user.brandProfile;
  const logoUrl = brand?.logoUrl || demoLogoUrl(proposal.publicSlug);
  console.log("[PDF] logoUrl:", logoUrl || "(vazio)", "| brand.logoUrl:", brand?.logoUrl || "(null)");
  const pdf = await createProposalPdf({
    clientName: proposal.clientName,
    serviceName: proposal.serviceName,
    price: money.format(proposal.price),
    deadline: proposal.deadline,
    payment: proposal.payment || "A combinar",
    documentType: proposal.documentType || "auto",
    segment: proposal.segment || "auto",
    createdAt: formatDate(proposal.createdAt.toISOString().slice(0, 10)),
    validUntil: proposal.validUntil ? formatDate(proposal.validUntil) : "A combinar",
    included: proposal.included,
    notes: proposal.notes || "",
    ownerName: proposal.user.name,
    publicUrl: `${process.env.APP_URL || "http://localhost:3000"}/p/${proposal.publicSlug}`,
    assetOrigin: new URL(request.url).origin,
    brandName: brand?.businessName || proposal.user.name,
    brandColor: normalizeColor(brand?.primaryColor || "#22C55E"),
    brandSecondaryColor: normalizeColor(brand?.secondaryColor || "#0F172A", "#0F172A"),
    brandAccentColor: normalizeColor(brand?.accentColor || "#2563EB", "#2563EB"),
    brandEmail: brand?.email || proposal.user.email,
    brandWhatsapp: brand?.whatsapp || "",
    brandInstagram: brand?.instagram || "",
    brandWebsite: brand?.website || "",
    brandBio: brand?.bio || "",
    proposalStyle: brand?.proposalStyle || "modern",
    proposalIntro: brand?.proposalIntro || "",
    proposalClosing: brand?.proposalClosing || "",
    proposalTerms: brand?.proposalTerms || "",
    proposalFaq: brand?.proposalFaq || "",
    showPortfolio: brand?.showPortfolio !== false,
    showTestimonials: brand?.showTestimonials !== false,
    showServices: brand?.showServices !== false,
    showFaq: brand?.showFaq !== false,
    logoUrl,
    status: proposal.status,
    acceptedBy: proposal.acceptedBy || "",
    acceptedEmail: proposal.acceptedEmail || "",
    acceptedAt: proposal.acceptedAt ? formatDate(proposal.acceptedAt.toISOString().slice(0, 10)) : "",
    declinedReason: proposal.declinedReason || "",
    paymentStatus: proposal.paymentStatus,
    paymentMethod: proposal.paymentMethod || "",
    paymentPaidAt: proposal.paymentPaidAt ? formatDate(proposal.paymentPaidAt.toISOString().slice(0, 10)) : "",
    serviceImages: serviceImages.length ? serviceImages : demoServiceImages(proposal.publicSlug, proposal.serviceName),
    portfolio,
    testimonials,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slugBase(`proposta-${proposal.clientName}-${proposal.serviceName}`)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

async function findProposalPortfolio(userId: string, slug: string) {
  const demoCategories = demoPortfolioCategories(slug);
  if (!demoCategories.length) {
    return prisma.portfolioAsset.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    });
  }

  const related = await prisma.portfolioAsset.findMany({
    where: { userId, category: { in: demoCategories } },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  if (related.length >= 4) return related;

  const fill = await prisma.portfolioAsset.findMany({
    where: {
      userId,
      id: { notIn: related.map((item) => item.id) },
      category: { startsWith: "Demo:" },
    },
    orderBy: { createdAt: "desc" },
    take: 4 - related.length,
  });

  return [...related, ...fill];
}

async function findProposalServiceImages(userId: string, serviceName: string) {
  const names = splitProposalServiceNames(serviceName);
  if (!names.length) return [];

  const services = await prisma.serviceAsset.findMany({
    where: {
      userId,
      OR: names.map((name) => ({ name: { equals: name, mode: "insensitive" as const } })),
      imageUrl: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return names
    .map((name) => services.find((service) => service.name.trim().toLowerCase() === name.toLowerCase()))
    .filter((service): service is NonNullable<typeof service> => Boolean(service?.imageUrl))
    .map((service) => ({
      title: service.name,
      category: "Servico cadastrado",
      imageUrl: service.imageUrl,
    }));
}

function splitProposalServiceNames(serviceName: string) {
  return serviceName
    .split(/\s+\+\s+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function demoPortfolioCategories(slug: string) {
  if (!slug.startsWith("demo-")) return [];
  const withoutPrefix = slug.slice("demo-".length);
  const match = withoutPrefix.match(/^(.+)-[A-Za-z0-9_-]{8}$/);
  if (!match?.[1]) return [];
  const niche = match[1];
  const parts = niche.split("-");
  return Array.from(
    new Set(parts.map((_, index) => `Demo:${parts.slice(0, parts.length - index).join("-")}`)),
  );
}

async function createProposalPdf(data: ProposalPdfData) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      autoFirstPage: false,
      bufferPages: true,
      margin: MARGIN,
      size: "A4",
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    renderPdf(doc, data).then(() => doc.end()).catch(reject);
  });
}

async function renderPdf(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  const design = getSegmentDesign(data);
  doc.addPage();
  await drawPremiumCover(doc, data, design);
  doc.addPage();
  doc.y = MARGIN;
  drawDocumentHeader(doc, data, design);
  drawSummary(doc, data, design);
  drawScope(doc, data, design);
  drawPayment(doc, data, design);
  drawNotes(doc, data, design);
  drawCustomTextBlock(doc, "Mensagem", "Antes de decidir", data.proposalClosing, design);
  if (data.showPortfolio) await drawPortfolio(doc, data, design);
  drawCustomTextBlock(doc, "Termos comerciais", "Condições", data.proposalTerms, design);
  if (data.showTestimonials) drawTestimonials(doc, data, design);
  if (data.showFaq) drawFaq(doc, data, design);
  drawDecision(doc, data, design);
  drawFooter(doc, data, design);
  drawPageNumbers(doc);
}

async function drawBudgetCover(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  const topY = 28;
  const brandColumnX = MARGIN;
  const brandColumnWidth = 160;
  const logoBoxWidth = 116;
  const logoBoxHeight = 64;
  const logoBoxX = brandColumnX + (brandColumnWidth - logoBoxWidth) / 2;
  const logoBoxY = topY + 14;
  const logoSize = 64;
  const logoFallbackX = brandColumnX + (brandColumnWidth - logoSize) / 2;
  const dividerX = MARGIN + 160;
  const titleX = dividerX + 26;
  const imageY = 176;
  const imageGap = 8;
  const imageW = (CONTENT_WIDTH - imageGap) / 2;
  const imageH = 116;

  doc.rect(0, 0, PAGE.width, PAGE.height).fill("#FFFFFF");
  doc.rect(0, 28, PAGE.width, 190).fill("#F8FAFC");
  doc.circle(PAGE.width - 44, 102, 96).fill(design.soft);
  doc.circle(PAGE.width - 86, 78, 42).fill("#FFFFFF");
  doc.rect(0, 0, PAGE.width, 24).fill(design.primary);
  doc.rect(0, 24, PAGE.width, 4).fill(design.accent);
  doc.rect(MARGIN, topY + 126, CONTENT_WIDTH, 1.4).fill(design.accent);
  doc.roundedRect(PAGE.width - MARGIN - 104, 43, 104, 24, 12).fillAndStroke("#FFFFFF", "#E2E8F0");
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(7.5).text(design.segmentName.toUpperCase(), PAGE.width - MARGIN - 92, 51, {
    width: 80,
    align: "center",
    height: 9,
    ellipsis: true,
  });

  const logo = await readImageFromUrl(data.logoUrl, data.assetOrigin);
  if (logo) {
    const didDrawLogo = drawPdfImage(doc, logo, logoBoxX + 8, logoBoxY + 8, {
      fit: [logoBoxWidth - 16, logoBoxHeight - 16],
      align: "center",
      valign: "center",
      width: logoBoxWidth - 16,
      height: logoBoxHeight - 16,
    });
    if (!didDrawLogo) {
      drawServiceMark(doc, data.brandName, logoFallbackX, logoBoxY, logoSize, design.primary);
    }
  } else {
    drawServiceMark(doc, data.brandName, logoFallbackX, logoBoxY, logoSize, design.primary);
  }

  doc.fillColor(INK).font("Helvetica-Bold").fontSize(17).text(data.brandName.toUpperCase(), brandColumnX, topY + 88, {
    width: brandColumnWidth,
    align: "center",
    height: 22,
    ellipsis: true,
  });
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text(design.brandCaption.toUpperCase(), brandColumnX, topY + 110, {
    width: brandColumnWidth,
    align: "center",
    height: 10,
    ellipsis: true,
  });

  doc.rect(dividerX, topY + 12, 1.2, 112).fill("#CBD5E1");
  const documentTitle = documentTitleFor(data.documentType, design.documentTitle);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(documentTitle.length > 16 ? 25 : 32).text(documentTitle, titleX, topY + 22, {
    width: CONTENT_WIDTH - 186,
    height: 38,
    ellipsis: true,
  });
  drawSmallIconLabel(doc, "DATA:", data.createdAt, titleX, topY + 68, design.primary);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(8).text(design.promise.toUpperCase(), titleX, topY + 82, {
    width: CONTENT_WIDTH - 188,
    height: 10,
    ellipsis: true,
  });
  doc.fillColor("#334155").font("Helvetica").fontSize(10.2).text(
    data.proposalIntro || design.intro(data),
    titleX,
    topY + 96,
    { width: CONTENT_WIDTH - 188, height: 28, lineGap: 3, ellipsis: true },
  );

  const images = [...data.serviceImages, ...data.portfolio].slice(0, 2);
  for (let index = 0; index < 2; index++) {
    const x = MARGIN + index * (imageW + imageGap);
    doc.roundedRect(x + 2, imageY + 3, imageW, imageH, 8).fill("#CBD5E1");
    doc.roundedRect(x, imageY, imageW, imageH, 8).fill("#F1F5F9");
    const item = images[index];
    const image = await readImageFromUrl(item?.imageUrl || "", data.assetOrigin);
    if (image) {
      const didDraw = drawPdfImage(doc, image, x, imageY, {
        fit: [imageW, imageH],
        align: "center",
        valign: "center",
        width: imageW,
        height: imageH,
      });
      if (!didDraw) {
        doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(13).text(index === 0 ? data.serviceName : design.fallbackImageLabel, x + 14, imageY + 48, {
          width: imageW - 28,
          align: "center",
          height: 34,
          ellipsis: true,
        });
      }
    } else {
      doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(13).text(index === 0 ? data.serviceName : design.fallbackImageLabel, x + 14, imageY + 48, {
        width: imageW - 28,
        align: "center",
        height: 34,
        ellipsis: true,
      });
    }
  }

  const referenceY = imageY + imageH + 12;
  doc.circle(MARGIN + 10, referenceY + 6, 6).fill(INK);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(7).text("i", MARGIN + 8, referenceY + 2, { width: 4, align: "center" });
  doc.fillColor("#334155").font("Helvetica-Bold").fontSize(8.5).text(design.referenceLabel, MARGIN + 23, referenceY);
  doc.fillColor("#334155").font("Helvetica").fontSize(8.5).text(`${data.clientName}  |  ${data.serviceName}`, MARGIN + 82, referenceY, {
    width: CONTENT_WIDTH - 82,
    height: 12,
    ellipsis: true,
  });

  const serviceY = referenceY + 26;
  drawBlackLabel(doc, design.scopeLabel, MARGIN, serviceY);
  doc.roundedRect(MARGIN, serviceY + 16, CONTENT_WIDTH, 94, 8).fill(design.soft);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10.5).text(data.serviceName.toUpperCase(), MARGIN + 16, serviceY + 31, {
    width: 282,
    height: 15,
    ellipsis: true,
  });
  const scopeItems = (data.included.length ? data.included : ["Serviço conforme combinado."]).slice(0, 5);
  scopeItems.forEach((item, index) => {
    const y = serviceY + 52 + index * 12;
    doc.circle(MARGIN + 20, y + 3.5, 3.5).fill(design.primary);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(5).text("OK", MARGIN + 16.6, y + 1.2, { width: 7, align: "center" });
    doc.fillColor("#334155").font("Helvetica").fontSize(8).text(item, MARGIN + 30, y, { width: 270, height: 10, ellipsis: true });
  });

  doc.rect(MARGIN + 326, serviceY + 30, 1, 64).fill("#CBD5E1");
  drawSegmentIcon(doc, MARGIN + 348, serviceY + 45, design);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(design.detailTitle, MARGIN + 408, serviceY + 40, {
    width: 92,
    height: 12,
    ellipsis: true,
  });
  doc.fillColor("#475569").font("Helvetica").fontSize(8.7).text(
    data.notes || data.payment || "Material, mao de obra e acompanhamento conforme combinado.",
    MARGIN + 408,
    serviceY + 56,
    { width: 90, height: 34, lineGap: 2, ellipsis: true },
  );

  const tableY = serviceY + 128;
  drawBlackLabel(doc, design.tableLabel, MARGIN, tableY);
  drawBudgetDetailsTable(doc, data, tableY + 16, design);

  const infoY = tableY + 160;
  doc.roundedRect(MARGIN, infoY, CONTENT_WIDTH, 76, 8).fill(design.soft);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.5).text(design.notesTitle, MARGIN + 14, infoY + 13);
  const observations = [
    data.notes || design.defaultNote,
    design.secondaryNote,
    `Proposta valida ate ${data.validUntil}.`,
  ];
  observations.forEach((item, index) => {
    doc.circle(MARGIN + 17, infoY + 32 + index * 12, 1.8).fill(INK);
    doc.fillColor("#475569").font("Helvetica").fontSize(7.8).text(item, MARGIN + 25, infoY + 28 + index * 12, {
      width: 300,
      height: 10,
      ellipsis: true,
    });
  });
  doc.rect(MARGIN + 338, infoY + 12, 1, 52).fill("#CBD5E1");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.5).text("ATENDIMENTO", MARGIN + 356, infoY + 13);
  drawContactLine(doc, data.brandWhatsapp || "WhatsApp a combinar", MARGIN + 356, infoY + 31, design.primary);
  drawContactLine(doc, data.brandEmail || data.brandInstagram || "Contato cadastrado na proposta", MARGIN + 356, infoY + 45, design.primary);
  drawContactLine(doc, data.brandWebsite || data.publicUrl, MARGIN + 356, infoY + 59, design.primary);

  const thanksY = infoY + 94;
  doc.roundedRect(MARGIN, thanksY, CONTENT_WIDTH, 42, 8).fillAndStroke("#FFFFFF", LINE);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text("Obrigado pela confianca!", MARGIN + 48, thanksY + 12);
  doc.fillColor(MUTED).font("Helvetica").fontSize(8).text("Sera um prazer atender voce.", MARGIN + 48, thanksY + 26);
  doc.rect(MARGIN + 292, thanksY + 10, 1, 22).fill("#CBD5E1");
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(data.brandName.toUpperCase(), MARGIN + 316, thanksY + 12, {
    width: 178,
    height: 12,
    ellipsis: true,
  });
  doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(design.footerLine, MARGIN + 316, thanksY + 26, {
    width: 178,
    height: 10,
    ellipsis: true,
  });

  doc.y = thanksY + 64;
}

async function drawPremiumCover(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  const style = getPdfProposalStyle(data.proposalStyle);
  const logoX = MARGIN;
  const logoY = 36;
  const logoWidth = 132;
  const logoHeight = 66;
  const coverImageX = PAGE.width - MARGIN - 192;
  const coverImageY = 138;
  const coverImageWidth = 192;
  const coverImageHeight = 206;

  doc.rect(0, 0, PAGE.width, PAGE.height).fill("#FFFFFF");
  doc.rect(0, 0, PAGE.width, 402).fill(style.coverColor(data));
  doc.rect(0, 0, PAGE.width, 9).fill(data.brandColor);
  doc.rect(0, 9, PAGE.width, 4).fill(data.brandAccentColor);
  doc.circle(PAGE.width - 34, 356, 92).fill(data.brandAccentColor);
  doc.circle(PAGE.width - 88, 326, 74).fill(data.brandColor);
  doc.rect(MARGIN, 118, 46, 3).fill(data.brandAccentColor);
  doc.rect(0, 402, PAGE.width, 1).fill(LINE);

  if (style.accent === "premium") {
    doc.rect(PAGE.width - 128, 0, 128, 402).fill(data.brandColor);
    doc.rect(PAGE.width - 52, 0, 52, 402).fill(data.brandAccentColor);
  }
  if (style.accent === "technical") {
    for (let x = 0; x < PAGE.width; x += 34) doc.rect(x, 0, 0.35, 402).fill("#334155");
    for (let y = 0; y < 402; y += 34) doc.rect(0, y, PAGE.width, 0.35).fill("#334155");
  }

  // White logo card — garante visibilidade de logos escuros sobre o fundo escuro do cover
  doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 9).fill("#FFFFFF");
  doc.rect(logoX, logoY + logoHeight - 3, logoWidth, 3).fill(data.brandColor);

  const logo = await readImageFromUrl(data.logoUrl, data.assetOrigin);
  const iSize = 46;
  const iCenterX = logoX + (logoWidth - iSize) / 2;
  const iCenterY = logoY + (logoHeight - iSize) / 2;
  if (logo) {
    const didDrawLogo = drawLogoImageInFrame(doc, logo, logoX, logoY, logoWidth, logoHeight, 12, 9);
    if (!didDrawLogo) {
      drawLogoInitials(doc, data.brandName, iCenterX, iCenterY, iSize, data.brandColor);
    }
  } else {
    drawLogoInitials(doc, data.brandName, iCenterX, iCenterY, iSize, data.brandColor);
  }

  const brandTextX = MARGIN + logoWidth + 18;
  doc.fillColor("#BFDBFE").font("Helvetica-Bold").fontSize(8).text(style.eyebrow, brandTextX, 49, {
    characterSpacing: 1.1,
  });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(12.5).text(data.brandName, brandTextX, 65, {
    width: PAGE.width - MARGIN - 132 - brandTextX - 12,
    height: 32,
    lineGap: 1,
    ellipsis: true,
  });
  drawStatusPill(doc, data.status, PAGE.width - MARGIN - 132, 49, 132, data.brandColor);

  doc.fillColor("#BFDBFE").font("Helvetica-Bold").fontSize(8).text(`${design.segmentName.toUpperCase()}  /  ${documentTitleFor(data.documentType, design.documentTitle)}`, MARGIN, 138, {
    characterSpacing: 1.1,
    width: 274,
    height: 10,
    ellipsis: true,
  });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(style.titleSize + 2).text(data.serviceName, MARGIN, 158, {
    width: 284,
    height: 106,
    lineGap: 2,
    ellipsis: true,
  });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(11).text(`Preparada para ${data.clientName}`, MARGIN, 274, {
    width: 284,
    height: 16,
    ellipsis: true,
  });
  doc.fillColor("#CBD5E1").font("Helvetica").fontSize(10.5).text(
    data.proposalIntro || data.brandBio || `Escopo, investimento e prazo organizados para ${data.clientName} decidir com segurança.`,
    MARGIN,
    300,
    { width: 284, height: 48, lineGap: 3, ellipsis: true },
  );

  doc.rect(MARGIN, 362, 66, 1.5).fill(data.brandAccentColor);
  doc.fillColor("#E2E8F0").font("Helvetica").fontSize(8.5).text("Documento preparado exclusivamente por", MARGIN, 374, {
    width: 190,
    height: 10,
    ellipsis: true,
  });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(10).text(data.brandName, MARGIN, 388, {
    width: 250,
    height: 12,
    ellipsis: true,
  });

  doc.roundedRect(coverImageX + 5, coverImageY + 7, coverImageWidth, coverImageHeight, 14).fill("#020617");
  doc.roundedRect(coverImageX, coverImageY, coverImageWidth, coverImageHeight, 14).fill("#FFFFFF");
  const coverImage = await readImageFromUrl(data.serviceImages[0]?.imageUrl || data.portfolio[0]?.imageUrl || "", data.assetOrigin);
  if (coverImage) {
    const didDraw = drawPdfImage(doc, coverImage, coverImageX + 9, coverImageY + 9, {
      fit: [coverImageWidth - 18, coverImageHeight - 18],
      align: "center",
      valign: "center",
      width: coverImageWidth - 18,
      height: coverImageHeight - 18,
    });
    if (!didDraw) {
      drawCoverSummaryCard(doc, data, design, coverImageX + 9, coverImageY + 9, coverImageWidth - 18, coverImageHeight - 18);
    }
  } else {
    drawCoverSummaryCard(doc, data, design, coverImageX + 9, coverImageY + 9, coverImageWidth - 18, coverImageHeight - 18);
  }

  doc.roundedRect(MARGIN + 3, 432, CONTENT_WIDTH, 144, 12).fill("#CBD5E1");
  doc.roundedRect(MARGIN, 428, CONTENT_WIDTH, 144, 12).fillAndStroke("#FFFFFF", LINE);
  doc.roundedRect(MARGIN + 22, 450, 196, 94, 9).fill("#FFFFFF");
  doc.roundedRect(MARGIN + 22, 450, 196, 94, 9).strokeColor(LINE).lineWidth(1).stroke();
  doc.rect(MARGIN + 22, 450, 196, 5).fill(data.brandColor);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(8).text("INVESTIMENTO", MARGIN + 40, 474);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(25).text(data.price, MARGIN + 40, 491, {
    width: 160,
    height: 30,
    ellipsis: true,
  });
  doc.fillColor(MUTED).font("Helvetica").fontSize(8.5).text(`Pagamento: ${data.payment || "A combinar"}`, MARGIN + 40, 525, {
    width: 160,
    height: 11,
    ellipsis: true,
  });
  doc.rect(MARGIN + 242, 444, 1, 116).fill(LINE);
  drawCoverDetail(doc, "Prazo", data.deadline || "A combinar", MARGIN + 258, 464, 220, design);
  drawCoverDetail(doc, "Validade", data.validUntil, MARGIN + 258, 510, 220, design);

  doc.roundedRect(MARGIN, 612, CONTENT_WIDTH, 82, 10).fillAndStroke(design.soft, LINE);
  doc.rect(MARGIN + 20, 634, 3, 36).fill(data.brandAccentColor);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(8).text("PROXIMO PASSO", MARGIN + 38, 634);
  doc.fillColor(INK).font("Helvetica").fontSize(9).text(data.publicUrl, MARGIN + 38, 651, {
    width: CONTENT_WIDTH - 58,
    height: 11,
    ellipsis: true,
  });
  doc.fillColor(MUTED).font("Helvetica").fontSize(8).text("Acesse o link para revisar a proposta e registrar o aceite online.", MARGIN + 38, 668, {
    width: CONTENT_WIDTH - 58,
    height: 10,
    ellipsis: true,
  });

  const metaY = 724;
  drawCoverMeta(doc, "CLIENTE", data.clientName, MARGIN, metaY, 164, design);
  drawCoverMeta(doc, "EMISSAO", data.createdAt, MARGIN + 184, metaY, 132, design);
  drawCoverMeta(doc, "DOCUMENTO", documentTitleFor(data.documentType, design.documentTitle), MARGIN + 336, metaY, 172, design);
}

async function drawCover(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  const style = getPdfProposalStyle(data.proposalStyle);
  doc.rect(0, 0, PAGE.width, 292).fill(style.coverColor(data));
  doc.rect(0, 0, PAGE.width, 7).fill(data.brandColor);
  if (style.accent === "creative") {
    doc.circle(PAGE.width - 54, 66, 94).fill(data.brandAccentColor);
    doc.circle(PAGE.width - 116, 22, 58).fill(data.brandColor);
  }
  if (style.accent === "premium") {
    doc.rect(PAGE.width - 154, 0, 154, 292).fill(data.brandColor);
    doc.rect(PAGE.width - 104, 0, 104, 292).fill(data.brandAccentColor);
  }
  if (style.accent === "technical") {
    for (let x = 0; x < PAGE.width; x += 34) doc.rect(x, 0, 0.35, 292).fill("#334155");
    for (let y = 0; y < 292; y += 34) doc.rect(0, y, PAGE.width, 0.35).fill("#334155");
  }

  const logo = await readImageFromUrl(data.logoUrl, data.assetOrigin);
  if (logo) {
    const logoX = MARGIN;
    const logoY = 30;
    const logoWidth = 92;
    const logoHeight = 58;
    const didDrawLogo = drawLogoImageInFrame(doc, logo, logoX, logoY, logoWidth, logoHeight, 7, 7);
    if (!didDrawLogo) {
      drawLogoInitials(doc, data.brandName, logoX, logoY, 58, data.brandColor);
    }
  } else {
    drawLogoInitials(doc, data.brandName, MARGIN, 30, 58, data.brandColor);
  }

  const brandTextX = logo ? MARGIN + 108 : MARGIN + 72;
  doc.fillColor("#BFDBFE").font("Helvetica-Bold").fontSize(8).text(style.eyebrow, brandTextX, 38, {
    characterSpacing: 1.1,
  });
  doc.fillColor("#FFFFFF").fontSize(13).text(data.brandName, brandTextX, 53, {
    width: PAGE.width - brandTextX - MARGIN - 150,
    height: 24,
    ellipsis: true,
  });

  drawStatusPill(doc, data.status, PAGE.width - MARGIN - 132, 42, 132, data.brandColor);

  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(style.titleSize).text(`Proposta para ${data.clientName}`, MARGIN, 104, {
    width: CONTENT_WIDTH,
    height: 86,
    lineGap: 1,
    ellipsis: true,
  });
  doc.fillColor("#CBD5E1").font("Helvetica").fontSize(10.5).text(
    data.proposalIntro || data.brandBio || `Preparada por ${data.ownerName} com escopo, investimento, prazo e aceite em um único documento.`,
    MARGIN,
    198,
    { width: CONTENT_WIDTH - 36, height: 42, lineGap: 3, ellipsis: true },
  );

  const bandY = 258;
  const metricGap = 10;
  const metricWidth = (CONTENT_WIDTH - metricGap * 2) / 3;
  drawCoverMetric(doc, "Investimento", data.price, MARGIN, bandY, metricWidth, data.brandColor);
  drawCoverMetric(doc, "Validade", data.validUntil, MARGIN + metricWidth + metricGap, bandY, metricWidth, data.brandColor);
  drawCoverMetric(doc, "Prazo", data.deadline || "A combinar", MARGIN + (metricWidth + metricGap) * 2, bandY, metricWidth, data.brandColor);
  doc.fillColor(MUTED).font("Helvetica").fontSize(7.5).text(data.publicUrl, MARGIN, bandY + 78, {
    width: CONTENT_WIDTH,
    height: 10,
    ellipsis: true,
  });
}

function drawDocumentHeader(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  drawPageCanvas(doc, design);
  doc.rect(0, 0, PAGE.width, 18).fill(design.primary);
  doc.rect(0, 18, PAGE.width, 3).fill(design.accent);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(8).text(design.segmentName.toUpperCase(), MARGIN, MARGIN - 16, {
    width: 160,
    height: 10,
    ellipsis: true,
  });
  doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(data.brandName, PAGE.width - MARGIN - 210, MARGIN - 16, {
    width: 210,
    align: "right",
    height: 10,
    ellipsis: true,
  });
  doc.roundedRect(MARGIN + 2, MARGIN + 12, CONTENT_WIDTH, 46, 10).fill("#E5E7EB");
  doc.roundedRect(MARGIN, MARGIN + 10, CONTENT_WIDTH, 46, 10).fillAndStroke("#FFFFFF", LINE);
  doc.rect(MARGIN, MARGIN + 10, 5, 46).fill(design.primary);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(7.5).text("PROPOSTA", MARGIN + 18, MARGIN + 23);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(data.serviceName, MARGIN + 82, MARGIN + 19, {
    width: CONTENT_WIDTH - 242,
    height: 26,
    lineGap: 1,
    ellipsis: true,
  });
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(11).text(data.price, PAGE.width - MARGIN - 132, MARGIN + 24, {
    width: 112,
    align: "right",
    height: 14,
    ellipsis: true,
  });
  doc.y = MARGIN + 78;
}

function drawPageCanvas(doc: PDFKit.PDFDocument, design: PdfSegmentDesign) {
  doc.rect(0, 0, PAGE.width, PAGE.height).fill(PAPER);
  doc.rect(MARGIN - 16, MARGIN + 22, 2, PAGE.height - 172).fill("#E9EEF5");
  doc.circle(PAGE.width - 28, PAGE.height - 42, 54).fill(design.soft);
}

function drawSummary(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  sectionTitle(doc, "Resumo da proposta", "Informações principais", design);

  const items: Array<[string, string]> = [
    ["Prazo", data.deadline],
    ["Pagamento", data.payment],
    ["Validade", data.validUntil],
  ];

  const featureWidth = 192;
  const itemWidth = CONTENT_WIDTH - featureWidth - 24;
  const itemGap = 12;
  const itemValueWidth = itemWidth - 62;
  const startY = doc.y + 10;

  // Calcula altura do card esquerdo com base na altura real dos itens da direita
  const previewItemHeights = items.map(([, value]) => {
    const v = value || "A combinar";
    doc.font("Helvetica-Bold").fontSize(10.5);
    return Math.max(42, doc.heightOfString(v, { width: itemValueWidth, lineGap: 2 }) + 31);
  });
  const totalItemsH = previewItemHeights.reduce((sum, h, i) => sum + h + (i < previewItemHeights.length - 1 ? itemGap : 0), 0);
  const leftCardH = Math.max(148, totalItemsH);

  doc.roundedRect(MARGIN + 3, startY + 4, featureWidth, leftCardH, 10).fill("#E5E7EB");
  doc.roundedRect(MARGIN, startY, featureWidth, leftCardH, 10).fill("#FFFFFF");
  doc.rect(MARGIN, startY, featureWidth, 5).fill(design.primary);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(7.5).text("SERVIÇO PROPOSTO", MARGIN + 22, startY + 24);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(13.5).text(data.serviceName, MARGIN + 22, startY + 44, {
    width: featureWidth - 42,
    height: 58,
    lineGap: 2,
    ellipsis: true,
  });
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7.5).text("INVESTIMENTO", MARGIN + 22, startY + 108);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(16).text(data.price, MARGIN + 22, startY + 120, {
    width: featureWidth - 42,
    height: 18,
    ellipsis: true,
  });

  let itemY = startY;
  items.forEach(([label, value], index) => {
    const x = MARGIN + featureWidth + 24;
    const displayValue = value || "A combinar";
    doc.font("Helvetica-Bold").fontSize(10.5);
    const valueHeight = doc.heightOfString(displayValue, {
      width: itemValueWidth,
      lineGap: 2,
    });
    const itemHeight = Math.max(42, valueHeight + 31);
    const y = itemY;
    doc.roundedRect(x + 2, y + 3, itemWidth, itemHeight, 8).fill("#E5E7EB");
    doc.roundedRect(x, y, itemWidth, itemHeight, 8).fillAndStroke("#FFFFFF", LINE);
    doc.roundedRect(x + 14, y + 16, 22, 3, 1.5).fill(index === 1 ? design.primary : design.accent);
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7.5).text(label.toUpperCase(), x + 48, y + 10);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10.5).text(displayValue, x + 48, y + 21, {
      width: itemValueWidth,
      lineGap: 2,
    });
    itemY += itemHeight + itemGap;
  });

  doc.y = Math.max(startY + leftCardH + 22, itemY + 10);
}

function drawServiceMark(doc: PDFKit.PDFDocument, brandName: string, x: number, y: number, size: number, color: string) {
  doc.roundedRect(x, y, size, size, 10).fill(color);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(24).text(initials(brandName), x, y + 28, {
    width: size,
    align: "center",
  });
}

function drawSmallIconLabel(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, color: string) {
  doc.roundedRect(x, y - 1, 11, 11, 2).strokeColor(color).lineWidth(1).stroke();
  doc.rect(x + 2, y - 4, 2, 5).fill(color);
  doc.rect(x + 7, y - 4, 2, 5).fill(color);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(8.5).text(label, x + 17, y - 1);
  doc.fillColor("#334155").font("Helvetica-Bold").fontSize(8.5).text(value, x + 51, y - 1);
}

function drawBlackLabel(doc: PDFKit.PDFDocument, text: string, x: number, y: number) {
  const width = Math.max(126, text.length * 6.2 + 22);
  doc.roundedRect(x, y, width, 18, 4).fill("#020617");
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text(text, x + 14, y + 5, {
    width: width - 20,
    height: 9,
    ellipsis: true,
  });
}

function drawBucketIcon(doc: PDFKit.PDFDocument, x: number, y: number, color: string) {
  doc.ellipse(x + 19, y, 19, 7).lineWidth(3).strokeColor("#020617").stroke();
  doc.moveTo(x + 2, y + 2).lineTo(x + 8, y + 34).lineTo(x + 30, y + 34).lineTo(x + 36, y + 2).stroke();
  doc.rect(x + 9, y + 16, 20, 10).fill(color);
}

function drawSegmentIcon(doc: PDFKit.PDFDocument, x: number, y: number, design: PdfSegmentDesign) {
  if (design.icon === "car") {
    doc.roundedRect(x + 2, y + 10, 36, 17, 5).lineWidth(3).strokeColor("#020617").stroke();
    doc.moveTo(x + 9, y + 10).lineTo(x + 15, y).lineTo(x + 28, y).lineTo(x + 34, y + 10).stroke();
    doc.circle(x + 11, y + 29, 5).fill(design.primary);
    doc.circle(x + 31, y + 29, 5).fill(design.primary);
    return;
  }
  if (design.icon === "spark") {
    doc.circle(x + 20, y + 17, 18).lineWidth(3).strokeColor("#020617").stroke();
    doc.moveTo(x + 20, y + 2).lineTo(x + 20, y + 32).moveTo(x + 5, y + 17).lineTo(x + 35, y + 17).stroke();
    doc.circle(x + 20, y + 17, 6).fill(design.primary);
    return;
  }
  if (design.icon === "heart") {
    doc.circle(x + 14, y + 12, 10).fill(design.primary);
    doc.circle(x + 27, y + 12, 10).fill(design.primary);
    doc.moveTo(x + 6, y + 18).lineTo(x + 20, y + 36).lineTo(x + 35, y + 18).fill(design.primary);
    doc.circle(x + 20, y + 18, 16).lineWidth(3).strokeColor("#020617").stroke();
    return;
  }
  if (design.icon === "briefcase") {
    doc.roundedRect(x + 3, y + 9, 34, 27, 5).lineWidth(3).strokeColor("#020617").stroke();
    doc.rect(x + 14, y + 2, 12, 7).stroke();
    doc.rect(x + 5, y + 19, 30, 8).fill(design.primary);
    return;
  }
  if (design.icon === "calendar") {
    doc.roundedRect(x + 4, y + 3, 32, 32, 4).lineWidth(3).strokeColor("#020617").stroke();
    doc.rect(x + 4, y + 12, 32, 8).fill(design.primary);
    doc.circle(x + 13, y + 27, 3).fill("#020617");
    doc.circle(x + 27, y + 27, 3).fill("#020617");
    return;
  }
  if (design.icon === "screen") {
    doc.roundedRect(x + 2, y + 3, 36, 25, 4).lineWidth(3).strokeColor("#020617").stroke();
    doc.rect(x + 11, y + 31, 18, 5).fill(design.primary);
    doc.text("</>", x + 9, y + 11, { width: 22, align: "center" });
    return;
  }
  drawBucketIcon(doc, x, y, design.primary);
}

function drawBudgetDetailsTable(doc: PDFKit.PDFDocument, data: ProposalPdfData, y: number, design: PdfSegmentDesign) {
  const columns = [126, 284, CONTENT_WIDTH - 410];
  const rowHeight = 24;
  const rows = design.rows(data);

  doc.roundedRect(MARGIN + 2, y + 3, CONTENT_WIDTH, rowHeight * 6, 6).fill("#E2E8F0");
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, rowHeight * 6, 6).fillAndStroke("#FFFFFF", LINE);
  doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight).fill(design.primary);
  doc.rect(MARGIN, y + rowHeight - 4, CONTENT_WIDTH, 4).fill(design.accent);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text("DESCRICAO", MARGIN + 12, y + 9);
  doc.text("DETALHES", MARGIN + columns[0] + 12, y + 9);
  doc.text("VALOR (R$)", MARGIN + columns[0] + columns[1] + 12, y + 9);
  doc.rect(MARGIN + columns[0], y, 1, rowHeight * 5).fill(LINE);
  doc.rect(MARGIN + columns[0] + columns[1], y, 1, rowHeight * 5).fill(LINE);

  rows.forEach((row, index) => {
    const rowY = y + rowHeight * (index + 1);
    doc.rect(MARGIN, rowY, CONTENT_WIDTH, 1).fill(LINE);
    doc.fillColor("#334155").font("Helvetica").fontSize(8).text(row[0], MARGIN + 12, rowY + 8, { width: columns[0] - 24, height: 9, ellipsis: true });
    doc.text(row[1], MARGIN + columns[0] + 12, rowY + 8, { width: columns[1] - 24, height: 9, ellipsis: true });
    doc.text(row[2], MARGIN + columns[0] + columns[1] + 12, rowY + 8, { width: columns[2] - 24, height: 9, ellipsis: true });
  });

  const totalY = y + rowHeight * 5;
  doc.rect(MARGIN, totalY, CONTENT_WIDTH, rowHeight).fill("#F8FAFC");
  doc.rect(MARGIN, totalY, 6, rowHeight).fill(design.accent);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text("VALOR TOTAL", MARGIN + 12, totalY + 8);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(16).text(data.price, MARGIN + columns[0] + columns[1] + 2, totalY + 5, {
    width: columns[2] - 14,
    align: "right",
    height: 18,
    ellipsis: true,
  });
  doc.fillColor("#475569").font("Helvetica").fontSize(7.5).text("Valor total com material e mao de obra inclusos.", MARGIN + 14, totalY + 30);
}

function drawContactLine(doc: PDFKit.PDFDocument, text: string, x: number, y: number, color: string) {
  doc.circle(x + 4, y + 4, 4).fill(color);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(5).text("OK", x + 0.2, y + 2, { width: 8, align: "center" });
  doc.fillColor("#334155").font("Helvetica-Bold").fontSize(7.8).text(text, x + 14, y, {
    width: 135,
    height: 10,
    ellipsis: true,
  });
}

function getSegmentDesign(data: ProposalPdfData): PdfSegmentDesign {
  const text = stripAccents(`${data.serviceName} ${data.included.join(" ")} ${data.notes} ${data.brandName}`).toLowerCase();
  const selectedSegment = data.segment || "auto";
  const base = {
    primary: data.brandColor,
    accent: data.brandAccentColor,
    soft: "#F8FAFC",
    segmentName: "Serviço",
    brandCaption: "Serviços",
    promise: "Escopo claro e valor organizado",
    documentTitle: "ORCAMENTO",
    referenceLabel: "Referencia:",
    scopeLabel: "SERVIÇO SOLICITADO",
    tableLabel: "DETALHAMENTO DO SERVIÇO",
    detailTitle: "DETALHES DO SERVIÇO",
    notesTitle: "OBSERVAÇÕES",
    fallbackImageLabel: "Serviço profissional",
    icon: "bucket" as PdfSegmentIcon,
    intro: (proposal: ProposalPdfData) => `Agradecemos o contato e apresentamos nosso orcamento para ${proposal.serviceName}.`,
    defaultNote: "Serviço realizado com qualidade e acabamento profissional.",
    secondaryNote: "Prazo e pagamento conforme combinado com o cliente.",
    footerLine: "Qualidade que transforma seu espaco.",
    rows: (proposal: ProposalPdfData): Array<[string, string, string]> => [
      ["Preparação", "Organização, proteção da área e alinhamento do serviço", "Incluso"],
      ["Execução", proposal.serviceName, "Incluso"],
      ["Materiais", proposal.included[0] || "Conforme combinado", "Incluso"],
      ["Mao de obra", "Profissional qualificado", "Incluso"],
    ],
  };

  if (selectedSegment === "home_reform" || hasAny(text, ["pintura", "reforma", "alvenaria", "eletrica", "hidraulica", "instalacao", "acabamento", "obra", "marcenaria", "gesso", "moveis planejados", "movel planejado", "sob medida"])) {
    return {
      ...base,
      primary: data.brandColor,
      accent: "#111827",
      soft: "#F1F5F9",
      segmentName: "Reforma",
      brandCaption: "Obra e serviços",
      promise: "Execução organizada e acabamento profissional",
      icon: "bucket",
      fallbackImageLabel: "Antes e depois do ambiente",
      detailTitle: "MATERIAL USADO",
      defaultNote: "Proteção de pisos, móveis e áreas de circulação inclusa.",
      secondaryNote: "Limpeza básica e conferência final ao concluir o serviço.",
      rows: (proposal) => [
        ["Preparação", "Limpeza, lixamento leve e proteção das áreas", "Incluso"],
        ["Aplicação", proposal.serviceName, "Incluso"],
        ["Material", proposal.included[0] || "Material conforme combinado", "Incluso"],
        ["Mao de obra", "Profissional qualificado", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "automotive" || hasAny(text, ["mecanica", "automotiva", "veiculo", "carro", "lavagem", "lava jato", "polimento", "vitrificacao", "freio", "scanner", "bateria"])) {
    return {
      ...base,
      primary: data.brandAccentColor,
      accent: "#0F172A",
      soft: "#F8FAFC",
      segmentName: "Automotivo",
      brandCaption: "Auto service",
      promise: "Diagnóstico, cuidado e entrega conferida",
      icon: "car",
      referenceLabel: "Veiculo/cliente:",
      detailTitle: "DIAGNÓSTICO",
      fallbackImageLabel: "Registro do veiculo",
      defaultNote: "Checklist e testes finais realizados antes da entrega.",
      secondaryNote: "Peças adicionais somente com aprovação prévia do cliente.",
      footerLine: "Cuidado técnico do diagnóstico à entrega.",
      rows: (proposal) => [
        ["Diagnóstico", "Inspeção inicial e verificação dos itens combinados", "Incluso"],
        ["Execução", proposal.serviceName, "Incluso"],
        ["Produtos/Peças", proposal.included[0] || "Conforme aprovação do cliente", "Incluso"],
        ["Teste final", "Conferência, orientação e registro da entrega", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "beauty" || hasAny(text, ["beleza", "manicure", "unha", "sobrancelha", "cabelo", "maquiagem", "estetica", "spa", "depilacao"])) {
    return {
      ...base,
      primary: data.brandAccentColor,
      accent: "#BE185D",
      soft: "#FDF2F8",
      segmentName: "Beleza",
      brandCaption: "Beauty service",
      promise: "Atendimento personalizado e acabamento bonito",
      icon: "spark",
      documentTitle: "PROPOSTA",
      detailTitle: "CUIDADOS",
      fallbackImageLabel: "Resultado esperado",
      defaultNote: "Atendimento personalizado conforme avaliação e preferência da cliente.",
      secondaryNote: "Cuidados pós-procedimento serão orientados na entrega.",
      footerLine: "Beleza com cuidado, técnica e acabamento.",
      rows: (proposal) => [
        ["Avaliação", "Análise inicial e alinhamento do resultado desejado", "Incluso"],
        ["Procedimento", proposal.serviceName, "Incluso"],
        ["Produtos", proposal.included[0] || "Produtos profissionais conforme técnica", "Incluso"],
        ["Finalização", "Orientações de cuidado e acabamento final", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "health" || hasAny(text, ["nutricao", "psicologia", "pilates", "personal", "treino", "saude", "terapia", "consulta", "odontologia"])) {
    return {
      ...base,
      primary: data.brandColor,
      accent: "#047857",
      soft: "#ECFDF5",
      segmentName: "Cuidado",
      brandCaption: "Saúde e bem-estar",
      promise: "Acompanhamento claro e orientação profissional",
      icon: "heart",
      documentTitle: "PLANO DE CUIDADO",
      detailTitle: "ACOMPANHAMENTO",
      fallbackImageLabel: "Atendimento profissional",
      defaultNote: "Atendimento conduzido com sigilo, escuta e orientações personalizadas.",
      secondaryNote: "Retornos e ajustes seguem as condições combinadas.",
      footerLine: "Cuidado profissional com acompanhamento claro.",
      rows: (proposal) => [
        ["Avaliação", "Levantamento inicial e entendimento da necessidade", "Incluso"],
        ["Atendimento", proposal.serviceName, "Incluso"],
        ["Orientações", proposal.included[0] || "Plano personalizado conforme avaliação", "Incluso"],
        ["Acompanhamento", "Registro, retorno ou suporte conforme combinado", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "business" || hasAny(text, ["advocacia", "juridic", "contrato", "processo", "contabilidade", "fiscal", "cnpj", "consultoria", "mentoria", "bpo"])) {
    return {
      ...base,
      primary: data.brandSecondaryColor,
      accent: data.brandColor,
      soft: "#F8FAFC",
      segmentName: "Negocios",
      brandCaption: "Consultoria",
      promise: "Clareza comercial para decidir com segurança",
      icon: "briefcase",
      documentTitle: "PROPOSTA COMERCIAL",
      detailTitle: "ESCOPO",
      fallbackImageLabel: "Documento profissional",
      defaultNote: "Informações tratadas com confidencialidade e organização profissional.",
      secondaryNote: "Escopo adicional deve ser aprovado antes da execução.",
      footerLine: "Clareza comercial para decidir com segurança.",
      rows: (proposal) => [
        ["Diagnóstico", "Análise das informações e entendimento do cenário", "Incluso"],
        ["Entrega", proposal.serviceName, "Incluso"],
        ["Documentos", proposal.included[0] || "Materiais e documentos combinados", "Incluso"],
        ["Reunião", "Alinhamento, devolutiva ou orientação final", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "events" || hasAny(text, ["evento", "cerimonial", "buffet", "decoracao", "festa", "casamento", "coffee break", "fotografia", "fotografic", "fotografo", "ensaio fotografic", "som", "sonorizacao", "iluminacao", "audiovisual", "dj", "microfone"])) {
    return {
      ...base,
      primary: data.brandAccentColor,
      accent: "#D97706",
      soft: "#FFFBEB",
      segmentName: "Evento",
      brandCaption: "Eventos",
      promise: "Organização para cada detalhe da data",
      icon: "calendar",
      documentTitle: "PROPOSTA EVENTO",
      referenceLabel: "Evento/cliente:",
      detailTitle: "PRODUCAO",
      fallbackImageLabel: "Referencia visual",
      defaultNote: "Agenda sujeita a disponibilidade até confirmação da proposta.",
      secondaryNote: "Itens extras, deslocamento e equipe adicional podem alterar o valor.",
      footerLine: "Organização para cada detalhe acontecer bem.",
      rows: (proposal) => [
        ["Planejamento", "Briefing, roteiro e alinhamento do evento", "Incluso"],
        ["Execução", proposal.serviceName, "Incluso"],
        ["Estrutura", proposal.included[0] || "Itens combinados para a data", "Incluso"],
        ["Acompanhamento", "Montagem, suporte e finalização conforme escopo", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "technology" || hasAny(text, ["site", "landing", "software", "sistema", "automacao", "trafego", "marketing", "social media", "design", "identidade", "conteudo", "reels"])) {
    return {
      ...base,
      primary: data.brandAccentColor,
      accent: "#1D4ED8",
      soft: "#EFF6FF",
      segmentName: "Digital",
      brandCaption: "Digital studio",
      promise: "Estrategia, design e entrega bem definidos",
      icon: "screen",
      documentTitle: "PROPOSTA COMERCIAL",
      detailTitle: "ENTREGAVEIS",
      fallbackImageLabel: "Preview do projeto",
      defaultNote: "Entrega digital com alinhamentos e ajustes conforme escopo aprovado.",
      secondaryNote: "Ferramentas pagas, midia e hospedagem podem ser cobradas a parte.",
      footerLine: "Estrategia, design e entrega em um fluxo claro.",
      rows: (proposal) => [
        ["Briefing", "Levantamento de objetivo, referências e conteúdo", "Incluso"],
        ["Producao", proposal.serviceName, "Incluso"],
        ["Entregáveis", proposal.included[0] || "Arquivos e materiais finais combinados", "Incluso"],
        ["Ajustes", "Rodada de revisao e fechamento da entrega", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "education" || hasAny(text, ["aula", "curso", "educacao", "reforco", "treinamento", "workshop"])) {
    return {
      ...base,
      primary: data.brandAccentColor,
      accent: "#7C3AED",
      soft: "#F5F3FF",
      segmentName: "Educação",
      brandCaption: "Aulas",
      promise: "Plano de aprendizado objetivo e acompanhado",
      icon: "briefcase",
      documentTitle: "PROPOSTA",
      detailTitle: "APRENDIZADO",
      fallbackImageLabel: "Plano de aulas",
      defaultNote: "Conteúdo adaptado ao nível, objetivo e ritmo do aluno.",
      secondaryNote: "Materiais, encontros e retornos seguem o plano combinado.",
      footerLine: "Ensino organizado para evoluir com clareza.",
      rows: (proposal) => [
        ["Diagnóstico", "Entendimento do nível, objetivo e principais dificuldades", "Incluso"],
        ["Aulas", proposal.serviceName, "Incluso"],
        ["Material", proposal.included[0] || "Material de apoio conforme plano", "Incluso"],
        ["Acompanhamento", "Exercícios, retornos ou avaliação de progresso", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "food" || hasAny(text, ["bolo", "buffet", "marmita", "coffee", "cardapio", "gastronomia", "comida", "doces"])) {
    return {
      ...base,
      primary: data.brandAccentColor,
      accent: "#EA580C",
      soft: "#FFF7ED",
      segmentName: "Gastronomia",
      brandCaption: "Gastronomia",
      promise: "Pedido organizado do preparo a entrega",
      icon: "calendar",
      documentTitle: "ORCAMENTO",
      detailTitle: "PREPARO",
      fallbackImageLabel: "Referencia do pedido",
      defaultNote: "Pedido preparado conforme cardapio, quantidade e data combinada.",
      secondaryNote: "Entrega, retirada e embalagens especiais devem ser confirmadas.",
      footerLine: "Sabor, organização e entrega no combinado.",
      rows: (proposal) => [
        ["Briefing", "Definicao de cardapio, quantidade e preferencias", "Incluso"],
        ["Preparo", proposal.serviceName, "Incluso"],
        ["Itens", proposal.included[0] || "Itens do pedido conforme combinado", "Incluso"],
        ["Entrega", "Embalagem, retirada ou entrega combinada", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "pet" || hasAny(text, ["pet", "banho", "tosa", "adestramento", "veterinario", "dog", "gato"])) {
    return {
      ...base,
      primary: data.brandColor,
      accent: "#0F766E",
      soft: "#F0FDFA",
      segmentName: "Pet",
      brandCaption: "Pet care",
      promise: "Cuidado responsavel e atendimento tranquilo",
      icon: "heart",
      documentTitle: "ORCAMENTO",
      detailTitle: "CUIDADO PET",
      fallbackImageLabel: "Atendimento pet",
      defaultNote: "Atendimento realizado respeitando o comportamento e bem-estar do pet.",
      secondaryNote: "Serviços extras serão alinhados antes da execução.",
      footerLine: "Cuidado, carinho e responsabilidade no atendimento.",
      rows: (proposal) => [
        ["Avaliação", "Entendimento do porte, rotina e necessidade do pet", "Incluso"],
        ["Atendimento", proposal.serviceName, "Incluso"],
        ["Cuidados", proposal.included[0] || "Cuidados conforme pacote contratado", "Incluso"],
        ["Orientações", "Recomendações finais para o tutor", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "real_estate" || hasAny(text, ["imovel", "imobiliaria", "condominio", "locacao", "vistoria", "administracao", "sindico"])) {
    return {
      ...base,
      primary: data.brandSecondaryColor,
      accent: "#57534E",
      soft: "#FAFAF9",
      segmentName: "Imóveis",
      brandCaption: "Imóveis e condomínios",
      promise: "Escopo, responsabilidades e condições bem definidos",
      icon: "briefcase",
      documentTitle: "PROPOSTA COMERCIAL",
      detailTitle: "ESCOPO IMOBILIARIO",
      fallbackImageLabel: "Imóvel ou condomínio",
      defaultNote: "Responsabilidades, documentos e prazos seguem as condições combinadas.",
      secondaryNote: "Taxas, deslocamentos, certidoes ou demandas extras podem ser cobrados a parte.",
      footerLine: "Gestão imobiliária com clareza para decidir.",
      rows: (proposal) => [
        ["Diagnóstico", "Levantamento do imóvel, condomínio ou necessidade", "Incluso"],
        ["Serviço", proposal.serviceName, "Incluso"],
        ["Documentos", proposal.included[0] || "Materiais e registros combinados", "Incluso"],
        ["Devolutiva", "Relatório, orientação ou acompanhamento final", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "fashion_retail" || hasAny(text, ["moda", "loja", "varejo", "colecao", "vitrine", "ecommerce", "roupa", "calcado"])) {
    return {
      ...base,
      primary: data.brandAccentColor,
      accent: "#E11D48",
      soft: "#FFF1F2",
      segmentName: "Varejo",
      brandCaption: "Moda e varejo",
      promise: "Produto, campanha e entrega alinhados",
      icon: "spark",
      documentTitle: "PROPOSTA COMERCIAL",
      detailTitle: "ENTREGAS",
      fallbackImageLabel: "Colecao ou loja",
      defaultNote: "Itens, quantidades e prazos seguem a disponibilidade e briefing aprovado.",
      secondaryNote: "Producoes, fornecedores externos e urgencias podem alterar o valor.",
      footerLine: "Varejo organizado para vender melhor.",
      rows: (proposal) => [
        ["Briefing", "Objetivo comercial, produto e referencias", "Incluso"],
        ["Execução", proposal.serviceName, "Incluso"],
        ["Materiais", proposal.included[0] || "Itens e entregaveis combinados", "Incluso"],
        ["Finalização", "Entrega, ajustes ou orientações de uso", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "transport" || hasAny(text, ["transporte", "frete", "logistica", "entrega", "mudanca", "rota", "motoboy"])) {
    return {
      ...base,
      primary: data.brandSecondaryColor,
      accent: "#0891B2",
      soft: "#ECFEFF",
      segmentName: "Logistica",
      brandCaption: "Transporte",
      promise: "Rota, prazo e operação definidos",
      icon: "car",
      documentTitle: "ORCAMENTO",
      referenceLabel: "Rota/cliente:",
      detailTitle: "OPERAÇÃO",
      fallbackImageLabel: "Rota ou carga",
      defaultNote: "Coleta, entrega, volume e janelas de horário devem ser confirmados previamente.",
      secondaryNote: "Pedagios, ajudantes, espera e mudancas de rota podem alterar o valor.",
      footerLine: "Entrega organizada do ponto inicial ao destino.",
      rows: (proposal) => [
        ["Coleta", "Alinhamento de origem, destino, volume e horario", "Incluso"],
        ["Transporte", proposal.serviceName, "Incluso"],
        ["Operação", proposal.included[0] || "Itens e cuidados combinados", "Incluso"],
        ["Entrega", "Confirmação, comprovante ou orientação final", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "finance" || hasAny(text, ["financeiro", "seguro", "credito", "investimento", "consorcio", "planejamento financeiro"])) {
    return {
      ...base,
      primary: data.brandSecondaryColor,
      accent: "#15803D",
      soft: "#F0FDF4",
      segmentName: "Financeiro",
      brandCaption: "Financas e seguros",
      promise: "Análise clara para decisão segura",
      icon: "briefcase",
      documentTitle: "PROPOSTA COMERCIAL",
      detailTitle: "ANÁLISE",
      fallbackImageLabel: "Planejamento financeiro",
      defaultNote: "Recomendações dependem das informações fornecidas e das condições vigentes.",
      secondaryNote: "Produtos financeiros, taxas, apolices e terceiros seguem regras proprias.",
      footerLine: "Decisões financeiras com orientação clara.",
      rows: (proposal) => [
        ["Diagnóstico", "Levantamento do objetivo, perfil e informações iniciais", "Incluso"],
        ["Análise", proposal.serviceName, "Incluso"],
        ["Entregáveis", proposal.included[0] || "Relatório, proposta ou orientações combinadas", "Incluso"],
        ["Acompanhamento", "Devolutiva e próximos passos", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "industry" || hasAny(text, ["industrial", "industria", "maquina", "equipamento", "manutencao", "usinagem", "solda"])) {
    return {
      ...base,
      primary: data.brandSecondaryColor,
      accent: "#CA8A04",
      soft: "#FEFCE8",
      segmentName: "Indústria",
      brandCaption: "Técnico industrial",
      promise: "Diagnóstico, execução e entrega técnica",
      icon: "bucket",
      documentTitle: "PROPOSTA TÉCNICA",
      detailTitle: "ESCOPO TÉCNICO",
      fallbackImageLabel: "Equipamento ou área técnica",
      defaultNote: "Execução sujeita a disponibilidade do equipamento, acesso e condições de segurança.",
      secondaryNote: "Peças, paradas adicionais e adequações devem ser aprovadas separadamente.",
      footerLine: "Execução técnica com segurança e controle.",
      rows: (proposal) => [
        ["Inspeção", "Avaliação inicial, risco e acesso técnico", "Incluso"],
        ["Execução", proposal.serviceName, "Incluso"],
        ["Materiais", proposal.included[0] || "Materiais ou peças conforme escopo", "Incluso"],
        ["Teste", "Conferência, registro e orientação final", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "agriculture" || hasAny(text, ["agro", "rural", "fazenda", "plantio", "irrigacao", "maquina agricola", "pecuaria"])) {
    return {
      ...base,
      primary: data.brandColor,
      accent: "#65A30D",
      soft: "#F7FEE7",
      segmentName: "Agro",
      brandCaption: "Agro e rural",
      promise: "Operação rural planejada e acompanhada",
      icon: "bucket",
      documentTitle: "PROPOSTA",
      detailTitle: "OPERAÇÃO RURAL",
      fallbackImageLabel: "Área rural",
      defaultNote: "Prazos podem variar conforme clima, acesso, área atendida e disponibilidade de insumos.",
      secondaryNote: "Insumos, equipamentos e deslocamentos extras devem ser aprovados previamente.",
      footerLine: "Atendimento rural com planejamento e controle.",
      rows: (proposal) => [
        ["Levantamento", "Área, necessidade, período e condições de acesso", "Incluso"],
        ["Serviço", proposal.serviceName, "Incluso"],
        ["Insumos", proposal.included[0] || "Itens e materiais combinados", "Incluso"],
        ["Acompanhamento", "Orientação, registro ou retorno conforme escopo", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "tourism" || hasAny(text, ["turismo", "viagem", "hospedagem", "hotel", "pousada", "roteiro", "excursao"])) {
    return {
      ...base,
      primary: data.brandAccentColor,
      accent: "#0284C7",
      soft: "#F0F9FF",
      segmentName: "Turismo",
      brandCaption: "Turismo e hospedagem",
      promise: "Experiencia organizada do roteiro a reserva",
      icon: "calendar",
      documentTitle: "PROPOSTA",
      detailTitle: "EXPERIENCIA",
      fallbackImageLabel: "Destino ou hospedagem",
      defaultNote: "Valores e disponibilidade podem variar até a confirmação da reserva.",
      secondaryNote: "Taxas, transporte, passeios opcionais e politicas de cancelamento devem ser confirmados.",
      footerLine: "Experiencias planejadas para aproveitar melhor.",
      rows: (proposal) => [
        ["Briefing", "Datas, perfil, preferencias e quantidade de pessoas", "Incluso"],
        ["Experiencia", proposal.serviceName, "Incluso"],
        ["Inclusos", proposal.included[0] || "Itens e reservas combinados", "Incluso"],
        ["Suporte", "Orientações e confirmações finais", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "security" || hasAny(text, ["seguranca", "camera", "alarme", "monitoramento", "cftv", "portaria", "controle de acesso"])) {
    return {
      ...base,
      primary: data.brandSecondaryColor,
      accent: "#D97706",
      soft: "#FFFBEB",
      segmentName: "Segurança",
      brandCaption: "Protecao",
      promise: "Projeto, instalação e suporte definidos",
      icon: "briefcase",
      documentTitle: "PROPOSTA TÉCNICA",
      detailTitle: "PROJETO",
      fallbackImageLabel: "Sistema de segurança",
      defaultNote: "Equipamentos, pontos de instalação e acesso ao local devem ser confirmados antes da execução.",
      secondaryNote: "Infraestrutura, cabos, licencas e equipamentos extras podem alterar o valor.",
      footerLine: "Proteção planejada com instalação e suporte.",
      rows: (proposal) => [
        ["Diagnóstico", "Levantamento de risco, local e pontos de cobertura", "Incluso"],
        ["Instalação", proposal.serviceName, "Incluso"],
        ["Equipamentos", proposal.included[0] || "Itens e materiais combinados", "Incluso"],
        ["Treinamento", "Teste, configuração e orientação de uso", "Incluso"],
      ],
    };
  }

  return base;
}

function documentTitleFor(documentType: string, fallback: string) {
  const titles: Record<string, string> = {
    budget: "ORCAMENTO",
    commercial_proposal: "PROPOSTA COMERCIAL",
    technical_proposal: "PROPOSTA TÉCNICA",
    care_plan: "PLANO DE CUIDADO",
    event_proposal: "PROPOSTA EVENTO",
  };
  return titles[documentType] || fallback;
}

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hasAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function drawScope(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  if (!data.showServices) return;
  ensureSpace(doc, 170);
  sectionTitle(doc, "Serviços inclusos", "Escopo de entrega", design);

  const items = data.included.length ? data.included : ["Serviço conforme combinado."];
  drawServicesTable(doc, items, design);
}

function drawPayment(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  doc.font("Helvetica-Bold").fontSize(13);
  const paymentTextHeight = doc.heightOfString(data.payment, {
    width: 176,
    lineGap: 2,
  });
  const cardHeight = Math.max(94, paymentTextHeight + 58);
  ensureSpace(doc, cardHeight + 32);
  sectionTitle(doc, "Condição comercial", "Pagamento e aceite", design);
  const y = doc.y + 8;
  const splitX = MARGIN + 224;
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, cardHeight, 9).fill(design.soft);
  doc.rect(MARGIN, y, 6, cardHeight).fill(design.primary);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(7.5).text("FORMA DE PAGAMENTO", MARGIN + 24, y + 24);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text(data.payment, MARGIN + 24, y + 40, {
    width: 176,
    lineGap: 2,
  });
  doc.rect(splitX, y + 20, 1, cardHeight - 40).fill(LINE);
  drawInlineMetric(doc, "Recebimento", paymentMethodLabel(data.paymentMethod), splitX + 24, y + 25, 200);
  doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(
    "Aceite, contato e instrucoes finais ficam disponiveis no link da proposta.",
    splitX + 24,
    y + 53,
    { width: CONTENT_WIDTH - 272, height: 24, lineGap: 2, ellipsis: true },
  );
  doc.y = y + cardHeight + 22;
}

function drawNotes(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  if (!data.notes) return;
  const height = textPanelHeight(doc, data.notes);
  ensureSpace(doc, sectionBlockHeight(height));
  sectionTitle(doc, "Observações", "Condições", design);
  drawPremiumTextPanel(doc, data.notes, height, design);
}

function drawCustomTextBlock(doc: PDFKit.PDFDocument, title: string, eyebrow: string, text: string, design: PdfSegmentDesign) {
  if (!text) return;
  const height = textPanelHeight(doc, text);
  ensureSpace(doc, sectionBlockHeight(height));
  sectionTitle(doc, title, eyebrow, design);
  drawPremiumTextPanel(doc, text, height, design);
}

function drawPremiumTextPanel(doc: PDFKit.PDFDocument, text: string, height: number, design: PdfSegmentDesign) {
  const y = doc.y + 8;
  doc.roundedRect(MARGIN + 2, y + 3, CONTENT_WIDTH, height, 9).fill("#E5E7EB");
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, height, 9).fillAndStroke("#FFFFFF", LINE);
  doc.rect(MARGIN, y, 5, height).fill(design.accent);
  doc.fillColor("#334155").font("Helvetica").fontSize(10.3).text(text, MARGIN + 24, y + 15, {
    width: CONTENT_WIDTH - 48,
    lineGap: 4,
  });
  doc.y = y + height + 16;
}

function drawFaq(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  const items = parseCustomFaq(data.proposalFaq);
  if (!items.length) return;
  ensureSpace(doc, 120); // reserva espaço para título + pelo menos um item de FAQ
  sectionTitle(doc, "Perguntas frequentes", "FAQ", design);
  const colGap = 22;
  const colWidth = (CONTENT_WIDTH - colGap) / 2;
  const startY = doc.y;
  const yCol = [startY, startY];
  const columnSplit = Math.ceil(items.length / 2);

  items.forEach(([question, answer], index) => {
    const col = index < columnSplit ? 0 : 1;
    doc.font("Helvetica-Bold").fontSize(9);
    const qHeight = doc.heightOfString(question, { width: colWidth - 16, lineGap: 1 });
    doc.font("Helvetica").fontSize(8);
    const aHeight = doc.heightOfString(answer, { width: colWidth - 16, lineGap: 2 });
    const itemHeight = qHeight + aHeight + 9;

    if (yCol[col] + itemHeight > PAGE_BOTTOM) {
      doc.addPage();
      doc.y = MARGIN;
      yCol[0] = doc.y;
      yCol[1] = doc.y;
    }

    const x = MARGIN + col * (colWidth + colGap);
    const y = yCol[col];

    doc.roundedRect(x, y + 4, 8, 3, 2).fill(design.accent);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text(question, x + 16, y, {
      width: colWidth - 16,
      lineGap: 1,
    });
    doc.fillColor("#475569").font("Helvetica").fontSize(8).text(answer, x + 16, y + qHeight + 3, {
      width: colWidth - 16,
      lineGap: 2,
    });

    yCol[col] += itemHeight + 7;
  });

  doc.y = Math.max(yCol[0], yCol[1]);
}

function drawServicesTable(doc: PDFKit.PDFDocument, items: string[], design: PdfSegmentDesign) {
  const markerWidth = 54;
  const serviceWidth = CONTENT_WIDTH - markerWidth - 8;
  doc.y += 8;

  items.forEach((item, index) => {
    const descriptionHeight = doc.heightOfString(item, { width: serviceWidth, lineGap: 3 });
    const rowHeight = Math.max(48, descriptionHeight + 28);

    if (doc.y + rowHeight > PAGE_BOTTOM) {
      doc.addPage();
      doc.y = MARGIN;
    }

    const y = doc.y;
    doc.roundedRect(MARGIN + 2, y + 3, CONTENT_WIDTH, rowHeight, 8).fill("#E5E7EB");
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, rowHeight, 8).fillAndStroke(index % 2 === 0 ? "#FFFFFF" : design.soft, LINE);
    doc.rect(MARGIN, y, 5, rowHeight).fill(index % 2 === 0 ? design.primary : design.accent);
    const circleY = y + Math.min(24, rowHeight / 2);
    doc.circle(MARGIN + 27, circleY, 13).fill("#FFFFFF");
    doc.circle(MARGIN + 27, circleY, 12).strokeColor(design.primary).lineWidth(1.4).stroke();
    doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(8.5).text(String(index + 1).padStart(2, "0"), MARGIN + 17.5, circleY - 5, {
      width: 19,
      align: "center",
    });
    doc.fillColor("#334155").font("Helvetica").fontSize(10.4).text(item, MARGIN + markerWidth, y + 12, {
      width: serviceWidth,
      lineGap: 3,
    });
    doc.y = y + rowHeight + 3;
  });

  doc.y += 14;
}

async function drawPortfolio(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  if (!data.portfolio.length) return;
  ensureSpace(doc, 260); // reserva espaço para título + pelo menos a primeira linha de cards
  sectionTitle(doc, "Portfólio relacionado", "Prova visual", design);

  const cardWidth = (CONTENT_WIDTH - 16) / 2;
  const cardHeight = 160;

  for (let index = 0; index < data.portfolio.length; index++) {
    const item = data.portfolio[index];
    if (index % 2 === 0) ensureSpace(doc, cardHeight + 18);
    const x = MARGIN + (index % 2) * (cardWidth + 16);
    const y = doc.y;

    doc.rect(x, y + 112, cardWidth, 1).fill(LINE);
    const image = await readPortfolioImage(item, data.assetOrigin);
    if (image) {
      const rendered = drawPdfImage(doc, image, x, y, {
        fit: [cardWidth, 102],
        align: "center",
        valign: "center",
        width: cardWidth,
        height: 102,
      });
      const fallbackLabel = (item.category || "Portfólio").split(":").pop() || "Portfólio";
      if (!rendered) drawPortfolioImageFallback(doc, x, y, cardWidth, 102, fallbackLabel, design);
    } else {
      const categoryLabel = (item.category || "Portfólio").split(":").pop() || "Portfólio";
      doc.roundedRect(x, y, cardWidth, 102, 6).fill(design.soft);
      doc.rect(x, y, cardWidth, 4).fill(design.primary);
      doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(12).text(categoryLabel, x + 12, y + 44, {
        align: "center",
        width: cardWidth - 24,
        height: 14,
        ellipsis: true,
      });
    }
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text(item.title, x, y + 124, {
      width: cardWidth,
      height: 16,
      ellipsis: true,
    });
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(item.category || "Trabalho anterior", x, y + 143, {
      width: cardWidth,
      height: 12,
      ellipsis: true,
    });

    if (index % 2 === 1 || index === data.portfolio.length - 1) doc.y = y + cardHeight + 16;
  }
}

function drawTestimonials(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  if (!data.testimonials.length) return;
  ensureSpace(doc, 200); // reserva espaço para título + pelo menos um depoimento
  sectionTitle(doc, "Depoimentos", "Prova social", design);

  data.testimonials.forEach((item) => {
    const quote = `"${item.quote}"`;
    const height = Math.max(88, doc.heightOfString(quote, { width: CONTENT_WIDTH - 50, lineGap: 3 }) + 56);
    ensureSpace(doc, height + 16);
    const y = doc.y + 8;

    doc.roundedRect(MARGIN + 2, y + 3, CONTENT_WIDTH, height, 8).fill("#E2E8F0");
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, height, 8).fill(design.soft);
    doc.rect(MARGIN, y, 5, height).fill(design.primary);

    doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(40).text('"', MARGIN + 18, y + 8, { lineBreak: false });

    doc.fillColor("#334155").font("Helvetica").fontSize(10.5).text(quote, MARGIN + 22, y + 48, {
      width: CONTENT_WIDTH - 44,
      lineGap: 3,
    });

    doc.rect(MARGIN + 22, y + height - 22, 20, 2).fill(design.accent);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text(
      `${item.authorName}${item.company ? `, ${item.company}` : ""}`,
      MARGIN + 22,
      y + height - 14,
      { width: CONTENT_WIDTH - 46, height: 12, ellipsis: true },
    );

    doc.y = y + height + 12;
  });
}

function drawPortfolioImageFallback(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  design: PdfSegmentDesign,
) {
  doc.roundedRect(x, y, width, height, 6).fill(design.soft);
  doc.rect(x, y, width, 4).fill(design.primary);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(12).text(label, x + 12, y + 44, {
    align: "center",
    width: width - 24,
    height: 14,
    ellipsis: true,
  });
}

async function readPortfolioImage(item: { category: string | null; imageUrl: string | null }, assetOrigin: string) {
  const image = await readImageFromUrl(item.imageUrl || "", assetOrigin);
  if (image || !item.category?.startsWith("Demo:")) return image;
  return readImageFromUrl(DEMO_SERVICE_IMAGE_URL, assetOrigin);
}

function drawDecision(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  ensureSpace(doc, 150);
  const y = doc.y + 8;
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 128, 8).fill(data.brandSecondaryColor);
  doc.rect(MARGIN + 22, y + 22, 42, 3).fill(design.accent);
  doc.fillColor(design.accent).font("Helvetica-Bold").fontSize(8).text("DECISAO DA PROPOSTA", MARGIN + 22, y + 42);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(19).text(labelStatus(data.status), MARGIN + 22, y + 58, {
    width: 184,
    height: 24,
    ellipsis: true,
  });

  let detail = "Para aceitar, acesse o link da proposta e confirme pelo botão de aceite.";
  if (data.status === "accepted") {
    detail = `Aceita por ${data.acceptedBy || data.clientName}${data.acceptedAt ? ` em ${data.acceptedAt}` : ""}.`;
  }
  if (data.status === "declined") {
    detail = `Recusada pelo cliente.${data.declinedReason ? ` Motivo: ${data.declinedReason}` : ""}`;
  }
  if (data.paymentStatus === "paid") {
    detail += ` Pagamento confirmado${data.paymentPaidAt ? ` em ${data.paymentPaidAt}` : ""}.`;
  }

  doc.rect(MARGIN + 224, y + 28, 1, 72).fill("#475569");
  doc.fillColor("#E2E8F0").font("Helvetica").fontSize(10).text(detail, MARGIN + 248, y + 42, {
    width: CONTENT_WIDTH - 270,
    lineGap: 3,
  });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text("LINK PARA ACEITE", MARGIN + 248, y + 86);
  doc.fillColor("#CBD5E1").font("Helvetica").fontSize(7.8).text(data.publicUrl, MARGIN + 248, y + 101, {
    width: CONTENT_WIDTH - 270,
    height: 10,
    ellipsis: true,
  });
  doc.y = y + 148;
}

function drawFooter(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  const pageRange = doc.bufferedPageRange();
  for (let index = pageRange.start; index < pageRange.start + pageRange.count; index++) {
    if (index === pageRange.start) continue;
    doc.switchToPage(index);
    // smaller, subtler footer
    const y = PAGE.height - 64;
    const footerHeight = 36;
    // light divider line only
    doc.rect(MARGIN, y - 6, CONTENT_WIDTH, 1).fill(LINE);
    // subtle background (very light)
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, footerHeight, 6).fill(design.soft).opacity(1);
    // compact contact label and list
    doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(7).text("CONTATO", MARGIN + 12, y + 8);
    const contacts = [
      data.brandEmail ? `${data.brandEmail}` : "",
      data.brandWhatsapp ? `${data.brandWhatsapp}` : "",
      data.brandInstagram ? `${data.brandInstagram}` : "",
      data.brandWebsite ? `${data.brandWebsite}` : "",
    ].filter(Boolean);
    doc.fillColor(INK).font("Helvetica").fontSize(7).text(contacts.join("  |  "), MARGIN + 80, y + 9, {
      width: CONTENT_WIDTH - 92,
      ellipsis: true,
      lineBreak: false,
    });
  }
}

function drawPageNumbers(doc: PDFKit.PDFDocument) {
  const pageRange = doc.bufferedPageRange();
  for (let index = pageRange.start; index < pageRange.start + pageRange.count; index++) {
    if (index === pageRange.start) continue;
    doc.switchToPage(index);
    doc.fillColor("#94A3B8").font("Helvetica").fontSize(8).text(`${index + 1}/${pageRange.count}`, PAGE.width - MARGIN - 30, PAGE.height - 64 + 9, {
      align: "right",
      width: 30,
      lineBreak: false,
    });
  }
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, eyebrow: string, designOrColor: PdfSegmentDesign | string = "#2563EB") {
  const color = typeof designOrColor === "string" ? designOrColor : designOrColor.primary;
  ensureSpace(doc, 48);
  const lineY = doc.y + 2;
  const pillY = lineY + 8;
  doc.rect(MARGIN, lineY, 42, 3).fill(color);
  doc.rect(MARGIN + 52, lineY + 1, CONTENT_WIDTH - 52, 1).fill(LINE);
  const eyebrowText = eyebrow.toUpperCase();
  const pillWidth = Math.min(180, eyebrowText.length * 5.6 + 24);
  doc.fillColor(color).font("Helvetica-Bold").fontSize(7.2).text(eyebrowText, MARGIN, pillY, {
    characterSpacing: 0.6,
    width: pillWidth,
    height: 8,
    ellipsis: true,
  });
  doc.y = pillY + 14;
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(16).text(title, { width: CONTENT_WIDTH });
  doc.moveDown(0.28);
}

function drawCoverMetric(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number, color: string) {
  doc.roundedRect(x, y, width, 62, 8).fill("#FFFFFF");
  doc.rect(x, y, width, 4).fill(color);
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7.5).text(label.toUpperCase(), x + 12, y + 14, {
    width: width - 24,
    height: 9,
    ellipsis: true,
  });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(label === "Investimento" ? 17 : 11.5).text(value, x + 12, y + 32, {
    width: width - 24,
    height: 18,
    ellipsis: true,
  });
}

function drawCoverDetail(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number, design: PdfSegmentDesign) {
  doc.rect(x, y + 1, 24, 2).fill(design.accent);
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7.5).text(label.toUpperCase(), x, y + 12, {
    width,
    height: 9,
    ellipsis: true,
  });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(12).text(value, x, y + 26, {
    width,
    height: 16,
    ellipsis: true,
  });
}

function drawCoverMeta(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number, design: PdfSegmentDesign) {
  doc.rect(x, y, width, 1).fill(LINE);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(7.2).text(label, x, y + 12, {
    width,
    height: 9,
    ellipsis: true,
  });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.2).text(value || "A combinar", x, y + 27, {
    width,
    height: 14,
    ellipsis: true,
  });
}

function drawCoverSummaryCard(
  doc: PDFKit.PDFDocument,
  data: ProposalPdfData,
  design: PdfSegmentDesign,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  doc.roundedRect(x, y, width, height, 8).fill(design.soft);
  doc.rect(x, y, width, 5).fill(data.brandAccentColor);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(8).text("RESUMO DA PROPOSTA", x + 18, y + 24, {
    width: width - 36,
    characterSpacing: 0.8,
    height: 10,
    ellipsis: true,
  });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text(data.serviceName, x + 18, y + 42, {
    width: width - 36,
    height: 48,
    lineGap: 2,
    ellipsis: true,
  });
  doc.rect(x + 18, y + 100, width - 36, 1).fill(LINE);
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7.5).text("CLIENTE", x + 18, y + 112);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(data.clientName, x + 18, y + 124, {
    width: width - 36,
    height: 14,
    ellipsis: true,
  });
  doc.rect(x + 18, y + 148, width - 36, 1).fill(LINE);
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7.5).text("INVESTIMENTO", x + 18, y + 160);
  doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(13).text(data.price, x + 18, y + 172, {
    width: width - 36,
    height: 16,
    ellipsis: true,
  });
}

function drawInlineMetric(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number) {
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7.5).text(label.toUpperCase(), x, y, {
    width,
    height: 10,
    ellipsis: true,
  });
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text(value || "A combinar", x, y + 17, {
    width,
    height: 24,
    ellipsis: true,
  });
}

function drawStatusPill(doc: PDFKit.PDFDocument, status: string, x: number, y: number, width: number, color: string) {
  doc.roundedRect(x, y, width, 24, 12).fill("#FFFFFF");
  doc.circle(x + 14, y + 12, 4).fill(color);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(8).text(labelStatus(status).toUpperCase(), x + 24, y + 8, {
    width: width - 32,
    height: 10,
    ellipsis: true,
  });
}

function drawLogoInitials(doc: PDFKit.PDFDocument, brandName: string, x: number, y: number, size: number, color: string) {
  doc.roundedRect(x, y, size, size, 7).fill(color);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(17).text(initials(brandName), x, y + 21, {
    align: "center",
    width: size,
  });
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed < PAGE_BOTTOM) return;
  doc.addPage();
  doc.y = MARGIN;
}

function textPanelHeight(doc: PDFKit.PDFDocument, text: string) {
  return Math.max(38, doc.heightOfString(text, { width: CONTENT_WIDTH - 48, lineGap: 4 }) + 28);
}

function sectionBlockHeight(panelHeight: number) {
  return 58 + panelHeight;
}

async function readImageFromUrl(url: string, assetOrigin: string) {
  if (!url) return null;

  let image: Buffer | null = null;
  let contentType = "";
  const uploadFilename = localUploadFilename(url);

  if (uploadFilename) {
    image = await readLocalUploadFile(uploadFilename);
    contentType = imageContentTypeFromFilename(uploadFilename);
    if (!image) {
      const uploadUrl = new URL(`/api/uploads/${uploadFilename}`, assetOrigin).toString();
      ({ image, contentType } = await fetchImage(uploadUrl));
    }
  } else if (url.startsWith("http://") || url.startsWith("https://")) {
    ({ image, contentType } = await fetchImage(url));
  } else if (url.startsWith("/")) {
    // Serve static files from the public/ directory (e.g. /brand/logo.png)
    try {
      const publicPath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
      image = await readFile(publicPath);
      const filename = path.basename(publicPath);
      contentType = imageContentTypeFromFilename(filename);
    } catch {
      return null;
    }
  } else {
    return null;
  }

  if (!image) {
    console.error("[PDF] Logo não carregado:", url);
    return null;
  }

  const result = await normalizePdfImage(image, contentType);
  if (!result) console.error("[PDF] Logo carregado mas não processado pelo sharp:", url, contentType);
  return result;
}

async function fetchImage(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    let response: Response;
    try {
      response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          "User-Agent": "Mozilla/5.0 (compatible; FechaProBot/1.0; +https://fechapro.com.br)",
          Referer: "https://fechapro.com.br/",
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      console.error("[PDF] Fetch imagem retornou erro:", url, response.status);
      return { image: null, contentType: "" };
    }
    const contentType = response.headers.get("content-type") || "";
    // Accept image/* and application/octet-stream (some CDNs return this for images)
    const isImage = contentType.startsWith("image/") || contentType === "application/octet-stream" || contentType === "";
    if (!isImage) {
      console.error("[PDF] Fetch imagem content-type inesperado:", url, contentType);
      return { image: null, contentType: "" };
    }
    return { image: Buffer.from(await response.arrayBuffer()), contentType };
  } catch (err) {
    console.error("[PDF] Fetch imagem falhou:", url, (err as Error).message);
    return { image: null, contentType: "" };
  }
}

function localUploadFilename(url: string) {
  try {
    const parsed = new URL(url, "http://local.fechapro");
    if (!parsed.pathname.startsWith("/api/uploads/")) return "";
    return path.basename(parsed.pathname);
  } catch {
    return "";
  }
}

function drawPdfImage(
  doc: PDFKit.PDFDocument,
  image: Buffer,
  x: number,
  y: number,
  options: PDFKit.Mixins.ImageOption,
) {
  try {
    doc.image(image, x, y, options);
    return true;
  } catch (err) {
    console.error("[PDF] Falha ao renderizar imagem no PDFKit:", err);
    return false;
  }
}

function drawLogoImageInFrame(
  doc: PDFKit.PDFDocument,
  image: Buffer,
  x: number,
  y: number,
  width: number,
  height: number,
  paddingX: number,
  paddingY: number,
) {
  return drawPdfImage(doc, image, x + paddingX, y + paddingY, {
    fit: [width - paddingX * 2, height - paddingY * 2],
    align: "center",
    valign: "center",
    width: width - paddingX * 2,
    height: height - paddingY * 2,
  });
}

async function normalizePdfImage(image: Buffer, contentType: string) {
  try {
    return await sharp(image, { animated: false })
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    // If sharp fails, return raw buffer only for formats PDFKit can render natively.
    // Detect by content-type or magic bytes (handles application/octet-stream from CDNs).
    const isPng = contentType === "image/png" || (image[0] === 0x89 && image[1] === 0x50);
    const isJpeg = contentType === "image/jpeg" || contentType === "image/jpg" || (image[0] === 0xff && image[1] === 0xd8);
    if (isPng || isJpeg) return image;
    return null;
  }
}

async function bufferHasAlpha(image: Buffer) {
  try {
    const meta = await sharp(image).metadata();
    return Boolean(meta.hasAlpha || meta.channels === 4);
  } catch {
    return false;
  }
}

function imageContentTypeFromFilename(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".avif") return "image/avif";
  return "image/*";
}

function demoLogoUrl(publicSlug: string) {
  return publicSlug.startsWith("demo-") ? "/brand/logofechapro.png" : "";
}

function demoServiceImages(publicSlug: string, serviceName: string) {
  if (!publicSlug.startsWith("demo-")) return [];
  return [{
    title: serviceName,
    category: "Servico demo",
    imageUrl: DEMO_SERVICE_IMAGE_URL,
  }];
}

function normalizeColor(color: string, fallback = "#22C55E") {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

function getPdfProposalStyle(style: string) {
  if (style === "creative") {
    return {
      accent: "creative",
      eyebrow: "PROPOSTA CRIATIVA",
      titleSize: 30,
      coverColor: (proposal: ProposalPdfData) => proposal.brandSecondaryColor,
    };
  }
  if (style === "premium") {
    return {
      accent: "premium",
      eyebrow: "PROPOSTA PREMIUM",
      titleSize: 28,
      coverColor: (proposal: ProposalPdfData) => proposal.brandSecondaryColor,
    };
  }
  if (style === "technical" || style === "classic") {
    return {
      accent: "technical",
      eyebrow: "PROPOSTA TÉCNICA",
      titleSize: 26,
      coverColor: (proposal: ProposalPdfData) => proposal.brandSecondaryColor,
    };
  }
  return {
    accent: "executive",
    eyebrow: "PROPOSTA EXECUTIVA",
    titleSize: 28,
    coverColor: (proposal: ProposalPdfData) => proposal.brandSecondaryColor,
  };
}

function initials(value: string) {
  const cleanValue = value.split("|")[0].trim();
  const normalized = cleanValue.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const parts = normalized
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "FP";
  if (parts.length === 1) {
    const w = parts[0];
    return (w.length >= 2 ? w[0] + w[1] : w[0]).toUpperCase();
  }
  return parts.map((word) => word[0]?.toUpperCase()).join("");
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function parseCustomFaq(value: string) {
  return value
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts): parts is [string, string] => Boolean(parts[0] && parts[1]));
}

function labelStatus(status: string) {
  const labels: Record<string, string> = {
    accepted: "Proposta aceita",
    declined: "Proposta recusada",
    draft: "Rascunho",
    expired: "Proposta expirada",
    sent: "Proposta enviada",
    awaiting_response: "Aguardando resposta",
    viewed: "Proposta visualizada",
  };
  return labels[status] || status;
}

function paymentMethodLabel(method: string) {
  const labels: Record<string, string> = {
    mercadopago: "Mercado Pago",
    direct_pix: "PIX direto",
    pix: "PIX direto",
  };
  return labels[method] || "A combinar";
}

type ProposalPdfData = {
  clientName: string;
  serviceName: string;
  price: string;
  deadline: string;
  payment: string;
  documentType: string;
  segment: string;
  createdAt: string;
  validUntil: string;
  included: string[];
  notes: string;
  ownerName: string;
  publicUrl: string;
  assetOrigin: string;
  brandName: string;
  brandColor: string;
  brandSecondaryColor: string;
  brandAccentColor: string;
  brandEmail: string;
  brandWhatsapp: string;
  brandInstagram: string;
  brandWebsite: string;
  brandBio: string;
  proposalStyle: string;
  proposalIntro: string;
  proposalClosing: string;
  proposalTerms: string;
  proposalFaq: string;
  showPortfolio: boolean;
  showTestimonials: boolean;
  showServices: boolean;
  showFaq: boolean;
  logoUrl: string;
  status: string;
  acceptedBy: string;
  acceptedEmail: string;
  acceptedAt: string;
  declinedReason: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentPaidAt: string;
  serviceImages: Array<{ title: string; category: string | null; imageUrl: string | null }>;
  portfolio: Array<{ title: string; category: string | null; imageUrl: string | null }>;
  testimonials: Array<{ authorName: string; company: string | null; quote: string }>;
};

type PdfSegmentIcon = "bucket" | "car" | "spark" | "heart" | "briefcase" | "calendar" | "screen";

type PdfSegmentDesign = {
  primary: string;
  accent: string;
  soft: string;
  segmentName: string;
  brandCaption: string;
  promise: string;
  documentTitle: string;
  referenceLabel: string;
  scopeLabel: string;
  tableLabel: string;
  detailTitle: string;
  notesTitle: string;
  fallbackImageLabel: string;
  icon: PdfSegmentIcon;
  intro: (proposal: ProposalPdfData) => string;
  defaultNote: string;
  secondaryNote: string;
  footerLine: string;
  rows: (proposal: ProposalPdfData) => Array<[string, string, string]>;
};
