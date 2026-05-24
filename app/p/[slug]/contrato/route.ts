import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { notFound } from "next/navigation";
import { slugBase } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  if (!proposal || proposal.status !== "accepted") notFound();

  const brand = proposal.user.brandProfile;
  const businessName = brand?.businessName || proposal.user.name;
  const pdf = await createContractPdf({
    acceptedAt: proposal.acceptedAt ? formatDateTime(proposal.acceptedAt) : "Aceite registrado",
    acceptedBy: proposal.acceptedBy || proposal.clientName,
    acceptedEmail: proposal.acceptedEmail || proposal.clientEmail || "",
    businessEmail: brand?.email || proposal.user.email,
    businessName,
    businessWhatsapp: brand?.whatsapp || "",
    clientName: proposal.clientName,
    createdAt: formatDateTime(new Date()),
    deadline: proposal.deadline,
    included: proposal.included.length ? proposal.included : ["Servico conforme combinado entre as partes."],
    notes: proposal.notes || "",
    payment: proposal.payment || "A combinar",
    primaryColor: normalizeColor(brand?.primaryColor || "#16A34A"),
    proposalCode: proposal.publicSlug,
    proposalTerms: brand?.proposalTerms || "",
    serviceName: proposal.serviceName,
    total: money.format(proposal.price),
    validUntil: proposal.validUntil ? formatDateOnly(proposal.validUntil) : "A combinar",
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slugBase(`contrato-${proposal.clientName}-${proposal.serviceName}`)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

function createContractPdf(data: ContractPdfData) {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    drawCover(doc, data);
    drawContractBody(doc, data);
    doc.end();
  });
}

function drawCover(doc: PDFKit.PDFDocument, data: ContractPdfData) {
  doc.rect(0, 0, 595.28, 841.89).fill("#F8FAFC");
  doc.roundedRect(32, 30, 531, 782, 18).fill("#FFFFFF");
  doc.rect(32, 30, 531, 148).fill(data.primaryColor);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(11).text("CONTRATO DE PRESTACAO DE SERVICOS", 58, 62, { characterSpacing: 1.6 });
  doc.fontSize(27).text(data.serviceName, 58, 88, { width: 340, height: 70, ellipsis: true });

  doc.roundedRect(404, 62, 116, 68, 10).fill("#FFFFFF");
  doc.fillColor(data.primaryColor).font("Helvetica-Bold").fontSize(8).text("ACEITE DIGITAL", 418, 78, { characterSpacing: 0.8 });
  doc.fillColor("#0F172A").fontSize(10).text(data.acceptedAt, 418, 96, { width: 88, height: 28, ellipsis: true });

  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(14).text("Partes", 58, 218);
  infoCard(doc, 58, 246, "Contratada", data.businessName, contactLine(data.businessEmail, data.businessWhatsapp));
  infoCard(doc, 302, 246, "Contratante", data.acceptedBy, data.acceptedEmail || data.clientName);

  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(14).text("Condicoes comerciais", 58, 380);
  infoCard(doc, 58, 408, "Investimento", data.total, `Pagamento: ${data.payment}`);
  infoCard(doc, 302, 408, "Prazo", data.deadline, `Validade da proposta: ${data.validUntil}`);

  doc.roundedRect(58, 550, 468, 88, 12).fill("#ECFDF5");
  doc.fillColor("#166534").font("Helvetica-Bold").fontSize(10).text("REGISTRO DO ACEITE", 78, 572, { characterSpacing: 0.8 });
  doc.fillColor("#0F172A").fontSize(13).text(`${data.acceptedBy} confirmou o aceite digital desta contratação em ${data.acceptedAt}.`, 78, 594, {
    width: 428,
    lineGap: 4,
  });
  doc.fillColor("#64748B").font("Helvetica").fontSize(9).text(`Codigo da proposta: ${data.proposalCode}`, 78, 622, { width: 428, ellipsis: true });

  doc.fillColor("#64748B").fontSize(9).text(
    "Documento gerado automaticamente a partir da proposta aceita no FechaPro.",
    58,
    748,
    { width: 468, align: "center" },
  );
}

