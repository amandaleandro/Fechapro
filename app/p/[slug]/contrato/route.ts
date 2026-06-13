import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { notFound } from "next/navigation";
import { slugBase } from "@/lib/api";
import { canUseProposalContracts } from "@/lib/billing-access";
import { prisma } from "@/lib/prisma";
import { proposalDocumentUpgradeResponse } from "@/lib/proposal-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const PAGE = { width: 595.28, height: 841.89 };
const COLORS = {
  dark: "#020918",
  dark2: "#031329",
  blue: "#1462FF",
  green: "#22C55E",
  ink: "#101A33",
  muted: "#56657A",
  line: "#DCE5EF",
  soft: "#F7FAFC",
};

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    include: { user: { include: { brandProfile: true, subscription: true } } },
  });

  if (!proposal || proposal.status !== "accepted") notFound();
  if (!canUseProposalContracts(proposal.user.subscription)) return proposalDocumentUpgradeResponse("contrato");

  const brand = proposal.user.brandProfile;
  const acceptedAt = proposal.acceptedAt || new Date();
  const data: ContractPdfData = {
    accentColor: normalizeColor(brand?.accentColor || COLORS.blue, COLORS.blue),
    acceptedAtFull: proposal.acceptedAt ? formatContractDateTime(acceptedAt) : "aceite digital registrado",
    acceptedAtShort: proposal.acceptedAt ? formatDateOnlyFromDate(acceptedAt) : "Aceite registrado",
    acceptedBy: proposal.acceptedBy || proposal.clientName,
    acceptedDocument: proposal.acceptedDocument || "",
    acceptedEmail: proposal.acceptedEmail || proposal.clientEmail || "",
    acceptedIp: proposal.acceptedIp || "",
    acceptedPhone: proposal.acceptedPhone || proposal.clientPhone || "",
    acceptedSnapshotHash: proposal.acceptedSnapshotHash || "",
    acceptedContractVersion: proposal.acceptedContractVersion || "service-contract-v2",
    businessEmail: brand?.email || proposal.user.email,
    businessName: brand?.businessName || proposal.user.name,
    businessWhatsapp: brand?.whatsapp || "",
    clientEmail: proposal.clientEmail || "",
    clientName: proposal.clientName,
    clientPhone: proposal.clientPhone || "",
    createdAtFull: formatContractDateTime(new Date()),
    deadline: proposal.deadline,
    emittedAtFull: formatContractDateTime(proposal.createdAt),
    included: proposal.included.length ? proposal.included : ["Servico conforme combinado entre as partes."],
    notes: proposal.notes || "",
    payment: proposal.payment || "A combinar",
    primaryColor: normalizeColor(brand?.primaryColor || COLORS.green, COLORS.green),
    proposalCode: proposal.publicSlug,
    proposalTerms: brand?.proposalTerms || "",
    serviceName: proposal.serviceName,
    total: money.format(proposal.price),
    totalNumber: proposal.price,
    validUntil: proposal.validUntil ? formatDateOnly(proposal.validUntil) : "A combinar",
  };

  const pdf = await createContractPdf(data);

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

    drawExecutiveContractPage(doc, data);
    drawLegalTerms(doc, data);
    drawPageFooters(doc, data);
    doc.end();
  });
}

function drawExecutiveContractPage(doc: PDFKit.PDFDocument, data: ContractPdfData) {
  doc.rect(0, 0, PAGE.width, PAGE.height).fill("#FFFFFF");
  drawContractHero(doc, data);
  drawParties(doc, data, 232);
  drawObjectAndScope(doc, data, 365);
  drawTimelineAndPayment(doc, data, 500);
  drawGeneralConditions(doc, data, 648);
  drawSignatureBand(doc, data, 716);
  drawDarkFooterBand(doc, data);
}

