import path from "node:path";
import PDFDocument from "pdfkit";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readLocalFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 44;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

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
  doc.rect(0, 0, PAGE.width, 218).fill(data.brandSecondaryColor);
  doc.rect(0, 0, PAGE.width, 10).fill(data.brandColor);
  doc.rect(0, 10, 8, 208).fill(data.brandAccentColor);

  const logo = await readImageFromUrl(data.logoUrl);
  if (logo) {
    doc.roundedRect(MARGIN, 34, 48, 48, 9).fill("#ffffff");
    doc.image(logo, MARGIN + 6, 40, { fit: [36, 36] });
  } else {
    doc.roundedRect(MARGIN, 34, 48, 48, 9).fill(data.brandColor);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(16).text(initials(data.brandName), MARGIN, 50, {
      align: "center",
      width: 48,
    });
  }

  doc.fillColor("#BFDBFE").font("Helvetica-Bold").fontSize(8).text("PROPOSTA COMERCIAL", MARGIN + 62, 37, {
    characterSpacing: 1.1,
  });
  doc.fillColor("#ffffff").fontSize(14).text(data.brandName, MARGIN + 62, 52, {
    width: 238,
    height: 34,
    ellipsis: true,
  });

  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(30).text(`Proposta para ${data.clientName}`, MARGIN, 108, {
    width: 310,
    height: 76,
    lineGap: 1,
    ellipsis: true,
  });
  doc.fillColor("#CBD5E1").font("Helvetica").fontSize(10).text(
    data.brandBio || `Preparada por ${data.ownerName} com escopo, investimento, prazo e aceite em um unico documento.`,
    MARGIN,
    178,
    { width: 315, height: 32, lineGap: 3, ellipsis: true },
  );

  doc.roundedRect(374, 54, 158, 116, 10).fill("#ffffff");
  doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text("INVESTIMENTO", 392, 75);
  doc.fillColor("#0F172A").fontSize(24).text(data.price, 392, 94, { width: 122, height: 30, ellipsis: true });
  doc.fillColor(data.brandColor).fontSize(9).text(labelStatus(data.status), 392, 132, { width: 122 });
  doc.fillColor("#64748B").font("Helvetica").fontSize(7.5).text(data.publicUrl, 392, 149, {
    width: 122,
    height: 12,
    ellipsis: true,
  });
}

function drawSummary(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  doc.y = 258;
  sectionTitle(doc, "Resumo da proposta", "Informacoes principais");

  const items: Array<[string, string]> = [
    ["Servico", data.serviceName],
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
    doc.roundedRect(x, y, cardWidth, cardHeight, 10).fillAndStroke("#F8FAFC", "#E2E8F0");
    doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), x + 14, y + 13);
    doc.fillColor("#0F172A").fontSize(12).text(value, x + 14, y + 30, {
      width: cardWidth - 28,
      ellipsis: true,
    });
  });

  doc.y = startY + cardHeight * 2 + 28;
}

function drawScope(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  ensureSpace(doc, 145);
  sectionTitle(doc, "Escopo incluso", "Entregaveis");

  const items = data.included.length ? data.included : ["Servico conforme combinado."];
  items.forEach((item) => {
    ensureSpace(doc, 28);
    const y = doc.y + 2;
    doc.circle(MARGIN + 8, y + 7, 7).fill(data.brandColor);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(7).text("OK", MARGIN + 2, y + 4, { width: 13, align: "center" });
    doc.fillColor("#334155").font("Helvetica").fontSize(11).text(item, MARGIN + 28, y, {
      width: CONTENT_WIDTH - 28,
      lineGap: 3,
    });
    doc.moveDown(0.45);
  });
}

function drawNotes(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  if (!data.notes) return;
  ensureSpace(doc, 105);
  sectionTitle(doc, "Observacoes", "Condicoes");
  const height = Math.max(68, doc.heightOfString(data.notes, { width: CONTENT_WIDTH - 28, lineGap: 4 }) + 28);
  ensureSpace(doc, height + 8);
  doc.roundedRect(MARGIN, doc.y + 8, CONTENT_WIDTH, height, 10).fill("#F8FAFC");
  doc.fillColor("#475569").font("Helvetica").fontSize(10.5).text(data.notes, MARGIN + 14, doc.y + 22, {
    width: CONTENT_WIDTH - 28,
    lineGap: 4,
  });
  doc.y += height + 18;
}