function drawContractBody(doc: PDFKit.PDFDocument, data: ContractPdfData) {
  doc.addPage();
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(18).text("Termos do contrato", 48, 54);
  doc.fillColor("#64748B").font("Helvetica").fontSize(10).text(`Emitido em ${data.createdAt}`, 48, 80);

  let y = 122;
  y = drawClause(doc, y, "1. Objeto", `A contratada prestara ao contratante o servico "${data.serviceName}", conforme o escopo descrito neste contrato e na proposta aceita digitalmente.`);
  y = drawListClause(doc, y, "2. Escopo contratado", data.included);
  y = drawClause(doc, y, "3. Investimento e pagamento", `O investimento total acordado entre as partes e de ${data.total}. A forma ou condicao de pagamento registrada na proposta foi: ${data.payment}.`);
  y = drawClause(doc, y, "4. Prazo de execucao", `O prazo combinado para execucao ou entrega do servico e: ${data.deadline}. Esse prazo pode depender do envio de informacoes, materiais, aprovacoes ou pagamentos combinados entre as partes.`);

  if (data.notes) {
    y = drawClause(doc, y, "5. Observacoes da proposta", data.notes);
  }

  if (data.proposalTerms) {
    y = drawClause(doc, y, data.notes ? "6. Termos comerciais" : "5. Termos comerciais", data.proposalTerms);
  }

  const acceptanceClauseNumber = data.notes && data.proposalTerms ? "7" : data.notes || data.proposalTerms ? "6" : "5";
  y = drawClause(
    doc,
    y,
    `${acceptanceClauseNumber}. Aceite digital`,
    `O aceite digital registrado por ${data.acceptedBy} em ${data.acceptedAt} comprova a concordancia com o escopo, valor, prazo e condicoes comerciais apresentados na proposta identificada pelo codigo ${data.proposalCode}.`,
  );

  const signatureY = Math.max(y + 36, 650);
  doc.strokeColor("#CBD5E1").moveTo(70, signatureY).lineTo(260, signatureY).stroke();
  doc.strokeColor("#CBD5E1").moveTo(335, signatureY).lineTo(525, signatureY).stroke();
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(10).text(data.businessName, 70, signatureY + 12, { width: 190, align: "center" });
  doc.text(data.acceptedBy, 335, signatureY + 12, { width: 190, align: "center" });
  doc.fillColor("#64748B").font("Helvetica").fontSize(9).text("Contratada", 70, signatureY + 28, { width: 190, align: "center" });
  doc.text("Contratante", 335, signatureY + 28, { width: 190, align: "center" });
}

function drawClause(doc: PDFKit.PDFDocument, y: number, title: string, body: string) {
  const startY = ensureSpace(doc, y, 112);
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(12).text(title, 48, startY);
  doc.fillColor("#475569").font("Helvetica").fontSize(10.5).text(body, 48, startY + 20, { width: 499, lineGap: 4 });
  return doc.y + 22;
}

function drawListClause(doc: PDFKit.PDFDocument, y: number, title: string, items: string[]) {
  const startY = ensureSpace(doc, y, 138);
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(12).text(title, 48, startY);
  doc.fillColor("#475569").font("Helvetica").fontSize(10.5);
  let itemY = startY + 22;
  for (const item of items) {
    itemY = ensureSpace(doc, itemY, 36);
    doc.text(`- ${item}`, 58, itemY, { width: 489, lineGap: 3 });
    itemY = doc.y + 6;
  }
  return itemY + 16;
}

function ensureSpace(doc: PDFKit.PDFDocument, y: number, height: number) {
  if (y + height <= 790) return y;
  doc.addPage();
  doc.y = 54;
  return 54;
}

function infoCard(doc: PDFKit.PDFDocument, x: number, y: number, title: string, value: string, detail: string) {
  doc.roundedRect(x, y, 224, 86, 10).fill("#F8FAFC").stroke("#E2E8F0");
  doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text(title.toUpperCase(), x + 16, y + 16, { characterSpacing: 0.7 });
  doc.fillColor("#0F172A").fontSize(12).text(value, x + 16, y + 33, { width: 192, height: 18, ellipsis: true });
  doc.fillColor("#64748B").font("Helvetica").fontSize(9).text(detail, x + 16, y + 58, { width: 192, height: 14, ellipsis: true });
}

function contactLine(email: string, whatsapp: string) {
  return [email, whatsapp].filter(Boolean).join(" | ") || "Contato nao informado";
}

function formatDateOnly(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatDateTime(date: Date) {
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

function normalizeColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#16A34A";
}

type ContractPdfData = {
  acceptedAt: string;
  acceptedBy: string;
  acceptedEmail: string;
  businessEmail: string;
  businessName: string;
  businessWhatsapp: string;
  clientName: string;
  createdAt: string;
  deadline: string;
  included: string[];
  notes: string;
  payment: string;
  primaryColor: string;
  proposalCode: string;
  proposalTerms: string;
  serviceName: string;
  total: string;
  validUntil: string;
};