function drawContractHero(doc: PDFKit.PDFDocument, data: ContractPdfData) {
  doc.rect(0, 0, PAGE.width, 210).fill(COLORS.dark);
  doc.rect(0, 0, PAGE.width, 210).fillOpacity(0.92).fill(COLORS.dark2).fillOpacity(1);
  drawCornerLines(doc, 0, 0, data.accentColor);
  drawDotMatrix(doc, 520, 140, data.primaryColor);

  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(24).text("Fecha", 38, 34, { continued: true });
  doc.fillColor(data.primaryColor).text("Pro");
  doc.fillColor("#8AB6FF").font("Helvetica-Bold").fontSize(9).text("CONTRATO DE PRESTACAO DE SERVICOS", 38, 82, {
    characterSpacing: 1.4,
  });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(25).text("Formalizacao do acordo", 38, 106, {
    width: 285,
    lineGap: 2,
  });
  doc.fillColor(data.primaryColor).font("Helvetica-Bold").fontSize(25).text("e condicoes da proposta.", 38, 134, {
    width: 285,
  });
  doc.fillColor("#D7E3F5").font("Helvetica").fontSize(10).text(
    "Este contrato formaliza o acordo entre as partes, definindo escopo, prazos, valores e condicoes para execucao do projeto.",
    38,
    166,
    { width: 285, lineGap: 3 },
  );

  const cardX = 322;
  doc.roundedRect(cardX, 34, 236, 146, 14).lineWidth(1.2).stroke(data.accentColor);
  doc.roundedRect(cardX, 34, 236, 146, 14).lineWidth(0.8).stroke(data.primaryColor);
  doc.fillColor(data.primaryColor).font("Helvetica-Bold").fontSize(10).text("Resumo da proposta", cardX + 28, 52);
  drawSummaryRow(doc, cardX + 18, 78, "Servico", data.serviceName);
  drawSummaryRow(doc, cardX + 18, 105, "Investimento", data.total);
  drawSummaryRow(doc, cardX + 18, 132, "Prazo estimado", data.deadline || "A combinar");
  drawSummaryRow(doc, cardX + 18, 159, "Validade", data.validUntil);
}

function drawParties(doc: PDFKit.PDFDocument, data: ContractPdfData, y: number) {
  sectionTitle(doc, "1. PARTES", 38, y, data.accentColor, data.primaryColor);
  partyCard(doc, 38, y + 28, "CONTRATANTE", [
    ["Nome", data.acceptedBy],
    ["CPF/CNPJ", data.acceptedDocument || "Nao informado"],
    ["E-mail", data.acceptedEmail || data.clientEmail || "Nao informado"],
    ["Telefone", data.acceptedPhone || data.clientPhone || "Nao informado"],
  ], data.primaryColor);
  partyCard(doc, 302, y + 28, "CONTRATADA", [
    ["Razao social", data.businessName],
    ["Documento", "Conforme cadastro da contratada"],
    ["E-mail", data.businessEmail || "Nao informado"],
    ["Telefone", data.businessWhatsapp || "Nao informado"],
  ], data.primaryColor);
}

function drawObjectAndScope(doc: PDFKit.PDFDocument, data: ContractPdfData, y: number) {
  sectionTitle(doc, "2. OBJETO DO CONTRATO", 38, y, data.accentColor, data.primaryColor);
  doc.fillColor(COLORS.ink).font("Helvetica").fontSize(9.2).text(
    `O presente contrato tem por objeto a prestacao de servicos de ${data.serviceName}, conforme escopo detalhado na proposta comercial aceita pelo contratante.`,
    38,
    y + 31,
    { width: 235, lineGap: 3 },
  );

  sectionTitle(doc, "3. ESCOPO DOS SERVICOS", 292, y, data.accentColor, data.primaryColor);
  const items = data.included.slice(0, 6);
  const left = items.slice(0, 3);
  const right = items.slice(3, 6);
  drawCheckList(doc, left, 292, y + 31, 130, data.primaryColor);
  drawCheckList(doc, right, 424, y + 31, 130, data.primaryColor);
}

