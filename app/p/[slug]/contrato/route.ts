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
  const acceptedAt = proposal.acceptedAt || new Date();
  const pdf = await createContractPdf({
    acceptedAtFull: proposal.acceptedAt ? formatContractDateTime(acceptedAt) : "Aceite digital registrado",
    acceptedAtShort: proposal.acceptedAt ? formatShortDateTime(acceptedAt) : "Aceite registrado",
    acceptedBy: proposal.acceptedBy || proposal.clientName,
    acceptedEmail: proposal.acceptedEmail || proposal.clientEmail || "",
    businessEmail: brand?.email || proposal.user.email,
    businessName,
    businessWhatsapp: brand?.whatsapp || "",
    clientName: proposal.clientName,
    createdAtFull: formatContractDateTime(new Date()),
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
    const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    drawCover(doc, data);
    drawContractBody(doc, data);
    drawContractFooter(doc, data);
    doc.end();
  });
}

function drawCover(doc: PDFKit.PDFDocument, data: ContractPdfData) {
  doc.rect(0, 0, 595.28, 841.89).fill("#F1F5F9");
  doc.roundedRect(32, 30, 531, 782, 16).fill("#FFFFFF");

  // Header com cor primária
  doc.rect(32, 30, 531, 152).fill(data.primaryColor);
  // Faixa de destaque na base do header
  doc.rect(32, 178, 531, 4).fill("#020617");
  // Elemento decorativo: círculos sutis no canto superior direito
  doc.save();
  doc.opacity(0.14);
  doc.circle(528, 54, 46).fill("#FFFFFF");
  doc.circle(555, 110, 26).fill("#FFFFFF");
  doc.restore();

  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9).text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS", 58, 58, { characterSpacing: 1.8, width: 338, ellipsis: true });
  doc.fontSize(26).text(data.serviceName, 58, 84, { width: 338, height: 72, lineGap: 2, ellipsis: true });

  // Badge de aceite digital
  doc.roundedRect(406, 58, 120, 72, 10).fill("#FFFFFF");
  doc.roundedRect(406, 58, 120, 5, 3).fill(data.primaryColor);
  doc.fillColor(data.primaryColor).font("Helvetica-Bold").fontSize(7.5).text("ACEITE DIGITAL", 418, 74, { characterSpacing: 1, width: 96, align: "center" });
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(9.5).text(data.acceptedAtShort, 418, 92, { width: 96, height: 28, align: "center", ellipsis: true });

  // Seção: Partes
  doc.roundedRect(58, 202, 3, 20, 1.5).fill(data.primaryColor);
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(13).text("Partes", 68, 204);
  infoCard(doc, 58, 232, "Contratada", data.businessName, contactLine(data.businessEmail, data.businessWhatsapp), data.primaryColor);
  infoCard(doc, 296, 232, "Contratante", data.acceptedBy, data.acceptedEmail || data.clientName, data.primaryColor);

  // Seção: Condições comerciais
  doc.roundedRect(58, 360, 3, 20, 1.5).fill(data.primaryColor);
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(13).text("Condições comerciais", 68, 362);
  infoCard(doc, 58, 390, "Investimento", data.total, `Pagamento: ${data.payment}`, data.primaryColor);
  infoCard(doc, 296, 390, "Prazo", data.deadline, `Validade da proposta: ${data.validUntil}`, data.primaryColor);

  // Registro do aceite
  doc.roundedRect(58, 522, 468, 96, 12).fill("#ECFDF5");
  doc.roundedRect(58, 522, 4, 96, 3).fill("#166534");
  doc.fillColor("#166534").font("Helvetica-Bold").fontSize(8.5).text("REGISTRO DO ACEITE DIGITAL", 78, 540, { characterSpacing: 0.8 });
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(12).text(`${data.acceptedBy} confirmou o aceite digital desta contratação em ${data.acceptedAtFull}.`, 78, 560, {
    width: 434,
    lineGap: 4,
  });
  doc.fillColor("#64748B").font("Helvetica").fontSize(8.5).text(`Código da proposta: ${data.proposalCode}`, 78, 596, { width: 434, ellipsis: true });

  // Rodapé da capa
  doc.roundedRect(58, 648, 468, 1, 1).fill("#E2E8F0");
  doc.fillColor("#94A3B8").font("Helvetica").fontSize(8.5).text(
    "Documento gerado automaticamente a partir da proposta aceita no FechaPro.",
    58, 664, { width: 468, align: "center" },
  );
}

