import { NextResponse } from "next/server";
import { jsonError, slugify } from "@/lib/api";
import { sendProposalSentToClientEmail } from "@/lib/email";
import { currentMonthRange, plans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

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

  if (!body.clientName?.trim() || !body.serviceName?.trim() || !body.deadline?.trim()) {
    return jsonError("Cliente, servico e prazo sao obrigatorios.");
  }

  const price = Number(body.price ?? 0);
  if (price < 0) return jsonError("O valor nao pode ser negativo.");

  const clientEmail = body.clientEmail?.trim() || null;
  if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
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
      clientName: body.clientName.trim(),
      clientEmail,
      serviceName: body.serviceName.trim(),
      price,
      deadline: body.deadline.trim(),
      validUntil: body.validUntil || null,
      payment: body.payment?.trim() || null,
      included: body.included || [],
      notes: body.notes?.trim() || null,
      status: body.status || "sent",
      publicSlug: slugify(`${body.clientName}-${body.serviceName}`),
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