function drawTimelineAndPayment(doc: PDFKit.PDFDocument, data: ContractPdfData, y: number) {
  sectionTitle(doc, "4. PRAZOS E ETAPAS", 38, y, data.accentColor, data.primaryColor);
  const timeline = buildContractTimeline(data.deadline);
  timeline.forEach((step, index) => {
    const itemY = y + 30 + index * 30;
    doc.circle(46, itemY + 10, 9).fill(index % 2 ? data.primaryColor : data.accentColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8).text(String(index + 1), 42.8, itemY + 5.3);
    if (index < timeline.length - 1) {
      doc.moveTo(46, itemY + 20).lineTo(46, itemY + 39).lineWidth(1).strokeColor(index % 2 ? data.primaryColor : data.accentColor).stroke();
    }
    doc.roundedRect(62, itemY - 1, 205, 25, 7).fill("#F8FAFC").stroke(COLORS.line);
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(8.8).text(step.title, 94, itemY + 4, { width: 90, ellipsis: true });
    doc.fillColor(COLORS.muted).font("Helvetica").fontSize(7.5).text(step.description, 94, itemY + 15, { width: 105, ellipsis: true });
    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(8).text(step.duration, 214, itemY + 8, { width: 38, align: "right" });
  });

  sectionTitle(doc, "5. INVESTIMENTO E FORMA DE PAGAMENTO", 292, y, data.accentColor, data.primaryColor);
  drawPaymentTable(doc, data, 292, y + 28);
}

function drawGeneralConditions(doc: PDFKit.PDFDocument, data: ContractPdfData, y: number) {
  sectionTitle(doc, "6. CONDICOES GERAIS", 38, y, data.accentColor, data.primaryColor);
  doc.fillColor(COLORS.ink).font("Helvetica").fontSize(8.8).text(
    "Este contrato contempla os itens descritos na proposta comercial. Qualquer alteracao de escopo, materiais, prazo ou solicitacao adicional podera gerar novo orcamento ou ajuste no valor final.",
    38,
    y + 28,
    { width: 235, lineGap: 3 },
  );

  sectionTitle(doc, "7. GARANTIA", 292, y, data.accentColor, data.primaryColor);
  doc.fillColor(COLORS.ink).font("Helvetica").fontSize(8.8).text(
    "A contratada executara os servicos conforme condicoes descritas na proposta, mantendo comunicacao transparente e registro das etapas combinadas entre as partes.",
    292,
    y + 28,
    { width: 250, lineGap: 3 },
  );
}

function drawSignatureBand(doc: PDFKit.PDFDocument, data: ContractPdfData, y: number) {
  doc.roundedRect(38, y, 518, 73, 8).fill("#F9FBFD").stroke(COLORS.line);
  doc.rect(297, y + 10, 1, 53).fill("#E4ECF4");
  doc.fillColor(data.accentColor).font("Helvetica-Bold").fontSize(8.5).text("CONTRATANTE", 55, y + 13);
  doc.fillColor(COLORS.ink).font("Helvetica").fontSize(8).text(`Nome: ${data.acceptedBy}`, 55, y + 31);
  doc.text(`CPF/CNPJ: ${data.acceptedDocument || "Nao informado"}`, 55, y + 45);
  doc.fillColor(data.primaryColor).font("Helvetica-Bold").fontSize(8).text("Assinatura digital registrada", 55, y + 59);

  doc.fillColor(data.accentColor).font("Helvetica-Bold").fontSize(8.5).text("CONTRATADA", 315, y + 13);
  doc.fillColor(COLORS.ink).font("Helvetica").fontSize(8).text(`Nome: ${data.businessName}`, 315, y + 31, { width: 210, ellipsis: true });
  doc.text(`Aceite: ${data.acceptedAtShort}`, 315, y + 45, { width: 210, ellipsis: true });
  doc.fillColor(data.primaryColor).font("Helvetica-Bold").fontSize(8).text("Contrato emitido pelo FechaPro", 315, y + 59);
}