function drawContractBody(doc: PDFKit.PDFDocument, data: ContractPdfData) {
  doc.addPage();
  // Cabeçalho da página de termos
  doc.rect(0, 0, 595.28, 841.89).fill("#FFFFFF");
  doc.rect(0, 0, 595.28, 6).fill(data.primaryColor);
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(17).text("Termos do contrato", 48, 38);
  doc.fillColor("#64748B").font("Helvetica").fontSize(9.5).text(`Emitido em ${data.createdAtFull}`, 48, 62);
  doc.rect(48, 80, 499, 1).fill("#E2E8F0");

  let y = 104;
  y = drawClause(doc, y, "1. Partes", `${data.businessName}, doravante denominada Contratada, e ${data.acceptedBy}, doravante denominado(a) Contratante, firmam este contrato a partir do aceite digital da proposta.`, data.primaryColor);
  y = drawClause(doc, y, "2. Objeto", `A Contratada prestará ao Contratante o serviço "${data.serviceName}", conforme o escopo descrito neste contrato e na proposta aceita digitalmente.`, data.primaryColor);
  y = drawListClause(doc, y, "3. Escopo contratado", data.included, data.primaryColor);
  y = drawClause(doc, y, "4. Investimento e pagamento", `O investimento total acordado entre as partes é de ${data.total}. A forma ou condição de pagamento registrada na proposta foi: ${data.payment}. Valores, parcelas, vencimentos ou sinais não informados neste documento seguem o combinado registrado entre as partes.`, data.primaryColor);
  y = drawClause(doc, y, "5. Prazo de execução", `O prazo combinado para execução ou entrega do serviço é: ${data.deadline}. A contagem do prazo considera o recebimento das informações, materiais, aprovações e pagamentos necessários para o andamento do trabalho.`, data.primaryColor);
  y = drawClause(doc, y, "6. Responsabilidades do contratante", "O Contratante deverá fornecer informações verdadeiras, materiais solicitados, retornos e aprovações em tempo adequado. Atrasos nessas entregas podem alterar prazos e etapas do serviço.", data.primaryColor);
  y = drawClause(doc, y, "7. Alterações de escopo", "Pedidos não previstos no escopo contratado poderão exigir novo prazo, novo valor ou proposta complementar, mediante combinação entre as partes.", data.primaryColor);

  if (data.notes) {
    y = drawClause(doc, y, "8. Observações da proposta", data.notes, data.primaryColor);
  }

  if (data.proposalTerms) {
    y = drawClause(doc, y, data.notes ? "9. Termos comerciais" : "8. Termos comerciais", data.proposalTerms, data.primaryColor);
  }

  const acceptanceClauseNumber = data.notes && data.proposalTerms ? "10" : data.notes || data.proposalTerms ? "9" : "8";
  y = drawClause(
    doc,
    y,
    `${acceptanceClauseNumber}. Aceite digital`,
    `O aceite digital registrado por ${data.acceptedBy} em ${data.acceptedAtFull} comprova a concordância com o escopo, valor, prazo e condições comerciais apresentados na proposta identificada pelo código ${data.proposalCode}. Este documento consolida as condições aceitas e pode ser usado como registro da contratação.`,
    data.primaryColor,
  );

  drawSignatures(doc, data, y + 28);
}

function drawClause(doc: PDFKit.PDFDocument, y: number, title: string, body: string, primaryColor = "#16A34A") {
  doc.font("Helvetica").fontSize(10.5);
  const bodyHeight = doc.heightOfString(body, { width: 487, lineGap: 4 });
  const startY = ensureSpace(doc, y, 46 + bodyHeight);
  doc.roundedRect(48, startY, 3, 16, 1.5).fill(primaryColor);
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(12).text(title, 58, startY);
  doc.fillColor("#475569").font("Helvetica").fontSize(10.5).text(body, 58, startY + 20, { width: 487, lineGap: 4 });
  return doc.y + 22;
}