async function drawPortfolio(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  if (!data.portfolio.length) return;
  ensureSpace(doc, 200);
  sectionTitle(doc, "Portfolio relacionado", "Prova visual");

  const cardWidth = (CONTENT_WIDTH - 18) / 2;
  const cardHeight = 125;

  for (let index = 0; index < data.portfolio.length; index++) {
    const item = data.portfolio[index];
    if (index % 2 === 0) ensureSpace(doc, cardHeight + 18);
    const x = MARGIN + (index % 2) * (cardWidth + 18);
    const y = doc.y + Math.floor((index % 2) / 2) * cardHeight;

    doc.roundedRect(x, y, cardWidth, cardHeight, 10).fillAndStroke("#FFFFFF", "#E2E8F0");
    const image = await readImageFromUrl(item.imageUrl || "");
    if (image) {
      doc.image(image, x + 10, y + 10, { fit: [cardWidth - 20, 72], align: "center", valign: "center" });
    } else {
      doc.roundedRect(x + 10, y + 10, cardWidth - 20, 72, 8).fill("#E0F2FE");
      doc.fillColor(data.brandColor).font("Helvetica-Bold").fontSize(12).text(item.category || "Portfolio", x + 10, y + 40, {
        align: "center",
        width: cardWidth - 20,
      });
    }
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(11).text(item.title, x + 12, y + 91, { width: cardWidth - 24 });
    doc.fillColor("#64748B").font("Helvetica").fontSize(9).text(item.category || "Trabalho anterior", x + 12, y + 107, {
      width: cardWidth - 24,
    });

    if (index % 2 === 1 || index === data.portfolio.length - 1) doc.y = y + cardHeight + 16;
  }
}

function drawTestimonials(doc: PDFKit.PDFDocument, data: ProposalPdfData) {
  if (!data.testimonials.length) return;
  ensureSpace(doc, 140);
  sectionTitle(doc, "Depoimentos", "Prova social");

  data.testimonials.forEach((item) => {
    const quote = `"${item.quote}"`;
    const height = Math.max(64, doc.heightOfString(quote, { width: CONTENT_WIDTH - 42, lineGap: 3 }) + 38);
    ensureSpace(doc, height + 12);
    doc.roundedRect(MARGIN, doc.y + 8, CONTENT_WIDTH, height, 10).fill("#F8FAFC");
    doc.rect(MARGIN, doc.y + 8, 4, height).fill(data.brandColor);
    doc.fillColor("#475569").font("Helvetica").fontSize(10).text(quote, MARGIN + 18, doc.y + 22, {
      width: CONTENT_WIDTH - 42,
      lineGap: 3,
    });
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(9.5).text(
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
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 100, 12).fill(data.brandSecondaryColor);
  doc.rect(MARGIN, y, 6, 100).fill(data.brandColor);
  doc.fillColor("#BFDBFE").font("Helvetica-Bold").fontSize(8).text("STATUS DA PROPOSTA", MARGIN + 18, y + 18);
  doc.fillColor("#FFFFFF").fontSize(18).text(labelStatus(data.status), MARGIN + 18, y + 34);

  let detail = "Para aceitar, acesse o link da proposta e confirme pelo botao de aceite.";
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
    doc.rect(MARGIN, y, CONTENT_WIDTH, 1).fill("#E2E8F0");
    doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text("CONTATO", MARGIN, y + 14);
    const contacts = [
      data.brandEmail ? `E-mail: ${data.brandEmail}` : "",
      data.brandWhatsapp ? `WhatsApp: ${data.brandWhatsapp}` : "",
      data.brandInstagram ? `Instagram: ${data.brandInstagram}` : "",
      data.brandWebsite ? `Site: ${data.brandWebsite}` : "",
    ].filter(Boolean);
    doc.fillColor("#0F172A").font("Helvetica").fontSize(8.5).text(contacts.join("   |   "), MARGIN, y + 28, {
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

function sectionTitle(doc: PDFKit.PDFDocument, title: string, eyebrow: string) {
  ensureSpace(doc, 70);
  doc.fillColor("#2563EB").font("Helvetica-Bold").fontSize(8).text(eyebrow.toUpperCase(), MARGIN, doc.y, {
    characterSpacing: 0.8,
  });
  doc.moveDown(0.25);
  doc.fillColor("#0F172A").fontSize(18).text(title, { width: CONTENT_WIDTH });
  doc.moveDown(0.4);
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
    return readLocalFile(filename);
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