function drawDarkFooterBand(doc: PDFKit.PDFDocument, data: ContractPdfData) {
  doc.roundedRect(38, 804, 518, 26, 7).fill(COLORS.dark);
  drawDotMatrix(doc, 510, 809, data.primaryColor, 0.65);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(12).text("Fecha", 356, 811, { continued: true });
  doc.fillColor(data.primaryColor).text("Pro");
  doc.fillColor("#D7E3F5").font("Helvetica").fontSize(7.5).text(
    `Contrato valido entre as partes apos aceite digital. Cod. ${data.proposalCode}`,
    56,
    813,
    { width: 260, ellipsis: true },
  );
}

function drawLegalTerms(doc: PDFKit.PDFDocument, data: ContractPdfData) {
  currentContractDataForHeader = data;
  doc.addPage();
  drawLegalPageHeader(doc, data, "Termos juridicos do contrato");
  let y = 92;
  const clauses = buildLegalClauses(data);
  clauses.forEach((clause, index) => {
    y = drawClause(doc, y, `${index + 1}. ${clause.title}`, clause.body, data);
  });
  drawDigitalEvidence(doc, ensureSpace(doc, y + 4, 96), data);
}

function drawLegalPageHeader(doc: PDFKit.PDFDocument, data: ContractPdfData, title: string) {
  doc.rect(0, 0, PAGE.width, PAGE.height).fill("#FFFFFF");
  doc.rect(0, 0, PAGE.width, 10).fill(COLORS.dark);
  doc.rect(0, 10, PAGE.width, 3).fill(data.primaryColor);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(16).text(title, 48, 36);
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8.5).text(`Emitido em ${data.createdAtFull}`, 48, 58);
  doc.rect(48, 76, 499, 1).fill(COLORS.line);
}

function drawClause(doc: PDFKit.PDFDocument, y: number, title: string, body: string, data: ContractPdfData) {
  doc.font("Helvetica").fontSize(9.4);
  const bodyHeight = doc.heightOfString(body, { width: 484, lineGap: 3.4 });
  const startY = ensureSpace(doc, y, bodyHeight + 38);
  doc.roundedRect(48, startY, 3, 15, 1.5).fill(data.primaryColor);
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(10.8).text(title, 58, startY);
  doc.fillColor("#334155").font("Helvetica").fontSize(9.4).text(body, 58, startY + 18, { width: 484, lineGap: 3.4 });
  return doc.y + 15;
}

function drawDigitalEvidence(doc: PDFKit.PDFDocument, y: number, data: ContractPdfData) {
  doc.roundedRect(48, y, 499, 86, 10).fill("#ECFDF5").stroke("#B7E8C5");
  doc.fillColor("#166534").font("Helvetica-Bold").fontSize(9).text("COMPROVANTE DE ACEITE DIGITAL", 66, y + 16, {
    characterSpacing: 0.7,
  });
  doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(11).text(`${data.acceptedBy} confirmou o aceite em ${data.acceptedAtFull}.`, 66, y + 36, {
    width: 455,
    lineGap: 3,
  });
  doc.fillColor(COLORS.muted).font("Helvetica").fontSize(8).text(acceptanceEvidenceLine(data), 66, y + 61, {
    width: 455,
    ellipsis: true,
  });
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string, x: number, y: number, blue: string, green: string) {
  doc.fillColor(blue).font("Helvetica-Bold").fontSize(9.8).text(title, x, y);
  doc.roundedRect(x, y + 18, 20, 1.5, 1).fill(green);
}

