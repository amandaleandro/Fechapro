import { NextResponse } from "next/server";
import { jsonError, slugify } from "@/lib/api";
import { sendProposalSentToClientEmail } from "@/lib/email";
import { currentMonthRange, plans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, cleanStringList, isValidDateOnly, isValidEmail, normalizePrice } from "@/lib/validation";

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
    serviceName?: string;
    price?: number;
    deadline?: string;
    validUntil?: string;
    payment?: string;
    included?: string[];
    notes?: string;
    status?: "sent" | "viewed" | "accepted" | "declined";
  };

  const clientName = cleanString(body.clientName);
  const serviceName = cleanString(body.serviceName);
  const deadline = cleanString(body.deadline);
  const price = normalizePrice(body.price);
  const validUntil = cleanOptionalString(body.validUntil);
  const clientEmail = cleanOptionalString(body.clientEmail);
  const payment = cleanOptionalString(body.payment);
  const notes = cleanOptionalString(body.notes);
  const included = cleanStringList(body.included);

  if (!clientName || !serviceName || !deadline) {
    return jsonError("Cliente, servico e prazo sao obrigatorios.");
  }

  if (price === null || price <= 0) return jsonError("Informe um valor maior que zero.");
  if (validUntil && !isValidDateOnly(validUntil)) return jsonError("Data de validade invalida.");

  if (clientEmail && !isValidEmail(clientEmail)) {
    return jsonError("E-mail do cliente invalido.");
  }

  const subscription = await prisma.planSubscription.upsert({
    where: { userId: session.id },
    create: { userId: session.id, plan: "start" },
    update: {},
  });
  const plan = plans[subscription.plan];
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
