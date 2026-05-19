import path from "node:path";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { notFound } from "next/navigation";
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
  doc.addPage();
  await drawCover(doc, data);
  drawSummary(doc, data);
  drawScope(doc, data);
  drawPayment(doc, data);
  drawNotes(doc, data);
  drawCustomTextBlock(doc, "Mensagem", "Antes de decidir", data.proposalClosing, data.brandColor);
  if (data.showPortfolio) await drawPortfolio(doc, data);
  drawCustomTextBlock(doc, "Termos comerciais", "Condições", data.proposalTerms, data.brandColor);
  if (data.showTestimonials) drawTestimonials(doc, data);
  if (data.showFaq) drawFaq(doc, data);
  drawDecision(doc, data);
  drawFooter(doc, data);
  drawPageNumbers(doc);
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
    doc.roundedRect(MARGIN, 34, 46, 46, 6).fill("#FFFFFF");
    doc.image(logo, MARGIN + 6, 40, { fit: [34, 34] });
  } else {
    doc.roundedRect(MARGIN, 34, 46, 46, 6).fill(data.brandColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(15).text(initials(data.brandName), MARGIN, 50, {
      align: "center",
      width: 46,
    });
  }

  doc.fillColor("#BFDBFE").font("Helvetica-Bold").fontSize(8).text(style.eyebrow, MARGIN + 60, 38, {
    characterSpacing: 1.1,
  });
  doc.fillColor("#FFFFFF").fontSize(13).text(data.brandName, MARGIN + 60, 53, {
    width: 260,
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

function drawSummary(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  doc.y = 378;
  sectionTitle(doc, "Resumo da proposta", "Informações principais", data.brandColor);

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
    doc.rect(x, y, cardWidth, cardHeight).fillAndStroke(SOFT, LINE);
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), x + 14, y + 13);
    doc.fillColor(INK).fontSize(12).text(value || "A combinar", x + 14, y + 30, {
      width: cardWidth - 28,
      ellipsis: true,
    });
  });

  doc.y = startY + cardHeight * 2 + 24;
}

function drawScope(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  if (!data.showServices) return;
  ensureSpace(doc, 170);
  sectionTitle(doc, "Serviços inclusos", "Escopo de entrega", data.brandColor);

  const items = data.included.length ? data.included : ["Serviço conforme combinado."];
  drawServicesTable(doc, items, data.brandColor);
}

function drawPayment(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  ensureSpace(doc, 118);
  sectionTitle(doc, "Condição comercial", "Pagamento e aceite", data.brandColor);
  const y = doc.y + 8;
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 86, 8).fillAndStroke("#FFFFFF", LINE);
  doc.rect(MARGIN, y, 6, 86).fill(data.brandColor);

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

function drawNotes(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  if (!data.notes) return;
  ensureSpace(doc, 105);
  sectionTitle(doc, "Observações", "Condições", data.brandColor);
  const height = Math.max(68, doc.heightOfString(data.notes, { width: CONTENT_WIDTH - 28, lineGap: 4 }) + 28);
  ensureSpace(doc, height + 8);
  doc.roundedRect(MARGIN, doc.y + 8, CONTENT_WIDTH, height, 8).fill(SOFT);
  doc.fillColor("#475569").font("Helvetica").fontSize(10.5).text(data.notes, MARGIN + 14, doc.y + 22, {
    width: CONTENT_WIDTH - 28,
    lineGap: 4,
  });
  doc.y += height + 18;
}

function drawCustomTextBlock(doc: PDFKit.PDFDocument, title: string, eyebrow: string, text: string, brandColor: string) {
  if (!text) return;
  ensureSpace(doc, 105);
  sectionTitle(doc, title, eyebrow, brandColor);
  const height = Math.max(68, doc.heightOfString(text, { width: CONTENT_WIDTH - 28, lineGap: 4 }) + 28);
  ensureSpace(doc, height + 8);
  doc.roundedRect(MARGIN, doc.y + 8, CONTENT_WIDTH, height, 8).fill(SOFT);
  doc.fillColor("#475569").font("Helvetica").fontSize(10.5).text(text, MARGIN + 14, doc.y + 22, {
    width: CONTENT_WIDTH - 28,
    lineGap: 4,
  });
  doc.y += height + 18;
}