function partyCard(doc: PDFKit.PDFDocument, x: number, y: number, title: string, rows: string[][], color: string) {
  doc.roundedRect(x, y, 254, 88, 8).fill("#F9FBFD").stroke(COLORS.line);
  doc.circle(x + 30, y + 33, 16).fill("#F0FDF4").stroke("#C9E8D1");
  doc.fillColor(color).font("Helvetica-Bold").fontSize(15).text(title === "CONTRATANTE" ? "P" : "E", x + 25, y + 24);
  doc.fillColor(COLORS.blue).font("Helvetica-Bold").fontSize(8.8).text(title, x + 62, y + 16);
  let rowY = y + 34;
  rows.forEach(([label, value]) => {
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(7.8).text(`${label}:`, x + 62, rowY, { width: 52 });
    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(7.8).text(value, x + 110, rowY, { width: 130, ellipsis: true });
    rowY += 12;
  });
}

function drawCheckList(doc: PDFKit.PDFDocument, items: string[], x: number, y: number, width: number, color: string) {
  items.forEach((item, index) => {
    const itemY = y + index * 19;
    doc.circle(x + 4, itemY + 5, 4).strokeColor(color).stroke();
    doc.fillColor(color).font("Helvetica-Bold").fontSize(6).text("✓", x + 1.6, itemY + 1);
    doc.fillColor(COLORS.ink).font("Helvetica").fontSize(8).text(item, x + 14, itemY, { width, ellipsis: true });
  });
}

function drawPaymentTable(doc: PDFKit.PDFDocument, data: ContractPdfData, x: number, y: number) {
  const rows = buildPaymentRows(data);
  doc.roundedRect(x, y, 252, 66, 5).fill("#FFFFFF").stroke(COLORS.line);
  doc.rect(x, y, 252, 17).fill(COLORS.dark);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(7.3).text("ETAPA", x + 8, y + 6);
  doc.text("PERCENTUAL", x + 112, y + 6, { width: 62, align: "center" });
  doc.text("VALOR", x + 188, y + 6, { width: 52, align: "center" });
  rows.forEach((row, index) => {
    const rowY = y + 17 + index * 16;
    doc.fillColor(index % 2 ? "#FFFFFF" : "#F6F9FC").rect(x, rowY, 252, 16).fill();
    doc.fillColor(COLORS.ink).font("Helvetica-Bold").fontSize(7.8).text(row.label, x + 8, rowY + 5);
    doc.font("Helvetica").text(row.percent, x + 112, rowY + 5, { width: 62, align: "center" });
    doc.text(row.value, x + 188, rowY + 5, { width: 52, align: "center" });
  });

  doc.roundedRect(x, y + 76, 252, 35, 6).fill("#F9FBFD").stroke(COLORS.line);
  doc.fillColor(COLORS.ink).font("Helvetica").fontSize(8).text("Investimento total", x + 12, y + 85);
  doc.fillColor(data.primaryColor).font("Helvetica-Bold").fontSize(13).text(data.total, x + 12, y + 97);
  doc.fillColor(COLORS.ink).font("Helvetica").fontSize(8).text("Formas de pagamento", x + 126, y + 85);
  doc.fillColor("#166534").font("Helvetica").fontSize(8).text("PIX   Cartao   Boleto", x + 126, y + 99);
}

function drawSummaryRow(doc: PDFKit.PDFDocument, x: number, y: number, label: string, value: string) {
  doc.rect(x, y - 7, 200, 1).fillOpacity(0.15).fill("#FFFFFF").fillOpacity(1);
  doc.fillColor("#EAF2FF").font("Helvetica").fontSize(8.3).text(label, x + 22, y, { width: 70 });
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8.3).text(value, x + 104, y, { width: 92, ellipsis: true });
}

function drawCornerLines(doc: PDFKit.PDFDocument, x: number, y: number, color: string) {
  doc.save();
  doc.strokeColor(color).lineWidth(0.45).opacity(0.32);
  for (let i = 0; i < 5; i++) {
    doc.moveTo(x + i * 10, y).bezierCurveTo(x + 40 + i * 8, y + 30, x + 30 + i * 8, y + 58, x, y + 80 + i * 8).stroke();
  }
  doc.restore();
}

