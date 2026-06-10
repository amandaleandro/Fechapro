import { NextResponse } from "next/server";
import { jsonError, slugify } from "@/lib/api";
import { isAdminEmail } from "@/lib/admin";
import { sendProposalSentToClientEmail } from "@/lib/email";
import { blockedSubscriptionMessage, canUsePaidFeatures, planLimits } from "@/lib/billing-access";
import { accumulatedProposalLimit, currentMonthRange, FREE_SERVICE_LIMIT, isUnlimitedProposalLimit, plans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { filterReadyProposalTemplates, findProposalTemplate } from "@/lib/proposal-templates";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, isValidDateOnly, isValidEmail, isValidPhone } from "@/lib/validation";
import { buildProposalClientWhatsAppUrl, sendProposalToClientViaWhatsApp } from "@/lib/whatsapp";
import { trackConversionEvent } from "@/lib/conversion";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const allowedDocumentTypes = new Set(["auto", "budget", "commercial_proposal", "technical_proposal", "care_plan", "event_proposal"]);
const allowedSegments = new Set(["auto", "home_reform", "automotive", "beauty", "health", "business", "events", "technology", "education", "food", "pet", "real_estate", "fashion_retail", "transport", "finance", "industry", "agriculture", "tourism", "security", "general"]);