function drawListClause(doc: PDFKit.PDFDocument, y: number, title: string, items: string[], primaryColor = "#16A34A") {
  const startY = ensureSpace(doc, y, 58);
  doc.roundedRect(48, startY, 3, 16, 1.5).fill(primaryColor);
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(12).text(title, 58, startY);
  let itemY = startY + 22;
  for (const item of items) {
    doc.font("Helvetica").fontSize(10.5);
    const itemHeight = doc.heightOfString(item, { width: 471, lineGap: 3 });
    itemY = ensureSpace(doc, itemY, itemHeight + 12);
    doc.circle(64, itemY + 6, 3).fill(primaryColor);
    doc.fillColor("#475569").text(item, 74, itemY, { width: 471, lineGap: 3 });
    itemY = doc.y + 6;
  }
  return itemY + 16;
}

function drawSignatures(doc: PDFKit.PDFDocument, data: ContractPdfData, y: number) {
  const signatureY = ensureSpace(doc, Math.max(y, 630), 120);

  doc.strokeColor("#CBD5E1").moveTo(70, signatureY).lineTo(260, signatureY).stroke();
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(10).text(data.businessName, 70, signatureY + 12, { width: 190, align: "center" });
  doc.fillColor("#64748B").font("Helvetica").fontSize(9).text("Contratada", 70, signatureY + 28, { width: 190, align: "center" });

  doc.roundedRect(326, signatureY - 18, 208, 72, 10).fill("#ECFDF5").stroke("#BBF7D0");
  doc.fillColor("#166534").font("Helvetica-Bold").fontSize(8).text("ASSINATURA DIGITAL DO CONTRATANTE", 342, signatureY - 2, {
    width: 176,
    align: "center",
    characterSpacing: 0.5,
  });
  doc.fillColor("#0F172A").fontSize(10).text(data.acceptedBy, 342, signatureY + 17, { width: 176, align: "center" });
  doc.fillColor("#64748B").font("Helvetica").fontSize(8.5).text(`Aceito digitalmente em ${data.acceptedAtFull}`, 342, signatureY + 34, {
    width: 176,
    align: "center",
  });
}

function drawContractFooter(doc: PDFKit.PDFDocument, data: ContractPdfData) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    if (i === range.start) continue;
    doc.switchToPage(i);
    const footerY = 808;
    doc.rect(48, footerY - 6, 499, 1).fill("#E2E8F0");
    doc.fillColor("#94A3B8").font("Helvetica").fontSize(7.5).text(
      `${data.businessName}  ·  Cód. ${data.proposalCode}`,
      48, footerY + 4, { width: 380, ellipsis: true },
    );
    doc.fillColor("#94A3B8").font("Helvetica").fontSize(7.5).text(
      `${i + 1} / ${range.count}`,
      48, footerY + 4, { width: 499, align: "right" },
    );
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, y: number, height: number) {
  if (y + height <= 790) return y;
  doc.addPage();
  doc.y = 54;
  return 54;
}

function infoCard(doc: PDFKit.PDFDocument, x: number, y: number, title: string, value: string, detail: string, primaryColor = "#16A34A") {
  doc.roundedRect(x, y, 228, 90, 10).fill("#F8FAFC").stroke("#E2E8F0");
  doc.roundedRect(x, y + 18, 4, 54, 2).fill(primaryColor);
  doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(7.5).text(title.toUpperCase(), x + 20, y + 16, { characterSpacing: 0.8, width: 196, ellipsis: true });
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(12).text(value, x + 20, y + 32, { width: 196, height: 18, ellipsis: true });
  doc.fillColor("#64748B").font("Helvetica").fontSize(8.5).text(detail, x + 20, y + 58, { width: 196, height: 14, ellipsis: true });
}

function contactLine(email: string, whatsapp: string) {
  return [email, whatsapp].filter(Boolean).join(" | ") || "Contato não informado";
}

function formatDateOnly(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatShortDateTime(date: Date) {
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

function formatContractDateTime(date: Date) {
  const datePart = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  const timePart = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return `${datePart}, às ${timePart} (horário de Brasília)`;
}

function normalizeColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#16A34A";
}

type ContractPdfData = {
  acceptedAtFull: string;
  acceptedAtShort: string;
  acceptedBy: string;
  acceptedEmail: string;
  businessEmail: string;
  businessName: string;
  businessWhatsapp: string;
  clientName: string;
  createdAtFull: string;
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