function drawDotMatrix(doc: PDFKit.PDFDocument, x: number, y: number, color: string, opacity = 0.42) {
  doc.save();
  doc.fillColor(color).opacity(opacity);
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      doc.circle(x + col * 8, y + row * 8, 1).fill();
    }
  }
  doc.restore();
}

function buildContractTimeline(deadline?: string | null) {
  const days = parseDeadlineDays(deadline);
  const execution = days ? Math.max(1, Math.ceil(days * 0.55)) : 15;
  const planning = days ? Math.max(1, Math.ceil(days * 0.2)) : 3;
  const finishing = days ? Math.max(1, Math.ceil(days * 0.18)) : 7;
  const delivery = days ? Math.max(1, days - execution - planning - finishing) : 2;
  return [
    { title: "Planejamento", description: "Briefing e levantamento", duration: `${planning} dias` },
    { title: "Execucao", description: "Servico contratado", duration: `${execution} dias` },
    { title: "Acabamentos", description: "Revisao e ajustes", duration: `${finishing} dias` },
    { title: "Entrega", description: "Validacao final", duration: `${delivery} dias` },
  ];
}

function buildPaymentRows(data: ContractPdfData) {
  const percentages = Array.from(data.payment.matchAll(/(\d{1,3})\s*%/g)).map((match) => Number(match[1])).slice(0, 3);
  const split = percentages.length >= 2 ? [percentages[0], percentages[1], percentages[2] || Math.max(0, 100 - percentages[0] - percentages[1])] : [30, 50, 20];
  const labels = ["Entrada", "Durante o projeto", "Na entrega"];
  return split.map((percent, index) => ({
    label: labels[index],
    percent: `${percent}%`,
    value: money.format(Math.round(data.totalNumber * (percent / 100))),
  }));
}

function buildLegalClauses(data: ContractPdfData) {
  const base = [
    {
      title: "Partes contratantes",
      body: `${data.businessName}, doravante denominada Contratada, e ${data.acceptedBy}, doravante denominado(a) Contratante, celebram o presente contrato de prestacao de servicos. As partes reconhecem como suficientes os dados de identificacao e contato informados na proposta aceita sob o codigo ${data.proposalCode}.`,
    },
    {
      title: "Documentos integrantes",
      body: "Integram este contrato a proposta aceita digitalmente, o comprovante de aceite, eventuais mensagens, anexos, comprovantes de pagamento e registros relacionados a contratacao. Em caso de divergencia, prevalecem as condicoes especificas aceitas na proposta.",
    },
    {
      title: "Objeto e escopo",
      body: `O objeto deste contrato e a prestacao do servico "${data.serviceName}", observados escopo, prazo, investimento, condicoes comerciais e informacoes constantes neste documento e na proposta aceita.`,
    },
    {
      title: "Investimento e pagamento",
      body: `Pela execucao do objeto contratado, o Contratante pagara a Contratada o valor total de ${data.total}. A condicao de pagamento registrada na proposta foi: ${data.payment}. A execucao podera ficar condicionada ao pagamento de entrada, sinal, parcela vencida ou valor previamente ajustado.`,
    },
    {
      title: "Prazo de execucao",
      body: `O prazo estimado para execucao ou entrega e: ${data.deadline || "A combinar"}. A contagem do prazo depende do recebimento de informacoes, materiais, acessos, aprovacoes e pagamentos necessarios. Pendencias do Contratante podem suspender ou reprogramar o cronograma.`,
    },
    {
      title: "Alteracoes de escopo",
      body: "Solicitacoes nao previstas, inclusao de novas entregas, retrabalhos por mudanca de orientacao ou alteracao substancial das premissas iniciais dependerao de aceite previo da Contratada e poderao exigir proposta complementar, novo prazo e/ou cobranca adicional.",
    },
    {
      title: "Obrigacoes das partes",
      body: "A Contratada se obriga a executar os servicos com diligencia, boa-fe, zelo tecnico e observancia ao escopo contratado. O Contratante se obriga a fornecer informacoes completas, materiais, documentos, acessos, respostas, aprovacoes e pagamentos nos prazos combinados.",
    },
    {
      title: "Confidencialidade e protecao de dados",
      body: "As partes comprometem-se a manter sigilo sobre informacoes comerciais, tecnicas, financeiras, estrategicas ou pessoais acessadas em razao deste contrato, utilizando-as apenas para execucao do objeto contratado e observando a legislacao aplicavel.",
    },
    {
      title: "Aceite digital",
      body: `O aceite digital registrado por ${data.acceptedBy} em ${data.acceptedAtFull} evidencia concordancia expressa com escopo, valor, prazo e condicoes comerciais da proposta ${data.proposalCode}. As partes reconhecem a validade dos registros digitais e meios eletronicos de comprovacao de autoria e integridade aceitos entre elas.`,
    },
    {
      title: "Boa-fe e foro",
      body: "Este contrato sera interpretado conforme boa-fe objetiva, preservacao do negocio juridico e legislacao brasileira aplicavel. Eventual tolerancia quanto ao descumprimento de obrigacao nao importara renuncia de direito. As partes elegem o foro competente nos termos da lei, salvo acordo escrito em sentido diverso.",
    },
  ];

  if (data.notes) base.splice(5, 0, { title: "Observacoes da proposta", body: data.notes });
  if (data.proposalTerms) base.splice(6, 0, { title: "Termos complementares", body: data.proposalTerms });
  return base;
}