export async function GET(request: Request) {
  const session = await requireSession();

  if (rateLimit(`expire-proposals:${session.id}`, 1, 60 * 60_000)) {
    const today = new Date().toISOString().slice(0, 10);
    await prisma.proposalAsset.updateMany({
      where: {
        userId: session.id,
        status: { in: ["sent", "viewed"] },
        validUntil: { not: null, lt: today },
      },
      data: { status: "expired" },
    });
  }

  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page");
  const pageSizeParam = url.searchParams.get("pageSize");

  // If no pagination params provided, keep historical behavior (return full list)
  if (!pageParam && !pageSizeParam) {
    const items = await prisma.proposalAsset.findMany({
      where: { userId: session.id },
      include: { satisfactionSurvey: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
  }

  const page = Math.max(1, Number(pageParam || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(pageSizeParam || "10")));

  const [total, items] = await Promise.all([
    prisma.proposalAsset.count({ where: { userId: session.id } }),
    prisma.proposalAsset.findMany({
      where: { userId: session.id },
      include: { satisfactionSurvey: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({ items, total, page, pageSize, totalPages }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await requireSession();
  const isAdmin = isAdminEmail(session.email);
  const body = (await request.json()) as {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    templateId?: string;
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
    status?: "draft" | "sent" | "viewed" | "awaiting_response" | "accepted" | "declined" | "expired";
  };

  const clientName = cleanString(body.clientName);
  const staticTemplate = findProposalTemplate(body.templateId);
  if (staticTemplate) {
    const profile = await prisma.user.findUnique({ where: { id: session.id }, select: { niche: true, segment: true } });
    if (!filterReadyProposalTemplates(profile?.niche, profile?.segment).some((template) => template.id === staticTemplate.id)) {
      return jsonError("Este template nao pertence ao nicho e segmento da conta.", 403);
    }
  }
  const customTemplate = staticTemplate
    ? null
    : body.templateId
      ? await prisma.proposalTemplateAsset.findFirst({ where: { id: body.templateId, userId: session.id } })
      : null;
  const template = staticTemplate || customTemplate;
  const validUntil = cleanOptionalString(body.validUntil);
  const clientEmail = cleanOptionalString(body.clientEmail);
  const clientPhone = cleanOptionalString(body.clientPhone);
  const subscription = await prisma.planSubscription.upsert({
    where: { userId: session.id },
    create: { userId: session.id, plan: "start", status: "pending" },
    update: {},
  });
  const checkoutMode = subscription.plan === "free" ? "mercadopago" : body.checkoutMode === "pix" ? "pix" : "mercadopago";
  const serviceName = cleanString(body.serviceName || template?.serviceName || "");
  const price = Number(body.price ?? template?.price ?? 0);
  const deadline = cleanString(body.deadline || template?.deadline || "");
  const payment = cleanOptionalString(body.payment || template?.payment || "") || "";
  const documentType = allowedDocumentTypes.has(body.documentType || "") ? body.documentType! : "auto";
  const segment = allowedSegments.has(body.segment || "") ? body.segment! : "auto";
  const included = Array.isArray(body.included)
    ? body.included.map((item) => cleanString(item)).filter(Boolean).slice(0, 60)
    : template?.included || [];
  const notes = cleanOptionalString(body.notes || template?.notes || "") || "";

  if (!clientName) {
    return jsonError("Informe o nome do cliente.");
  }

  if (!serviceName) return jsonError("Informe o serviço da proposta.");
  if (!Number.isFinite(price) || price <= 0) return jsonError("Informe um valor maior que zero.");
  if (!deadline) return jsonError("Informe o prazo da proposta.");
  if (validUntil && !isValidDateOnly(validUntil)) return jsonError("Data de validade inválida.");

  if (clientEmail && !isValidEmail(clientEmail)) {
    return jsonError("E-mail do cliente inválido.");
  }

  if (clientPhone && !isValidPhone(clientPhone)) {
    return jsonError("Telefone do cliente inválido.");
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

  if (!isAdmin && !canUsePaidFeatures(subscription)) {
    return jsonError(blockedSubscriptionMessage(subscription.status), 402);
  }

  const plan = planLimits(subscription.plan);
  const { start } = currentMonthRange();
  const usedSinceSubscriptionStart = await prisma.proposalAsset.count({
    where: {
      userId: session.id,
      createdAt: {
        gte: subscription.startedAt || start,
      },
    },
  });
  const accumulatedLimit = accumulatedProposalLimit(plan.proposalLimit, subscription.startedAt);

  if (!isAdmin && !isUnlimitedProposalLimit(accumulatedLimit) && usedSinceSubscriptionStart >= accumulatedLimit) {
    return jsonError(`Limite acumulado do plano ${plan.name} atingido. Todo mês o saldo é renovado e o não utilizado fica acumulado.`, 402);
  }

  const [existingService, proposalCountBeforeCreate] = await Promise.all([
    prisma.serviceAsset.findFirst({
    where: {
      userId: session.id,
      name: { equals: serviceName, mode: "insensitive" },
    },
    select: { id: true },
    }),
    prisma.proposalAsset.count({ where: { userId: session.id } }),
  ]);

  let canCreateCatalogService = true;
  if (!existingService && subscription.plan === "free") {
    const serviceCount = await prisma.serviceAsset.count({ where: { userId: session.id } });
    canCreateCatalogService = serviceCount < FREE_SERVICE_LIMIT;
  }

  if (!existingService && canCreateCatalogService) {
    await prisma.serviceAsset.create({
      data: {
        userId: session.id,
        name: serviceName,
        price,
        deadline,
        includes: included.slice(0, 30),
      },
    });
  }

  const item = await prisma.proposalAsset.create({
    data: {
      userId: session.id,
      clientName,
      clientEmail,
      clientPhone,
      serviceName,
      price,
      deadline,
      validUntil,
      payment,
      documentType,
      segment,
      checkoutMode,
      included,
      notes,
      status: body.status || "sent",
      publicSlug: slugify(`${clientName}-${serviceName}`),
    },
    include: { user: { select: { name: true } } },
  });

  let clientEmailSent = false;
  let whatsappSent = false;
  let whatsappUrl: string | null = null;

  if (item.status === "sent") {
    if (clientEmail) {
      await sendProposalSentToClientEmail(
        clientEmail,
        item.clientName,
        item.user.name,
        item.serviceName,
        item.publicSlug
      );
      clientEmailSent = true;
    }

    if (clientPhone) {
      whatsappUrl = buildProposalClientWhatsAppUrl(clientPhone, item.user.name, item.serviceName, item.publicSlug);
      whatsappSent = await sendProposalToClientViaWhatsApp(clientPhone, item.user.name, item.serviceName, item.publicSlug);
    }
  }

  if (proposalCountBeforeCreate === 0) {
    await trackConversionEvent({
      event: "first_proposal_created",
      userId: session.id,
      proposalId: item.id,
      plan: subscription.plan,
      source: "dashboard",
      context: "proposal_create",
      metadata: { publicSlug: item.publicSlug, status: item.status },
    });
  }

  return NextResponse.json({ ...item, clientEmailSent, whatsappSent, whatsappUrl }, { status: 201 });
}
