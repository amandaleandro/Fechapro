import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, isValidDateOnly, isValidEmail } from "@/lib/validation";

const ALLOWED_STATUSES = ["draft", "sent", "viewed", "awaiting_response", "accepted", "declined", "expired"] as const;
type AllowedStatus = typeof ALLOWED_STATUSES[number];
const allowedDocumentTypes = new Set(["auto", "budget", "commercial_proposal", "technical_proposal", "care_plan", "event_proposal"]);
const allowedSegments = new Set(["auto", "home_reform", "automotive", "beauty", "health", "business", "events", "technology", "education", "food", "pet", "real_estate", "fashion_retail", "transport", "finance", "industry", "agriculture", "tourism", "security", "general"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  const body = (await request.json()) as {
    clientName?: string;
    clientEmail?: string;
    serviceName?: string;
    price?: number;
    deadline?: string;
    validUntil?: string;
    payment?: string;
    documentType?: string;
    segment?: string;
    checkoutMode?: string;
    included?: string[];
    notes?: string;
    status?: string;
  };

  if (body.status !== undefined && !ALLOWED_STATUSES.includes(body.status as AllowedStatus)) {
    return jsonError("Status inválido.");
  }

  const data: Parameters<typeof prisma.proposalAsset.updateMany>[0]["data"] = {};

  if (body.clientName !== undefined) {
    const clientName = cleanString(body.clientName);
    if (!clientName) return jsonError("Informe o nome do cliente.");
    data.clientName = clientName;
  }
  if (body.serviceName !== undefined) {
    const serviceName = cleanString(body.serviceName);
    if (!serviceName) return jsonError("Informe o serviço da proposta.");
    data.serviceName = serviceName;
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) return jsonError("Informe um valor maior que zero.");
    data.price = price;
  }
  if (body.deadline !== undefined) {
    const deadline = cleanString(body.deadline);
    if (!deadline) return jsonError("Informe o prazo da proposta.");
    data.deadline = deadline;
  }
  if (body.validUntil !== undefined) {
    const validUntil = cleanOptionalString(body.validUntil);
    if (validUntil && !isValidDateOnly(validUntil)) return jsonError("Data de validade inválida.");
    data.validUntil = validUntil;
  }
  if (body.clientEmail !== undefined) {
    const clientEmail = cleanOptionalString(body.clientEmail);
    if (clientEmail && !isValidEmail(clientEmail)) return jsonError("E-mail do cliente inválido.");
    data.clientEmail = clientEmail;
  }
  if (body.payment !== undefined) data.payment = cleanOptionalString(body.payment) || "";
  if (body.notes !== undefined) data.notes = cleanOptionalString(body.notes) || "";
  if (body.documentType !== undefined) data.documentType = allowedDocumentTypes.has(body.documentType) ? body.documentType : "auto";
  if (body.segment !== undefined) data.segment = allowedSegments.has(body.segment) ? body.segment : "auto";
  if (body.checkoutMode !== undefined) data.checkoutMode = body.checkoutMode === "pix" ? "pix" : "mercadopago";
  if (body.included !== undefined) {
    data.included = Array.isArray(body.included)
      ? body.included.map((item) => cleanString(item)).filter(Boolean).slice(0, 60)
      : [];
  }
  if (body.status !== undefined) data.status = body.status as AllowedStatus;

  await prisma.proposalAsset.updateMany({
    where: { id, userId: session.id },
    data,
  });
  const item = await prisma.proposalAsset.findFirst({ where: { id, userId: session.id } });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  await prisma.proposalAsset.deleteMany({ where: { id, userId: session.id } });
  return NextResponse.json({ ok: true });
}