function drawPageFooters(doc: PDFKit.PDFDocument, data: ContractPdfData) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    if (i === range.start) continue;
    doc.rect(48, 806, 499, 1).fill(COLORS.line);
    doc.fillColor("#94A3B8").font("Helvetica").fontSize(7.5).text(
      `${data.businessName} | Cod. ${data.proposalCode}`,
      48,
      816,
      { width: 360, ellipsis: true },
    );
    doc.text(`${i + 1} / ${range.count}`, 48, 816, { width: 499, align: "right" });
  }
}

function ensureSpace(doc: PDFKit.PDFDocument, y: number, height: number) {
  if (y + height <= 790) return y;
  doc.addPage();
  drawLegalPageHeader(doc, currentContractDataForHeader, "Termos juridicos do contrato");
  return 92;
}

let currentContractDataForHeader: ContractPdfData;

function parseDeadlineDays(deadline?: string | null) {
  if (!deadline) return null;
  const match = deadline.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function acceptanceEvidenceLine(data: ContractPdfData) {
  return [
    data.acceptedEmail ? `e-mail ${data.acceptedEmail}` : "",
    data.acceptedPhone ? `telefone ${data.acceptedPhone}` : "",
    data.acceptedIp ? `IP ${data.acceptedIp}` : "",
    data.acceptedSnapshotHash ? `hash ${shortHash(data.acceptedSnapshotHash)}` : "",
    `versao ${data.acceptedContractVersion}`,
  ].filter(Boolean).join(" | ");
}

function shortHash(value: string) {
  return value.length > 20 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
}

function formatDateOnly(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatDateOnlyFromDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
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
  return `${datePart}, as ${timePart} (horario de Brasilia)`;
}

function normalizeColor(value: string, fallback: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}

type ContractPdfData = {
  accentColor: string;
  acceptedAtFull: string;
  acceptedAtShort: string;
  acceptedBy: string;
  acceptedDocument: string;
  acceptedEmail: string;
  acceptedIp: string;
  acceptedPhone: string;
  acceptedSnapshotHash: string;
  acceptedContractVersion: string;
  businessEmail: string;
  businessName: string;
  businessWhatsapp: string;
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  createdAtFull: string;
  deadline: string;
  emittedAtFull: string;
  included: string[];
  notes: string;
  payment: string;
  primaryColor: string;
  proposalCode: string;
  proposalTerms: string;
  serviceName: string;
  total: string;
  totalNumber: number;
  validUntil: string;
};
