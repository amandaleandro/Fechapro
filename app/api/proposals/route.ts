import { NextResponse } from "next/server";
import { jsonError, slugify } from "@/lib/api";
import { sendProposalSentToClientEmail } from "@/lib/email";
import { blockedSubscriptionMessage, canUsePaidFeatures, planLimits } from "@/lib/billing-access";
import { currentMonthRange, plans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { findProposalTemplate } from "@/lib/proposal-templates";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, isValidDateOnly, isValidEmail } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await requireSession();

  const today = new Date().toISOString().slice(0, 10);
  await prisma.proposalAsset.updateMany({
    where: {
      userId: session.id,
      status: { in: ["sent", "viewed"] },
      validUntil: { not: null, lt: today },
    },
    data: { status: "expired" },
  });

  const items = await prisma.proposalAsset.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as {
    clientName?: string;
    clientEmail?: string;
    templateId?: string;
    serviceName?: string;
    price?: number;
    deadline?: string;
    validUntil?: string;
    payment?: string;
    checkoutMode?: string;
    included?: string[];
    notes?: string;
    status?: "draft" | "sent" | "viewed" | "awaiting_response" | "accepted" | "declined" | "expired";
  };

  const clientName = cleanString(body.clientName);
  const staticTemplate = findProposalTemplate(body.templateId);
  const customTemplate = staticTemplate
    ? null
    : body.templateId
      ? await prisma.proposalTemplateAsset.findFirst({ where: { id: body.templateId, userId: session.id } })
      : null;
  const template = staticTemplate || customTemplate;
  const validUntil = cleanOptionalString(body.validUntil);
  const clientEmail = cleanOptionalString(body.clientEmail);
  const checkoutMode = body.checkoutMode === "pix" ? "pix" : "mercadopago";
  const serviceName = cleanString(body.serviceName || template?.serviceName || "");
  const price = Number(body.price ?? template?.price ?? 0);
  const deadline = cleanString(body.deadline || template?.deadline || "");
  const payment = cleanOptionalString(body.payment || template?.payment || "") || "";
  const included = Array.isArray(body.included)
    ? body.included.map((item) => cleanString(item)).filter(Boolean).slice(0, 60)
    : template?.included || [];
  const notes = cleanOptionalString(body.notes || template?.notes || "") || "";

  if (!clientName) {
    return jsonError("Informe o nome do cliente.");
  }

  if (!serviceName) return jsonError("Informe o serviÃ§o da proposta.");
  if (!Number.isFinite(price) || price <= 0) return jsonError("Informe um valor maior que zero.");
  if (!deadline) return jsonError("Informe o prazo da proposta.");
  if (validUntil && !isValidDateOnly(validUntil)) return jsonError("Data de validade inválida.");

  if (clientEmail && !isValidEmail(clientEmail)) {
    return jsonError("E-mail do cliente inválido.");
  }

  if (checkoutMode === "pix") {
    const brand = await prisma.brandProfile.findUnique({
      where: { userId: session.id },
      select: { pixKey: true },
    });
    if (!brand?.pixKey) {
      return jsonError("Cadastre uma chave PIX na aba Marca antes de escolher recebimento por PIX.");
    }
  }

  const subscription = await prisma.planSubscription.upsert({
    where: { userId: session.id },
    create: { userId: session.id, plan: "start", status: "pending" },
    update: {},
  });

  if (!canUsePaidFeatures(subscription)) {
    return jsonError(blockedSubscriptionMessage(subscription.status), 402);
  }

  const plan = planLimits(subscription.plan);
  const { start, end } = currentMonthRange();
  const usedThisMonth = await prisma.proposalAsset.count({
    where: {
      userId: session.id,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });

  if (usedThisMonth >= plan.proposalLimit) {
    return jsonError(`Limite mensal do plano ${plan.name} atingido.`, 402);
  }

  const item = await prisma.proposalAsset.create({
    data: {
      userId: session.id,
      clientName,
      clientEmail,
      serviceName,
      price,
      deadline,
      validUntil,
      payment,
      checkoutMode,
      included,
      notes,
      status: body.status || "sent",
      publicSlug: slugify(`${clientName}-${serviceName}`),
    },
    include: { user: { select: { name: true } } },
  });

  let clientEmailSent = false;
  if (clientEmail && item.status === "sent") {
    await sendProposalSentToClientEmail(
      clientEmail,
      item.clientName,
      item.user.name,
      item.serviceName,
      item.publicSlug
    );
    clientEmailSent = true;
  }

  return NextResponse.json({ ...item, clientEmailSent }, { status: 201 });
}
