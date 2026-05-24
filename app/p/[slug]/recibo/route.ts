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

  if (!proposal || proposal.status !== "accepted" || proposal.paymentStatus !== "paid") notFound();

  const brand = proposal.user.brandProfile;
  const businessName = brand?.businessName || proposal.user.name;
  const paidAt = proposal.paymentPaidAt || proposal.paymentUpdatedAt || new Date();
  const pdf = await createPaymentReceiptPdf({
    acceptedAt: proposal.acceptedAt ? formatDateTime(proposal.acceptedAt) : "Aceite registrado",
    businessName,
    businessEmail: brand?.email || proposal.user.email,
    businessWhatsapp: brand?.whatsapp || "",
    clientEmail: proposal.acceptedEmail || proposal.clientEmail || "",
    clientName: proposal.acceptedBy || proposal.clientName,
    createdAt: formatDateTime(new Date()),
    method: paymentMethodLabel(proposal.paymentMethod || proposal.paymentProvider || proposal.checkoutMode),
    paidAt: formatDateTime(paidAt),
    primaryColor: normalizeColor(brand?.primaryColor || "#16A34A"),
    receiptCode: proposal.publicSlug,
    serviceName: proposal.serviceName,
    total: money.format(proposal.price),
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slugBase(`recibo-${proposal.clientName}-${proposal.serviceName}`)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

function createPaymentReceiptPdf(data: {
  acceptedAt: string;
  businessName: string;
  businessEmail: string;
  businessWhatsapp: string;
  clientEmail: string;
  clientName: string;
  createdAt: string;
  method: string;
  paidAt: string;
  primaryColor: string;
  receiptCode: string;
  serviceName: string;
  total: string;
}) {
  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.rect(0, 0, 595.28, 841.89).fill("#F8FAFC");
    doc.roundedRect(32, 30, 531, 782, 18).fill("#FFFFFF");
    doc.rect(32, 30, 531, 128).fill(data.primaryColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(11).text("RECIBO DE PAGAMENTO", 58, 58, { characterSpacing: 1.8 });
    doc.fontSize(26).text(data.businessName, 58, 82, { width: 340 });
    doc.font("Helvetica").fontSize(9).fillColor("#FFFFFF").text("Documento gerado pelo FechaPro", 58, 120);

    doc.roundedRect(398, 58, 122, 58, 10).fill("#FFFFFF");
    doc.fillColor(data.primaryColor).font("Helvetica-Bold").fontSize(9).text("CODIGO", 414, 72);
    doc.fillColor("#0F172A").fontSize(12).text(data.receiptCode, 414, 88, { width: 90, ellipsis: true });

    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(13).text("Valor recebido", 58, 194);
    doc.fontSize(34).text(data.total, 58, 216);
    doc.fillColor("#475569").font("Helvetica").fontSize(11).text(
      `Recebemos de ${data.clientName} o valor acima referente ao servico "${data.serviceName}".`,
      58,
      262,
      { width: 468, lineGap: 4 },
    );

    doc.roundedRect(58, 314, 468, 84, 12).fill("#ECFDF5");
    doc.fillColor("#166534").font("Helvetica-Bold").fontSize(10).text("PAGAMENTO CONFIRMADO", 78, 334, { characterSpacing: 0.8 });
    doc.fillColor("#0F172A").fontSize(16).text(data.paidAt, 78, 354);
    doc.fillColor("#166534").font("Helvetica").fontSize(10).text(`Forma: ${data.method}`, 78, 378);

    infoCard(doc, 58, 430, "Cliente", data.clientName, data.clientEmail || "E-mail nao informado");
    infoCard(doc, 302, 430, "Servico", data.serviceName, `Aceite: ${data.acceptedAt}`);
    infoCard(doc, 58, 534, "Recebedor", data.businessName, contactLine(data.businessEmail, data.businessWhatsapp));
    infoCard(doc, 302, 534, "Emissao", data.createdAt, "Recibo vinculado a proposta aceita");

    doc.strokeColor("#CBD5E1").moveTo(90, 696).lineTo(286, 696).stroke();
    doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(10).text(data.businessName, 90, 708, { width: 196, align: "center" });
    doc.fillColor("#64748B").font("Helvetica").fontSize(9).text("Assinatura do recebedor", 90, 724, { width: 196, align: "center" });

    doc.fillColor("#64748B").fontSize(9).text(
      "Este recibo foi gerado automaticamente a partir da proposta aceita e do pagamento marcado como confirmado. Guarde este documento junto aos demais registros da contratacao.",
      58,
      760,
      { width: 468, align: "center" },
    );
    doc.end();
  });
}

function infoCard(doc: PDFKit.PDFDocument, x: number, y: number, title: string, value: string, detail: string) {
  doc.roundedRect(x, y, 224, 78, 10).fill("#F8FAFC").stroke("#E2E8F0");
  doc.fillColor("#64748B").font("Helvetica-Bold").fontSize(8).text(title.toUpperCase(), x + 16, y + 15, { characterSpacing: 0.7 });
  doc.fillColor("#0F172A").fontSize(12).text(value, x + 16, y + 32, { width: 192, ellipsis: true });
  doc.fillColor("#64748B").font("Helvetica").fontSize(9).text(detail, x + 16, y + 52, { width: 192, ellipsis: true });
}

function contactLine(email: string, whatsapp: string) {
  return [email, whatsapp].filter(Boolean).join(" | ") || "Contato nao informado";
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

function paymentMethodLabel(method?: string | null) {
  const labels: Record<string, string> = {
    account_money: "Saldo Mercado Pago",
    bank_transfer: "PIX",
    credit_card: "Cartao de credito",
    debit_card: "Cartao de debito",
    manual: "Pagamento fora do sistema",
    mercadopago: "Mercado Pago",
    pix: "PIX",
  };
  return labels[method || ""] || "Pagamento confirmado";
}
