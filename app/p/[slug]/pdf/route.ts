import path from "node:path";
import PDFDocument from "pdfkit";
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
  drawNotes(doc, data);
  await drawPortfolio(doc, data);
  drawTestimonials(doc, data);
  drawDecision(doc, data);
  drawFooter(doc, data);
  drawPageNumbers(doc);
}

async function drawCover(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  doc.rect(0, 0, PAGE.width, 244).fill(data.brandSecondaryColor);
  doc.rect(0, 0, PAGE.width, 8).fill(data.brandColor);
  doc.rect(PAGE.width - 118, 8, 118, 236).fill(data.brandColor);
  doc.save().opacity(0.22).rect(PAGE.width - 86, 8, 86, 236).fill(data.brandAccentColor).restore();

  const logo = await readImageFromUrl(data.logoUrl);
  if (logo) {
    doc.roundedRect(MARGIN, 34, 52, 52, 8).fill("#FFFFFF");
    doc.image(logo, MARGIN + 7, 41, { fit: [38, 38] });
  } else {
    doc.roundedRect(MARGIN, 34, 52, 52, 8).fill(data.brandColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(17).text(initials(data.brandName), MARGIN, 52, {
      align: "center",
      width: 52,
    });
  }

  doc.fillColor("#BFDBFE").font("Helvetica-Bold").fontSize(8).text("PROPOSTA COMERCIAL", MARGIN + 66, 38, {
    characterSpacing: 1.1,
  });
  doc.fillColor("#FFFFFF").fontSize(14).text(data.brandName, MARGIN + 66, 54, {
    width: 246,
    height: 34,
    ellipsis: true,
  });

  drawStatusPill(doc, data.status, PAGE.width - 192, 38, 118, data.brandColor);

  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(31).text(`Proposta para ${data.clientName}`, MARGIN, 112, {
    width: 338,
    height: 78,
    lineGap: 1,
    ellipsis: true,
  });
  doc.fillColor("#CBD5E1").font("Helvetica").fontSize(10.5).text(
    data.brandBio || `Preparada por ${data.ownerName} com escopo, investimento, prazo e aceite em um único documento.`,
    MARGIN,
    190,
    { width: 338, height: 36, lineGap: 3, ellipsis: true },
  );

  doc.roundedRect(366, 102, 172, 118, 8).fill("#FFFFFF");
  doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text("INVESTIMENTO", 384, 124, {
    characterSpacing: 0.7,
  });
  doc.fillColor(INK).fontSize(25).text(data.price, 384, 143, { width: 136, height: 32, ellipsis: true });
  doc.moveTo(384, 184).lineTo(520, 184).strokeColor(LINE).lineWidth(1).stroke();
  doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(data.publicUrl, 384, 196, {
    width: 136,
    height: 11,
    ellipsis: true,
  });
}

function drawSummary(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  doc.y = 278;
  sectionTitle(doc, "Resumo da proposta", "Informações principais", data.brandColor);

  const items: Array<[string, string]> = [
    ["Serviço", data.serviceName],
    ["Prazo", data.deadline],
    ["Pagamento", data.payment],
    ["Validade", data.validUntil],
  ];

  const cardWidth = (CONTENT_WIDTH - 14) / 2;
  const cardHeight = 62;
  const startY = doc.y + 10;

  items.forEach(([label, value], index) => {
    const x = MARGIN + (index % 2) * (cardWidth + 14);
    const y = startY + Math.floor(index / 2) * (cardHeight + 14);
    doc.roundedRect(x, y, cardWidth, cardHeight, 8).fillAndStroke(SOFT, LINE);
    doc.rect(x, y, 4, cardHeight).fill(data.brandColor);
    doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), x + 14, y + 13);
    doc.fillColor(INK).fontSize(12).text(value || "A combinar", x + 14, y + 30, {
      width: cardWidth - 28,
      ellipsis: true,
    });
  });

  doc.y = startY + cardHeight * 2 + 28;
}

function drawScope(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  ensureSpace(doc, 170);
  sectionTitle(doc, "Serviços inclusos", "Tabela de escopo", data.brandColor);

  const items = data.included.length ? data.included : ["Serviço conforme combinado."];
  drawServicesTable(doc, items, data.brandColor);
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

function drawServicesTable(doc: PDFKit.PDFDocument, items: string[], brandColor: string) {
  const numberWidth = 54;
  const serviceWidth = 126;
  const descriptionWidth = CONTENT_WIDTH - numberWidth - serviceWidth;
  const rowX = MARGIN;

  drawServicesTableHeader(doc, brandColor, rowX, numberWidth, serviceWidth, descriptionWidth);

  items.forEach((item, index) => {
    const descriptionHeight = doc.heightOfString(item, {
      width: descriptionWidth - 24,
      lineGap: 3,
    });
    const rowHeight = Math.max(46, descriptionHeight + 26);

    if (doc.y + rowHeight > PAGE.height - 104) {
      doc.addPage();
      doc.y = MARGIN;
      drawServicesTableHeader(doc, brandColor, rowX, numberWidth, serviceWidth, descriptionWidth);
    }

    const y = doc.y;
    doc.rect(rowX, y, CONTENT_WIDTH, rowHeight).fill(index % 2 === 0 ? "#FFFFFF" : SOFT);
    doc.rect(rowX, y, CONTENT_WIDTH, 1).fill(LINE);
    doc.rect(rowX + numberWidth, y, 1, rowHeight).fill(LINE);
    doc.rect(rowX + numberWidth + serviceWidth, y, 1, rowHeight).fill(LINE);

    doc.fillColor(brandColor).font("Helvetica-Bold").fontSize(10).text(String(index + 1).padStart(2, "0"), rowX + 16, y + 16, {
      width: numberWidth - 24,
    });
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10.5).text(index === 0 ? "Serviço principal" : `Serviço ${index + 1}`, rowX + numberWidth + 14, y + 15, {
      width: serviceWidth - 28,
      height: rowHeight - 20,
      ellipsis: true,
    });
    doc.fillColor("#334155").font("Helvetica").fontSize(10.5).text(item, rowX + numberWidth + serviceWidth + 12, y + 14, {
      width: descriptionWidth - 24,
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
  descriptionWidth: number,
) {
  const headerHeight = 34;
  doc.roundedRect(x, doc.y, CONTENT_WIDTH, headerHeight, 8).fill(brandColor);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text("ITEM", x + 16, doc.y + 13, {
    width: numberWidth - 24,
  });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text("SERVIÇO", x + numberWidth + 14, doc.y + 13, {
    width: serviceWidth - 28,
  });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text("DESCRIÇÃO", x + numberWidth + serviceWidth + 12, doc.y + 13, {
    width: descriptionWidth - 24,
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
  if (doc.y + needed < PAGE.height - 104) return;
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

function initials(value: string) {
  const words = value.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word[0]?.toUpperCase()).join("") || "FP";
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
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
