import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { currentMonthRange, plans, type PlanCode } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  const subscription = await prisma.planSubscription.upsert({
    where: { userId: session.id },
    create: { userId: session.id, plan: "start" },
    update: {},
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

  return NextResponse.json({
    subscription,
    plans: Object.values(plans),
    usage: {
      proposalsThisMonth: usedThisMonth,
      proposalLimit: plans[subscription.plan].proposalLimit,
    },
  });
}

export async function PUT(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { plan?: PlanCode };

  if (!body.plan || !plans[body.plan]) {
    return jsonError("Plano inválido.");
  }

  const subscription = await prisma.planSubscription.upsert({
    where: { userId: session.id },
    create: { userId: session.id, plan: body.plan, status: "active" },
    update: { plan: body.plan, status: "active" },
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

  return NextResponse.json({
    subscription,
    plans: Object.values(plans),
    usage: {
      proposalsThisMonth: usedThisMonth,
      proposalLimit: plans[subscription.plan].proposalLimit,
    },
  });
}
