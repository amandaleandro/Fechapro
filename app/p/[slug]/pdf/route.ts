import path from "node:path";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { notFound } from "next/navigation";
import sharp from "sharp";
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
const PAGE_BOTTOM = PAGE.height - 104;

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    include: { user: { include: { brandProfile: true } } },
  });

  if (!proposal) notFound();

  const [portfolio, testimonials] = await Promise.all([
    prisma.portfolioAsset.findMany({
      where: { userId: proposal.userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.testimonialAsset.findMany({
      where: { userId: proposal.userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const brand = proposal.user.brandProfile;
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
    logoUrl: brand?.logoUrl || "",
    status: proposal.status,
    acceptedBy: proposal.acceptedBy || "",
    acceptedEmail: proposal.acceptedEmail || "",
    acceptedAt: proposal.acceptedAt ? formatDate(proposal.acceptedAt.toISOString().slice(0, 10)) : "",
    declinedReason: proposal.declinedReason || "",
    paymentStatus: proposal.paymentStatus,
    paymentMethod: proposal.paymentMethod || "",
    paymentPaidAt: proposal.paymentPaidAt ? formatDate(proposal.paymentPaidAt.toISOString().slice(0, 10)) : "",
    portfolio,
    testimonials,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="proposta-${proposal.publicSlug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
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
  await drawBudgetCover(doc, data, design);
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

  const logo = await readImageFromUrl(data.logoUrl);
  if (logo) {
    doc.roundedRect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 8).fillAndStroke("#FFFFFF", "#E2E8F0");
    const didDrawLogo = drawPdfImage(doc, logo, logoBoxX + 8, logoBoxY + 8, {
      fit: [logoBoxWidth - 16, logoBoxHeight - 16],
      align: "center",
      valign: "center",
      width: logoBoxWidth - 16,
      height: logoBoxHeight - 16,
    });
    if (!didDrawLogo) drawServiceMark(doc, data.brandName, logoFallbackX, logoBoxY, logoSize, design.primary);
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

  const images = data.portfolio.slice(0, 2);
  for (let index = 0; index < 2; index++) {
    const x = MARGIN + index * (imageW + imageGap);
    doc.roundedRect(x + 2, imageY + 3, imageW, imageH, 8).fill("#CBD5E1");
    doc.roundedRect(x, imageY, imageW, imageH, 8).fill("#F1F5F9");
    const item = images[index];
    const image = await readImageFromUrl(item?.imageUrl || "");
    if (image) {
      drawPdfImage(doc, image, x, imageY, {
        fit: [imageW, imageH],
        align: "center",
        valign: "center",
        width: imageW,
        height: imageH,
      });
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
  const scopeItems = (data.included.length ? data.included : ["Servico conforme combinado."]).slice(0, 5);
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

  const logo = await readImageFromUrl(data.logoUrl);
  if (logo) {
    const logoX = MARGIN;
    const logoY = 30;
    const logoWidth = 92;
    const logoHeight = 58;
    doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 7).fill("#FFFFFF");
    const didDrawLogo = drawPdfImage(doc, logo, logoX, logoY, {
      fit: [logoWidth - 14, logoHeight - 14],
      align: "center",
      valign: "center",
      width: logoWidth,
      height: logoHeight,
    });
    if (!didDrawLogo) drawLogoInitials(doc, data.brandName, logoX, logoY, 58, data.brandColor);
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
  doc.rect(0, 0, PAGE.width, PAGE.height).fill("#FFFFFF");
  doc.rect(MARGIN - 12, MARGIN + 18, 2, PAGE.height - 150).fill("#EEF2F7");
  doc.rect(0, 0, PAGE.width, 18).fill(design.primary);
  doc.rect(0, 18, PAGE.width, 4).fill(design.accent);
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
}

function drawSummary(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  sectionTitle(doc, "Resumo da proposta", "Informações principais", design);

  const items: Array<[string, string]> = [
    ["Serviço", data.serviceName],
    ["Prazo", data.deadline],
    ["Pagamento", data.payment],
    ["Validade", data.validUntil],
  ];

  const cardWidth = (CONTENT_WIDTH - 12) / 2;
  const cardHeight = 58;
  const startY = doc.y + 10;

  items.forEach(([label, value], index) => {
    const x = MARGIN + (index % 2) * (cardWidth + 12);
    const y = startY + Math.floor(index / 2) * (cardHeight + 12);
    doc.roundedRect(x + 2, y + 2, cardWidth, cardHeight, 8).fill("#E2E8F0");
    doc.roundedRect(x, y, cardWidth, cardHeight, 8).fillAndStroke(index === 0 ? design.soft : "#FFFFFF", LINE);
    doc.rect(x, y, 5, cardHeight).fill(index === 0 ? design.primary : design.accent);
    doc.fillColor(index === 0 ? design.primary : MUTED).font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), x + 14, y + 13);
    doc.fillColor(INK).fontSize(12).text(value || "A combinar", x + 14, y + 30, {
      width: cardWidth - 28,
      ellipsis: true,
    });
  });

  doc.y = startY + cardHeight * 2 + 24;
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
    segmentName: "Servico",
    brandCaption: "Servicos",
    promise: "Escopo claro e valor organizado",
    documentTitle: "ORCAMENTO",
    referenceLabel: "Referencia:",
    scopeLabel: "SERVICO SOLICITADO",
    tableLabel: "DETALHAMENTO DO SERVICO",
    detailTitle: "DETALHES DO SERVICO",
    notesTitle: "OBSERVACOES",
    fallbackImageLabel: "Servico profissional",
    icon: "bucket" as PdfSegmentIcon,
    intro: (proposal: ProposalPdfData) => `Agradecemos o contato e apresentamos nosso orcamento para ${proposal.serviceName}.`,
    defaultNote: "Servico realizado com qualidade e acabamento profissional.",
    secondaryNote: "Prazo e pagamento conforme combinado com o cliente.",
    footerLine: "Qualidade que transforma seu espaco.",
    rows: (proposal: ProposalPdfData): Array<[string, string, string]> => [
      ["Preparacao", "Organizacao, protecao da area e alinhamento do servico", "Incluso"],
      ["Execucao", proposal.serviceName, "Incluso"],
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
      brandCaption: "Obra e servicos",
      promise: "Execucao organizada e acabamento profissional",
      icon: "bucket",
      fallbackImageLabel: "Antes e depois do ambiente",
      detailTitle: "MATERIAL USADO",
      defaultNote: "Protecao de pisos, moveis e areas de circulacao inclusa.",
      secondaryNote: "Limpeza basica e conferencia final ao concluir o servico.",
      rows: (proposal) => [
        ["Preparacao", "Limpeza, lixamento leve e protecao das areas", "Incluso"],
        ["Aplicacao", proposal.serviceName, "Incluso"],
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
      promise: "Diagnostico, cuidado e entrega conferida",
      icon: "car",
      referenceLabel: "Veiculo/cliente:",
      detailTitle: "DIAGNOSTICO",
      fallbackImageLabel: "Registro do veiculo",
      defaultNote: "Checklist e testes finais realizados antes da entrega.",
      secondaryNote: "Pecas adicionais somente com aprovacao previa do cliente.",
      footerLine: "Cuidado tecnico do diagnostico a entrega.",
      rows: (proposal) => [
        ["Diagnostico", "Inspecao inicial e verificacao dos itens combinados", "Incluso"],
        ["Execucao", proposal.serviceName, "Incluso"],
        ["Produtos/Pecas", proposal.included[0] || "Conforme aprovacao do cliente", "Incluso"],
        ["Teste final", "Conferencia, orientacao e registro da entrega", "Incluso"],
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
      defaultNote: "Atendimento personalizado conforme avaliacao e preferencia da cliente.",
      secondaryNote: "Cuidados pos-procedimento serao orientados na entrega.",
      footerLine: "Beleza com cuidado, tecnica e acabamento.",
      rows: (proposal) => [
        ["Avaliacao", "Analise inicial e alinhamento do resultado desejado", "Incluso"],
        ["Procedimento", proposal.serviceName, "Incluso"],
        ["Produtos", proposal.included[0] || "Produtos profissionais conforme tecnica", "Incluso"],
        ["Finalizacao", "Orientacoes de cuidado e acabamento final", "Incluso"],
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
      brandCaption: "Saude e bem-estar",
      promise: "Acompanhamento claro e orientacao profissional",
      icon: "heart",
      documentTitle: "PLANO DE CUIDADO",
      detailTitle: "ACOMPANHAMENTO",
      fallbackImageLabel: "Atendimento profissional",
      defaultNote: "Atendimento conduzido com sigilo, escuta e orientacoes personalizadas.",
      secondaryNote: "Retornos e ajustes seguem as condicoes combinadas.",
      footerLine: "Cuidado profissional com acompanhamento claro.",
      rows: (proposal) => [
        ["Avaliacao", "Levantamento inicial e entendimento da necessidade", "Incluso"],
        ["Atendimento", proposal.serviceName, "Incluso"],
        ["Orientacoes", proposal.included[0] || "Plano personalizado conforme avaliacao", "Incluso"],
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
      promise: "Clareza comercial para decidir com seguranca",
      icon: "briefcase",
      documentTitle: "PROPOSTA COMERCIAL",
      detailTitle: "ESCOPO",
      fallbackImageLabel: "Documento profissional",
      defaultNote: "Informacoes tratadas com confidencialidade e organizacao profissional.",
      secondaryNote: "Escopo adicional deve ser aprovado antes da execucao.",
      footerLine: "Clareza comercial para decidir com seguranca.",
      rows: (proposal) => [
        ["Diagnostico", "Analise das informacoes e entendimento do cenario", "Incluso"],
        ["Entrega", proposal.serviceName, "Incluso"],
        ["Documentos", proposal.included[0] || "Materiais e documentos combinados", "Incluso"],
        ["Reuniao", "Alinhamento, devolutiva ou orientacao final", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "events" || hasAny(text, ["evento", "cerimonial", "buffet", "decoracao", "festa", "casamento", "coffee break", "fotografia", "som", "sonorizacao", "iluminacao", "audiovisual", "dj", "microfone"])) {
    return {
      ...base,
      primary: data.brandAccentColor,
      accent: "#D97706",
      soft: "#FFFBEB",
      segmentName: "Evento",
      brandCaption: "Eventos",
      promise: "Organizacao para cada detalhe da data",
      icon: "calendar",
      documentTitle: "PROPOSTA EVENTO",
      referenceLabel: "Evento/cliente:",
      detailTitle: "PRODUCAO",
      fallbackImageLabel: "Referencia visual",
      defaultNote: "Agenda sujeita a disponibilidade ate confirmacao da proposta.",
      secondaryNote: "Itens extras, deslocamento e equipe adicional podem alterar o valor.",
      footerLine: "Organizacao para cada detalhe acontecer bem.",
      rows: (proposal) => [
        ["Planejamento", "Briefing, roteiro e alinhamento do evento", "Incluso"],
        ["Execucao", proposal.serviceName, "Incluso"],
        ["Estrutura", proposal.included[0] || "Itens combinados para a data", "Incluso"],
        ["Acompanhamento", "Montagem, suporte e finalizacao conforme escopo", "Incluso"],
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
        ["Briefing", "Levantamento de objetivo, referencias e conteudo", "Incluso"],
        ["Producao", proposal.serviceName, "Incluso"],
        ["Entregaveis", proposal.included[0] || "Arquivos e materiais finais combinados", "Incluso"],
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
      segmentName: "Educacao",
      brandCaption: "Aulas",
      promise: "Plano de aprendizado objetivo e acompanhado",
      icon: "briefcase",
      documentTitle: "PROPOSTA",
      detailTitle: "APRENDIZADO",
      fallbackImageLabel: "Plano de aulas",
      defaultNote: "Conteudo adaptado ao nivel, objetivo e ritmo do aluno.",
      secondaryNote: "Materiais, encontros e retornos seguem o plano combinado.",
      footerLine: "Ensino organizado para evoluir com clareza.",
      rows: (proposal) => [
        ["Diagnostico", "Entendimento do nivel, objetivo e principais dificuldades", "Incluso"],
        ["Aulas", proposal.serviceName, "Incluso"],
        ["Material", proposal.included[0] || "Material de apoio conforme plano", "Incluso"],
        ["Acompanhamento", "Exercicios, retornos ou avaliacao de progresso", "Incluso"],
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
      footerLine: "Sabor, organizacao e entrega no combinado.",
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
      secondaryNote: "Servicos extras serao alinhados antes da execucao.",
      footerLine: "Cuidado, carinho e responsabilidade no atendimento.",
      rows: (proposal) => [
        ["Avaliacao", "Entendimento do porte, rotina e necessidade do pet", "Incluso"],
        ["Atendimento", proposal.serviceName, "Incluso"],
        ["Cuidados", proposal.included[0] || "Cuidados conforme pacote contratado", "Incluso"],
        ["Orientacoes", "Recomendacoes finais para o tutor", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "real_estate" || hasAny(text, ["imovel", "imobiliaria", "condominio", "locacao", "vistoria", "administracao", "sindico"])) {
    return {
      ...base,
      primary: data.brandSecondaryColor,
      accent: "#57534E",
      soft: "#FAFAF9",
      segmentName: "Imoveis",
      brandCaption: "Imoveis e condominios",
      promise: "Escopo, responsabilidades e condicoes bem definidos",
      icon: "briefcase",
      documentTitle: "PROPOSTA COMERCIAL",
      detailTitle: "ESCOPO IMOBILIARIO",
      fallbackImageLabel: "Imovel ou condominio",
      defaultNote: "Responsabilidades, documentos e prazos seguem as condicoes combinadas.",
      secondaryNote: "Taxas, deslocamentos, certidoes ou demandas extras podem ser cobrados a parte.",
      footerLine: "Gestao imobiliaria com clareza para decidir.",
      rows: (proposal) => [
        ["Diagnostico", "Levantamento do imovel, condominio ou necessidade", "Incluso"],
        ["Servico", proposal.serviceName, "Incluso"],
        ["Documentos", proposal.included[0] || "Materiais e registros combinados", "Incluso"],
        ["Devolutiva", "Relatorio, orientacao ou acompanhamento final", "Incluso"],
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
        ["Execucao", proposal.serviceName, "Incluso"],
        ["Materiais", proposal.included[0] || "Itens e entregaveis combinados", "Incluso"],
        ["Finalizacao", "Entrega, ajustes ou orientacoes de uso", "Incluso"],
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
      promise: "Rota, prazo e operacao definidos",
      icon: "car",
      documentTitle: "ORCAMENTO",
      referenceLabel: "Rota/cliente:",
      detailTitle: "OPERACAO",
      fallbackImageLabel: "Rota ou carga",
      defaultNote: "Coleta, entrega, volume e janelas de horario devem ser confirmados previamente.",
      secondaryNote: "Pedagios, ajudantes, espera e mudancas de rota podem alterar o valor.",
      footerLine: "Entrega organizada do ponto inicial ao destino.",
      rows: (proposal) => [
        ["Coleta", "Alinhamento de origem, destino, volume e horario", "Incluso"],
        ["Transporte", proposal.serviceName, "Incluso"],
        ["Operacao", proposal.included[0] || "Itens e cuidados combinados", "Incluso"],
        ["Entrega", "Confirmacao, comprovante ou orientacao final", "Incluso"],
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
      promise: "Analise clara para decisao segura",
      icon: "briefcase",
      documentTitle: "PROPOSTA COMERCIAL",
      detailTitle: "ANALISE",
      fallbackImageLabel: "Planejamento financeiro",
      defaultNote: "Recomendacoes dependem das informacoes fornecidas e das condicoes vigentes.",
      secondaryNote: "Produtos financeiros, taxas, apolices e terceiros seguem regras proprias.",
      footerLine: "Decisoes financeiras com orientacao clara.",
      rows: (proposal) => [
        ["Diagnostico", "Levantamento do objetivo, perfil e informacoes iniciais", "Incluso"],
        ["Analise", proposal.serviceName, "Incluso"],
        ["Entregaveis", proposal.included[0] || "Relatorio, proposta ou orientacoes combinadas", "Incluso"],
        ["Acompanhamento", "Devolutiva e proximos passos", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "industry" || hasAny(text, ["industrial", "industria", "maquina", "equipamento", "manutencao", "usinagem", "solda"])) {
    return {
      ...base,
      primary: data.brandSecondaryColor,
      accent: "#CA8A04",
      soft: "#FEFCE8",
      segmentName: "Industria",
      brandCaption: "Tecnico industrial",
      promise: "Diagnostico, execucao e entrega tecnica",
      icon: "bucket",
      documentTitle: "PROPOSTA TECNICA",
      detailTitle: "ESCOPO TECNICO",
      fallbackImageLabel: "Equipamento ou area tecnica",
      defaultNote: "Execucao sujeita a disponibilidade do equipamento, acesso e condicoes de seguranca.",
      secondaryNote: "Pecas, paradas adicionais e adequacoes devem ser aprovadas separadamente.",
      footerLine: "Execucao tecnica com seguranca e controle.",
      rows: (proposal) => [
        ["Inspecao", "Avaliacao inicial, risco e acesso tecnico", "Incluso"],
        ["Execucao", proposal.serviceName, "Incluso"],
        ["Materiais", proposal.included[0] || "Materiais ou pecas conforme escopo", "Incluso"],
        ["Teste", "Conferencia, registro e orientacao final", "Incluso"],
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
      promise: "Operacao rural planejada e acompanhada",
      icon: "bucket",
      documentTitle: "PROPOSTA",
      detailTitle: "OPERACAO RURAL",
      fallbackImageLabel: "Area rural",
      defaultNote: "Prazos podem variar conforme clima, acesso, area atendida e disponibilidade de insumos.",
      secondaryNote: "Insumos, equipamentos e deslocamentos extras devem ser aprovados previamente.",
      footerLine: "Atendimento rural com planejamento e controle.",
      rows: (proposal) => [
        ["Levantamento", "Area, necessidade, periodo e condicoes de acesso", "Incluso"],
        ["Servico", proposal.serviceName, "Incluso"],
        ["Insumos", proposal.included[0] || "Itens e materiais combinados", "Incluso"],
        ["Acompanhamento", "Orientacao, registro ou retorno conforme escopo", "Incluso"],
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
      defaultNote: "Valores e disponibilidade podem variar ate a confirmacao da reserva.",
      secondaryNote: "Taxas, transporte, passeios opcionais e politicas de cancelamento devem ser confirmados.",
      footerLine: "Experiencias planejadas para aproveitar melhor.",
      rows: (proposal) => [
        ["Briefing", "Datas, perfil, preferencias e quantidade de pessoas", "Incluso"],
        ["Experiencia", proposal.serviceName, "Incluso"],
        ["Inclusos", proposal.included[0] || "Itens e reservas combinados", "Incluso"],
        ["Suporte", "Orientacoes e confirmacoes finais", "Incluso"],
      ],
    };
  }

  if (selectedSegment === "security" || hasAny(text, ["seguranca", "camera", "alarme", "monitoramento", "cftv", "portaria", "controle de acesso"])) {
    return {
      ...base,
      primary: data.brandSecondaryColor,
      accent: "#D97706",
      soft: "#FFFBEB",
      segmentName: "Seguranca",
      brandCaption: "Protecao",
      promise: "Projeto, instalacao e suporte definidos",
      icon: "briefcase",
      documentTitle: "PROPOSTA TECNICA",
      detailTitle: "PROJETO",
      fallbackImageLabel: "Sistema de seguranca",
      defaultNote: "Equipamentos, pontos de instalacao e acesso ao local devem ser confirmados antes da execucao.",
      secondaryNote: "Infraestrutura, cabos, licencas e equipamentos extras podem alterar o valor.",
      footerLine: "Protecao planejada com instalacao e suporte.",
      rows: (proposal) => [
        ["Diagnostico", "Levantamento de risco, local e pontos de cobertura", "Incluso"],
        ["Instalacao", proposal.serviceName, "Incluso"],
        ["Equipamentos", proposal.included[0] || "Itens e materiais combinados", "Incluso"],
        ["Treinamento", "Teste, configuracao e orientacao de uso", "Incluso"],
      ],
    };
  }

  return base;
}

function documentTitleFor(documentType: string, fallback: string) {
  const titles: Record<string, string> = {
    budget: "ORCAMENTO",
    commercial_proposal: "PROPOSTA COMERCIAL",
    technical_proposal: "PROPOSTA TECNICA",
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
  ensureSpace(doc, 118);
  sectionTitle(doc, "Condição comercial", "Pagamento e aceite", design);
  const y = doc.y + 8;
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 86, 8).fillAndStroke(design.soft, LINE);
  doc.rect(MARGIN, y, 6, 86).fill(design.primary);

  drawInlineMetric(doc, "Forma de pagamento", data.payment, MARGIN + 20, y + 18, 260);
  drawInlineMetric(doc, "Recebimento", paymentMethodLabel(data.paymentMethod), MARGIN + 302, y + 18, 180);
  doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(
    "O aceite e as instruções finais ficam disponíveis no link público da proposta.",
    MARGIN + 20,
    y + 58,
    { width: CONTENT_WIDTH - 40, height: 14, ellipsis: true },
  );
  doc.y = y + 106;
}

function drawNotes(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  if (!data.notes) return;
  ensureSpace(doc, 105);
  sectionTitle(doc, "Observações", "Condições", design);
  const height = Math.max(68, doc.heightOfString(data.notes, { width: CONTENT_WIDTH - 28, lineGap: 4 }) + 28);
  ensureSpace(doc, height + 8);
  doc.roundedRect(MARGIN, doc.y + 8, CONTENT_WIDTH, height, 8).fill(design.soft);
  doc.fillColor("#475569").font("Helvetica").fontSize(10.5).text(data.notes, MARGIN + 14, doc.y + 22, {
    width: CONTENT_WIDTH - 28,
    lineGap: 4,
  });
  doc.y += height + 18;
}

function drawCustomTextBlock(doc: PDFKit.PDFDocument, title: string, eyebrow: string, text: string, design: PdfSegmentDesign) {
  if (!text) return;
  ensureSpace(doc, 105);
  sectionTitle(doc, title, eyebrow, design);
  const height = Math.max(68, doc.heightOfString(text, { width: CONTENT_WIDTH - 28, lineGap: 4 }) + 28);
  ensureSpace(doc, height + 8);
  doc.roundedRect(MARGIN, doc.y + 8, CONTENT_WIDTH, height, 8).fill(design.soft);
  doc.fillColor("#475569").font("Helvetica").fontSize(10.5).text(text, MARGIN + 14, doc.y + 22, {
    width: CONTENT_WIDTH - 28,
    lineGap: 4,
  });
  doc.y += height + 18;
}

function drawFaq(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  const items = parseCustomFaq(data.proposalFaq);
  if (!items.length) return;
  ensureSpace(doc, 130);
  sectionTitle(doc, "Perguntas frequentes", "FAQ", design);
  items.forEach(([question, answer]) => {
    const height = Math.max(66, doc.heightOfString(`${question}\n${answer}`, { width: CONTENT_WIDTH - 28, lineGap: 3 }) + 32);
    ensureSpace(doc, height + 10);
    doc.roundedRect(MARGIN, doc.y + 6, CONTENT_WIDTH, height, 8).fill(design.soft);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10).text(question, MARGIN + 14, doc.y + 18, {
      width: CONTENT_WIDTH - 28,
    });
    doc.fillColor("#475569").font("Helvetica").fontSize(9.5).text(answer, MARGIN + 14, doc.y + 34, {
      width: CONTENT_WIDTH - 28,
      lineGap: 3,
    });
    doc.y += height + 14;
  });
}

function drawServicesTable(doc: PDFKit.PDFDocument, items: string[], design: PdfSegmentDesign) {
  const numberWidth = 62;
  const serviceWidth = CONTENT_WIDTH - numberWidth;
  const rowX = MARGIN;

  drawServicesTableHeader(doc, design, rowX, numberWidth, serviceWidth);

  items.forEach((item, index) => {
    const descriptionHeight = doc.heightOfString(item, {
      width: serviceWidth - 26,
      lineGap: 3,
    });
    const rowHeight = Math.max(50, descriptionHeight + 28);

    if (doc.y + rowHeight > PAGE_BOTTOM) {
      doc.addPage();
      doc.y = MARGIN;
      drawServicesTableHeader(doc, design, rowX, numberWidth, serviceWidth);
    }

    const y = doc.y;
    doc.rect(rowX, y, CONTENT_WIDTH, rowHeight).fill(index % 2 === 0 ? "#FFFFFF" : design.soft);
    doc.rect(rowX, y, CONTENT_WIDTH, 1).fill(LINE);
    doc.rect(rowX + numberWidth, y, 1, rowHeight).fill(LINE);

    doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(10).text(String(index + 1).padStart(2, "0"), rowX, y + 16, {
      width: numberWidth,
      align: "center",
    });
    doc.fillColor("#334155").font("Helvetica").fontSize(10.5).text(item, rowX + numberWidth + 13, y + 15, {
      width: serviceWidth - 26,
      lineGap: 3,
    });

    doc.y = y + rowHeight;
  });

  doc.rect(rowX, doc.y, CONTENT_WIDTH, 1).fill(LINE);
  doc.y += 18;
}

function drawServicesTableHeader(
  doc: PDFKit.PDFDocument,
  design: PdfSegmentDesign,
  x: number,
  numberWidth: number,
  serviceWidth: number,
) {
  const headerHeight = 34;
  doc.rect(x, doc.y, CONTENT_WIDTH, headerHeight).fill(design.primary);
  doc.rect(x, doc.y + headerHeight - 4, CONTENT_WIDTH, 4).fill(design.accent);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text("ITEM", x, doc.y + 13, {
    width: numberWidth,
    align: "center",
  });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text("ENTREGA", x + numberWidth + 14, doc.y + 13, {
    width: serviceWidth - 28,
  });
  doc.y += headerHeight;
}

async function drawPortfolio(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  if (!data.portfolio.length) return;
  ensureSpace(doc, 200);
  sectionTitle(doc, "Portfólio relacionado", "Prova visual", design);

  const cardWidth = (CONTENT_WIDTH - 18) / 2;
  const cardHeight = 132;

  for (let index = 0; index < data.portfolio.length; index++) {
    const item = data.portfolio[index];
    if (index % 2 === 0) ensureSpace(doc, cardHeight + 18);
    const x = MARGIN + (index % 2) * (cardWidth + 18);
    const y = doc.y;

    doc.roundedRect(x, y, cardWidth, cardHeight, 8).fillAndStroke("#FFFFFF", LINE);
    const image = await readImageFromUrl(item.imageUrl || "");
    if (image) {
      drawPdfImage(doc, image, x + 10, y + 10, { fit: [cardWidth - 20, 78], align: "center", valign: "center" });
    } else {
      doc.roundedRect(x + 10, y + 10, cardWidth - 20, 78, 6).fill(design.soft);
      doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(12).text(item.category || "Portfólio", x + 10, y + 43, {
        align: "center",
        width: cardWidth - 20,
      });
    }
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(11).text(item.title, x + 12, y + 96, {
      width: cardWidth - 24,
      height: 16,
      ellipsis: true,
    });
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(item.category || "Trabalho anterior", x + 12, y + 114, {
      width: cardWidth - 24,
      height: 12,
      ellipsis: true,
    });

    if (index % 2 === 1 || index === data.portfolio.length - 1) doc.y = y + cardHeight + 16;
  }
}

function drawTestimonials(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  if (!data.testimonials.length) return;
  ensureSpace(doc, 140);
  sectionTitle(doc, "Depoimentos", "Prova social", design);

  data.testimonials.forEach((item) => {
    const quote = `"${item.quote}"`;
    const height = Math.max(64, doc.heightOfString(quote, { width: CONTENT_WIDTH - 42, lineGap: 3 }) + 38);
    ensureSpace(doc, height + 12);
    doc.roundedRect(MARGIN, doc.y + 8, CONTENT_WIDTH, height, 8).fill(design.soft);
    doc.rect(MARGIN, doc.y + 8, 4, height).fill(design.primary);
    doc.fillColor("#475569").font("Helvetica").fontSize(10).text(quote, MARGIN + 18, doc.y + 22, {
      width: CONTENT_WIDTH - 42,
      lineGap: 3,
    });
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(9.5).text(
      `${item.authorName}${item.company ? `, ${item.company}` : ""}`,
      MARGIN + 18,
      doc.y + 8,
      { width: CONTENT_WIDTH - 42 },
    );
    doc.y += height + 18;
  });
}

function drawDecision(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  ensureSpace(doc, 120);
  const y = doc.y + 8;
  doc.roundedRect(MARGIN + 3, y + 4, CONTENT_WIDTH, 104, 8).fill("#CBD5E1");
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 104, 8).fill(data.brandSecondaryColor);
  doc.rect(MARGIN, y, 6, 104).fill(design.accent);
  doc.fillColor(design.accent).font("Helvetica-Bold").fontSize(8).text("STATUS DA PROPOSTA", MARGIN + 18, y + 18);
  doc.fillColor("#FFFFFF").fontSize(18).text(labelStatus(data.status), MARGIN + 18, y + 34);

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

  doc.fillColor("#CBD5E1").font("Helvetica").fontSize(10.5).text(detail, MARGIN + 18, y + 60, {
    width: CONTENT_WIDTH - 36,
    lineGap: 3,
  });
  doc.y = y + 122;
}

function drawFooter(doc: PDFKit.PDFDocument, data: ProposalPdfData, design: PdfSegmentDesign) {
  const pageRange = doc.bufferedPageRange();
  for (let index = pageRange.start; index < pageRange.start + pageRange.count; index++) {
    doc.switchToPage(index);
    const y = PAGE.height - 92;
    doc.rect(MARGIN, y, CONTENT_WIDTH, 1).fill(LINE);
    doc.rect(MARGIN, y + 4, 70, 2).fill(design.accent);
    doc.fillColor(design.primary).font("Helvetica-Bold").fontSize(8).text("CONTATO", MARGIN, y + 14);
    const contacts = [
      data.brandEmail ? `E-mail: ${data.brandEmail}` : "",
      data.brandWhatsapp ? `WhatsApp: ${data.brandWhatsapp}` : "",
      data.brandInstagram ? `Instagram: ${data.brandInstagram}` : "",
      data.brandWebsite ? `Site: ${data.brandWebsite}` : "",
    ].filter(Boolean);
    doc.fillColor(INK).font("Helvetica").fontSize(8.5).text(contacts.join("   |   "), MARGIN, y + 28, {
      width: CONTENT_WIDTH - 60,
      ellipsis: true,
      lineBreak: false,
    });
  }
}

function drawPageNumbers(doc: PDFKit.PDFDocument) {
  const pageRange = doc.bufferedPageRange();
  for (let index = pageRange.start; index < pageRange.start + pageRange.count; index++) {
    doc.switchToPage(index);
    doc.fillColor("#94A3B8").font("Helvetica").fontSize(8).text(`${index + 1}/${pageRange.count}`, PAGE.width - 74, PAGE.height - 64, {
      align: "right",
      width: 30,
      lineBreak: false,
    });
  }
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, eyebrow: string, designOrColor: PdfSegmentDesign | string = "#2563EB") {
  const color = typeof designOrColor === "string" ? designOrColor : designOrColor.primary;
  const accent = typeof designOrColor === "string" ? designOrColor : designOrColor.accent;
  ensureSpace(doc, 70);
  doc.rect(MARGIN, doc.y - 4, 34, 3).fill(accent);
  doc.fillColor(color).font("Helvetica-Bold").fontSize(8).text(eyebrow.toUpperCase(), MARGIN, doc.y, {
    characterSpacing: 0.8,
  });
  doc.moveDown(0.25);
  doc.fillColor(INK).fontSize(18).text(title, { width: CONTENT_WIDTH });
  doc.moveDown(0.4);
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

async function readImageFromUrl(url: string) {
  if (!url) return null;

  let image: Buffer | null = null;
  let contentType = "";

  if (url.startsWith("/api/uploads/")) {
    const filename = path.basename(url);
    image = await readLocalUploadFile(filename);
    contentType = imageContentTypeFromFilename(filename);
  } else if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) return null;
      image = Buffer.from(await response.arrayBuffer());
    } catch {
      return null;
    }
  } else {
    return null;
  }

  return image ? normalizePdfImage(image, contentType) : null;
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
  } catch {
    return false;
  }
}

async function normalizePdfImage(image: Buffer, contentType: string) {
  try {
    return await sharp(image, { animated: false })
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
  } catch {
    if (contentType === "image/png" || contentType === "image/jpeg" || contentType === "image/jpg") return image;
    return null;
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
  const words = value.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word[0]?.toUpperCase()).join("") || "FP";
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
