import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { isAdminEmail } from "@/lib/admin";
import { currentMonthRange, plans, publicPlans, type PlanCode } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  const isAdmin = isAdminEmail(session.email);
  const subscription = await prisma.planSubscription.upsert({
    where: { userId: session.id },
    create: isAdmin
      ? { userId: session.id, plan: "premium", status: "active", provider: "admin" }
      : { userId: session.id, plan: "essential", status: "pending" },
    update: isAdmin ? { plan: "premium", status: "active", provider: "admin" } : {},
  });
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
  const usedSinceSubscriptionStart = await prisma.proposalAsset.count({
    where: {
      userId: session.id,
      createdAt: { gte: subscription.startedAt ?? start },
    },
  });
  const accumulatedLimit = plans[subscription.plan].proposalLimit;

  return NextResponse.json({
    subscription,
    plans: publicPlans,
    usage: {
      proposalsThisMonth: usedThisMonth,
      proposalLimit: plans[subscription.plan].proposalLimit,
      proposalsUsedSinceSubscriptionStart: usedSinceSubscriptionStart,
      accumulatedProposalLimit: accumulatedLimit,
    },
  });
}

export async function PUT(request: Request) {
  const session = await requireSession();
  const isAdmin = isAdminEmail(session.email);
  const body = (await request.json()) as { plan?: PlanCode };
  const requestedPlan = isAdmin ? "premium" : body.plan;

  if (!requestedPlan || !plans[requestedPlan]?.public) {
    return jsonError("Plano inválido.");
  }

  const subscription = await prisma.planSubscription.upsert({
    where: { userId: session.id },
    create: {
      userId: session.id,
      plan: requestedPlan,
      status: isAdmin ? "active" : "pending",
      provider: isAdmin ? "admin" : "mercadopago",
    },
    update: {
      plan: requestedPlan,
      status: isAdmin ? "active" : "pending",
      provider: isAdmin ? "admin" : "mercadopago",
    },
  });
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
  const usedSinceSubscriptionStart = await prisma.proposalAsset.count({
    where: {
      userId: session.id,
      createdAt: { gte: subscription.startedAt ?? start },
    },
  });
  const accumulatedLimit = plans[subscription.plan].proposalLimit;

  return NextResponse.json({
    subscription,
    plans: publicPlans,
    usage: {
      proposalsThisMonth: usedThisMonth,
      proposalLimit: plans[subscription.plan].proposalLimit,
      proposalsUsedSinceSubscriptionStart: usedSinceSubscriptionStart,
      accumulatedProposalLimit: accumulatedLimit,
    },
  });
}
