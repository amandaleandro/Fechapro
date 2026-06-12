import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { notFound } from "next/navigation";
import { slugBase } from "@/lib/api";
import { canUseProposalDocuments } from "@/lib/billing-access";
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
    include: { user: { include: { brandProfile: true, subscription: true } } },
  });

  if (!proposal || proposal.status !== "accepted") notFound();
  if (!canUseProposalDocuments(proposal.user.subscription)) notFound();

  const brand = proposal.user.brandProfile;
  const businessName = brand?.businessName || proposal.user.name;
  const acceptedAt = proposal.acceptedAt || new Date();
  const pdf = await createContractPdf({
    acceptedAtFull: proposal.acceptedAt ? formatContractDateTime(acceptedAt) : "Aceite digital registrado",
    acceptedAtShort: proposal.acceptedAt ? formatShortDateTime(acceptedAt) : "Aceite registrado",
    acceptedBy: proposal.acceptedBy || proposal.clientName,
    acceptedDocument: proposal.acceptedDocument || "",
    acceptedEmail: proposal.acceptedEmail || proposal.clientEmail || "",
    acceptedIp: proposal.acceptedIp || "",
    acceptedPhone: proposal.acceptedPhone || proposal.clientPhone || "",
    acceptedSnapshotHash: proposal.acceptedSnapshotHash || "",
    acceptedUserAgent: proposal.acceptedUserAgent || "",
    acceptedContractVersion: proposal.acceptedContractVersion || "service-contract-v2",
    businessEmail: brand?.email || proposal.user.email,
    businessName,
    businessWhatsapp: brand?.whatsapp || "",
    clientName: proposal.clientName,
    createdAtFull: formatContractDateTime(new Date()),
    emittedAtFull: formatContractDateTime(proposal.createdAt),
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
  infoCard(doc, 296, 232, "Contratante", data.acceptedBy, partyDetail(data.acceptedEmail, data.acceptedDocument), data.primaryColor);

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
  doc.fillColor("#64748B").font("Helvetica").fontSize(8.5).text(`Código da proposta: ${data.proposalCode} | Versão: ${data.acceptedContractVersion}`, 78, 596, { width: 434, ellipsis: true });

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
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(17).text("Instrumento particular de prestação de serviços", 48, 38);
  doc.fillColor("#64748B").font("Helvetica").fontSize(9.5).text(`Emitido em ${data.createdAtFull}`, 48, 62);
  doc.rect(48, 80, 499, 1).fill("#E2E8F0");

  let y = 104;
  y = drawClause(doc, y, "1. Partes contratantes", `${data.businessName}, doravante denominada Contratada, e ${data.acceptedBy}, doravante denominado(a) Contratante, celebram o presente instrumento particular de prestação de serviços. As partes declaram possuir capacidade para contratar e reconhecem como suficientes, para esta contratação, os dados de identificação e contato informados na proposta aceita digitalmente sob o código ${data.proposalCode}.`, data.primaryColor);
  y = drawClause(doc, y, "2. Documentos integrantes", "Integram este contrato, para todos os fins, a proposta aceita digitalmente, o comprovante de aceite, eventuais mensagens, anexos, comprovantes de pagamento e demais registros relacionados à contratação. Em caso de divergência, prevalecerão as condições específicas aceitas na proposta, desde que não contrariem disposição expressa deste instrumento.", data.primaryColor);
  y = drawClause(doc, y, "3. Objeto", `O presente contrato tem por objeto a prestação, pela Contratada ao Contratante, do serviço "${data.serviceName}", conforme escopo, condições comerciais, prazos e demais informações constantes neste documento e na proposta aceita digitalmente.`, data.primaryColor);
  y = drawListClause(doc, y, "4. Escopo contratado", data.included, data.primaryColor);
  y = drawClause(doc, y, "5. Itens não incluídos", "Não estão incluídos no preço contratado quaisquer serviços, produtos, deslocamentos, taxas, licenças, despesas de terceiros, alterações, urgências, refações ou entregas que não estejam expressamente descritos no escopo contratado ou em termo complementar aceito pelas partes.", data.primaryColor);
  y = drawClause(doc, y, "6. Investimento, forma de pagamento e vencimentos", `Pela execução do objeto contratado, o Contratante pagará à Contratada o valor total de ${data.total}. A forma ou condição de pagamento registrada na proposta foi: ${data.payment}. Salvo ajuste expresso em sentido diverso, os pagamentos deverão ocorrer nas datas e condições aceitas, e a execução poderá ficar condicionada ao pagamento de sinal, entrada, parcela vencida ou valor previamente ajustado.`, data.primaryColor);
  y = drawClause(doc, y, "7. Prazo de execução", `O prazo estimado para execução ou entrega do serviço é: ${data.deadline}. A contagem do prazo fica condicionada ao recebimento, pela Contratada, de informações, documentos, materiais, acessos, aprovações e pagamentos necessários ao regular andamento do trabalho. Atrasos decorrentes de pendências do Contratante suspenderão a contagem do prazo pelo período correspondente e poderão exigir reprogramação da agenda de execução.`, data.primaryColor);
  y = drawClause(doc, y, "8. Obrigações da contratada", "A Contratada se obriga a executar os serviços com diligência, boa-fé, zelo técnico e observância ao escopo contratado, comunicando ao Contratante fatos relevantes que possam impactar prazos, entregas ou condições previamente acordadas. A Contratada não responde por resultados dependentes de atos de terceiros, plataformas externas, aprovações públicas, disponibilidade de sistemas ou informações fornecidas pelo Contratante.", data.primaryColor);
  y = drawClause(doc, y, "9. Obrigações do contratante", "O Contratante se obriga a fornecer informações verdadeiras e completas, disponibilizar materiais, documentos e acessos necessários, responder solicitações, validar etapas e efetuar os pagamentos nos prazos combinados. A falta de colaboração, informação, acesso, pagamento ou aprovação poderá suspender a execução, alterar o cronograma e gerar custos adicionais quando houver retrabalho ou reserva de agenda.", data.primaryColor);
  y = drawClause(doc, y, "10. Aprovações, revisões e aceite das entregas", "Quando o serviço envolver etapas de validação, o Contratante deverá analisar as entregas em prazo razoável ou no prazo informado pela Contratada. A ausência de manifestação após solicitação de aprovação poderá ser interpretada como concordância operacional para continuidade do projeto, sem prejuízo de ajustes previstos no escopo contratado.", data.primaryColor);
  y = drawClause(doc, y, "11. Alterações de escopo", "Solicitações não previstas no escopo contratado, retrabalhos decorrentes de mudança de orientação, inclusão de novas entregas ou alteração substancial das premissas iniciais dependerão de aceite prévio da Contratada e poderão exigir proposta complementar, novo prazo e/ou cobrança adicional.", data.primaryColor);
  y = drawClause(doc, y, "12. Inadimplemento e suspensão", "O atraso no pagamento ou o descumprimento de obrigação essencial por qualquer das partes autorizará a parte prejudicada a suspender a execução de suas obrigações, exigir regularização, renegociar o cronograma e cobrar valores vencidos, sem prejuízo de perdas, danos, multas, juros, correção monetária ou encargos eventualmente pactuados em documento complementar.", data.primaryColor);
  y = drawClause(doc, y, "13. Confidencialidade e proteção de dados", "As partes comprometem-se a manter sigilo sobre informações comerciais, técnicas, financeiras, estratégicas ou pessoais acessadas em razão deste contrato, utilizando-as apenas para a execução do objeto contratado. Quando houver tratamento de dados pessoais, as partes deverão observar a legislação aplicável, inclusive a Lei Geral de Proteção de Dados Pessoais, na medida de suas respectivas responsabilidades.", data.primaryColor);
  y = drawClause(doc, y, "14. Propriedade intelectual e uso de materiais", "Salvo disposição expressa em contrário, materiais, marcas, imagens, textos, arquivos, acessos e conteúdos fornecidos pelo Contratante permanecerão sob sua responsabilidade quanto à titularidade, licenças e autorizações de uso. Entregas criadas pela Contratada serão licenciadas ou transferidas ao Contratante nos limites do escopo contratado e após a quitação dos valores devidos.", data.primaryColor);
  y = drawClause(doc, y, "15. Cancelamento e rescisão", "O contrato poderá ser encerrado por comum acordo, por conclusão do objeto ou por descumprimento relevante das obrigações assumidas. Em caso de cancelamento, deverão ser apurados os serviços já executados, despesas incorridas, reservas de agenda, valores pagos e valores eventualmente devidos, conforme as condições comerciais aceitas.", data.primaryColor);

  if (data.notes) {
    y = drawClause(doc, y, "16. Observações da proposta", data.notes, data.primaryColor);
  }

  if (data.proposalTerms) {
    y = drawClause(doc, y, data.notes ? "17. Termos comerciais complementares" : "16. Termos comerciais complementares", data.proposalTerms, data.primaryColor);
  }

  const acceptanceClauseNumber = data.notes && data.proposalTerms ? "18" : data.notes || data.proposalTerms ? "17" : "16";
  y = drawClause(
    doc,
    y,
    `${acceptanceClauseNumber}. Aceite digital`,
    `A Contratada ${data.businessName} firmou digitalmente este instrumento na emissão da proposta, em ${data.emittedAtFull}, manifestando os termos, o escopo, o valor e as condições aqui descritos. O aceite digital registrado por ${data.acceptedBy} em ${data.acceptedAtFull} evidencia a concordância expressa do Contratante com o escopo, valor, prazo e condições comerciais apresentados na proposta identificada pelo código ${data.proposalCode}. As partes reconhecem a validade das assinaturas eletrônicas e dos registros digitais relacionados, nos termos admitidos pela legislação brasileira, inclusive quanto ao uso de meios eletrônicos de comprovação de autoria e integridade aceitos pelas partes. Dados do registro: ${acceptanceEvidenceLine(data)}.`,
    data.primaryColor,
  );
  y = drawClause(
    doc,
    y,
    `${Number(acceptanceClauseNumber) + 1}. Boa-fé, preservação e foro`,
    "Este contrato deverá ser interpretado conforme a boa-fé objetiva, a função econômica da contratação e a preservação do negócio jurídico. A eventual tolerância de uma parte quanto ao descumprimento de qualquer obrigação não importará renúncia de direito. Caso alguma disposição seja considerada inválida, as demais permanecerão vigentes. As partes elegem o foro competente nos termos da legislação aplicável para dirimir eventuais controvérsias oriundas deste contrato, salvo acordo escrito em sentido diverso.",
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
  const signatureY = ensureSpace(doc, Math.max(y, 630), 96);

  // Assinatura digital da Contratada (prestador) — já vem assinada na emissão da proposta
  const businessNameSize = data.businessName.length > 26 ? 8.5 : 10;
  doc.roundedRect(48, signatureY - 18, 230, 72, 10).fill("#ECFDF5").stroke("#BBF7D0");
  doc.fillColor("#166534").font("Helvetica-Bold").fontSize(8).text("ASSINATURA DIGITAL DA CONTRATADA", 60, signatureY - 2, {
    width: 206,
    align: "center",
    characterSpacing: 0.5,
  });
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(businessNameSize).text(data.businessName, 60, signatureY + 17, {
    width: 206,
    align: "center",
    lineBreak: false,
    ellipsis: true,
  });
  doc.fillColor("#64748B").font("Helvetica").fontSize(8.5).text(`Assinado em ${data.emittedAtFull}`, 60, signatureY + 34, {
    width: 206,
    align: "center",
    lineBreak: false,
    ellipsis: true,
  });

  // Assinatura digital do Contratante (cliente) — registrada no aceite
  const isFallbackDate = data.acceptedAtFull === "Aceite digital registrado";
  const dateLabel = isFallbackDate ? data.acceptedAtFull : `Aceito em ${data.acceptedAtFull}`;

  doc.roundedRect(317, signatureY - 18, 230, 72, 10).fill("#ECFDF5").stroke("#BBF7D0");
  doc.fillColor("#166534").font("Helvetica-Bold").fontSize(8).text("ASSINATURA DIGITAL DO CONTRATANTE", 329, signatureY - 2, {
    width: 206,
    align: "center",
    characterSpacing: 0.5,
  });
  doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(10).text(data.acceptedBy, 329, signatureY + 17, { width: 206, align: "center" });
  doc.fillColor("#64748B").font("Helvetica").fontSize(8.5).text(dateLabel, 329, signatureY + 34, {
    width: 206,
    align: "center",
    lineBreak: false,
    ellipsis: true,
  });
}

function drawContractFooter(doc: PDFKit.PDFDocument, data: ContractPdfData) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    if (i === range.start) continue;
    doc.switchToPage(i);
    const footerY = 808;
    doc.page.margins.bottom = 0;
    doc.rect(48, footerY - 6, 499, 1).fill("#E2E8F0");
    doc.fillColor("#94A3B8").font("Helvetica").fontSize(7.5).text(
      `${data.businessName}  ·  Cód. ${data.proposalCode}`,
      48, footerY + 4, { width: 380, ellipsis: true },
    );
    doc.fillColor("#94A3B8").font("Helvetica").fontSize(7.5).text(
      `${i + 1} / ${range.count}`,
      48, footerY + 4, { width: 499, align: "right" },
    );
    doc.page.margins.bottom = 48;
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

function partyDetail(email: string, document: string) {
  return [email, document ? `Doc. ${document}` : ""].filter(Boolean).join(" | ") || "Contato não informado";
}

function acceptanceEvidenceLine(data: ContractPdfData) {
  const items = [
    data.acceptedEmail ? `e-mail ${data.acceptedEmail}` : "",
    data.acceptedPhone ? `telefone ${data.acceptedPhone}` : "",
    data.acceptedIp ? `IP mascarado ${data.acceptedIp}` : "",
    data.acceptedSnapshotHash ? `hash ${shortHash(data.acceptedSnapshotHash)}` : "",
    `versão ${data.acceptedContractVersion}`,
  ].filter(Boolean);
  return items.join("; ");
}

function shortHash(value: string) {
  return value.length > 20 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
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
  acceptedDocument: string;
  acceptedEmail: string;
  acceptedIp: string;
  acceptedPhone: string;
  acceptedSnapshotHash: string;
  acceptedUserAgent: string;
  acceptedContractVersion: string;
  businessEmail: string;
  businessName: string;
  businessWhatsapp: string;
  clientName: string;
  createdAtFull: string;
  emittedAtFull: string;
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