function drawFaq(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  const items = parseCustomFaq(data.proposalFaq);
  if (!items.length) return;
  ensureSpace(doc, 130);
  sectionTitle(doc, "Perguntas frequentes", "FAQ", data.brandColor);
  items.forEach(([question, answer]) => {
    const height = Math.max(66, doc.heightOfString(`${question}\n${answer}`, { width: CONTENT_WIDTH - 28, lineGap: 3 }) + 32);
    ensureSpace(doc, height + 10);
    doc.roundedRect(MARGIN, doc.y + 6, CONTENT_WIDTH, height, 8).fill(SOFT);
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

function drawServicesTable(doc: PDFKit.PDFDocument, items: string[], brandColor: string) {
  const numberWidth = 62;
  const serviceWidth = CONTENT_WIDTH - numberWidth;
  const rowX = MARGIN;

  drawServicesTableHeader(doc, brandColor, rowX, numberWidth, serviceWidth);

  items.forEach((item, index) => {
    const descriptionHeight = doc.heightOfString(item, {
      width: serviceWidth - 26,
      lineGap: 3,
    });
    const rowHeight = Math.max(50, descriptionHeight + 28);

    if (doc.y + rowHeight > PAGE_BOTTOM) {
      doc.addPage();
      doc.y = MARGIN;
      drawServicesTableHeader(doc, brandColor, rowX, numberWidth, serviceWidth);
    }

    const y = doc.y;
    doc.rect(rowX, y, CONTENT_WIDTH, rowHeight).fill(index % 2 === 0 ? "#FFFFFF" : SOFT);
    doc.rect(rowX, y, CONTENT_WIDTH, 1).fill(LINE);
    doc.rect(rowX + numberWidth, y, 1, rowHeight).fill(LINE);

    doc.fillColor(brandColor).font("Helvetica-Bold").fontSize(10).text(String(index + 1).padStart(2, "0"), rowX, y + 16, {
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
  brandColor: string,
  x: number,
  numberWidth: number,
  serviceWidth: number,
) {
  const headerHeight = 34;
  doc.rect(x, doc.y, CONTENT_WIDTH, headerHeight).fill(brandColor);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text("ITEM", x, doc.y + 13, {
    width: numberWidth,
    align: "center",
  });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text("ENTREGA", x + numberWidth + 14, doc.y + 13, {
    width: serviceWidth - 28,
  });
  doc.y += headerHeight;
}

async function drawPortfolio(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  if (!data.portfolio.length) return;
  ensureSpace(doc, 200);
  sectionTitle(doc, "Portfólio relacionado", "Prova visual", data.brandColor);

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
      doc.image(image, x + 10, y + 10, { fit: [cardWidth - 20, 78], align: "center", valign: "center" });
    } else {
      doc.roundedRect(x + 10, y + 10, cardWidth - 20, 78, 6).fill("#E0F2FE");
      doc.fillColor(data.brandColor).font("Helvetica-Bold").fontSize(12).text(item.category || "Portfólio", x + 10, y + 43, {
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

function drawTestimonials(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  if (!data.testimonials.length) return;
  ensureSpace(doc, 140);
  sectionTitle(doc, "Depoimentos", "Prova social", data.brandColor);

  data.testimonials.forEach((item) => {
    const quote = `"${item.quote}"`;
    const height = Math.max(64, doc.heightOfString(quote, { width: CONTENT_WIDTH - 42, lineGap: 3 }) + 38);
    ensureSpace(doc, height + 12);
    doc.roundedRect(MARGIN, doc.y + 8, CONTENT_WIDTH, height, 8).fill(SOFT);
    doc.rect(MARGIN, doc.y + 8, 4, height).fill(data.brandColor);
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

function drawDecision(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  ensureSpace(doc, 120);
  const y = doc.y + 8;
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 104, 8).fill(data.brandSecondaryColor);
  doc.rect(MARGIN, y, 6, 104).fill(data.brandColor);
  doc.fillColor("#BFDBFE").font("Helvetica-Bold").fontSize(8).text("STATUS DA PROPOSTA", MARGIN + 18, y + 18);
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

function drawFooter(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  const pageRange = doc.bufferedPageRange();
  for (let index = pageRange.start; index < pageRange.start + pageRange.count; index++) {
    doc.switchToPage(index);
    const y = PAGE.height - 92;
    doc.rect(MARGIN, y, CONTENT_WIDTH, 1).fill(LINE);
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text("CONTATO", MARGIN, y + 14);
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

function sectionTitle(doc: PDFKit.PDFDocument, title: string, eyebrow: string, color = "#2563EB") {
  ensureSpace(doc, 70);
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

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (doc.y + needed < PAGE_BOTTOM) return;
  doc.addPage();
  doc.y = MARGIN;
}

async function readImageFromUrl(url: string) {
  if (!url) return null;

  if (url.startsWith("/api/uploads/")) {
    const filename = path.basename(url);
    return readLocalUploadFile(filename);
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) return null;
      return Buffer.from(await response.arrayBuffer());
    } catch {
      return null;
    }
  }

  return null;
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
