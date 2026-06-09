import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { accumulatedProposalLimit, currentMonthRange, plans, publicPlans, type PlanCode } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/session";
import { isValidEmail } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await requireAdmin();

  const { start, end } = currentMonthRange();
  const [users, proposalUsage, artUsage] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscription: true,
        brandProfile: {
          select: {
            businessName: true,
            whatsapp: true,
          },
        },
        _count: {
          select: {
            proposalAssets: true,
            marketingArtAssets: true,
            clientAssets: true,
          },
        },
      },
    }),
    prisma.proposalAsset.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: start, lt: end } },
      _count: { userId: true },
    }),
    prisma.marketingArtAsset.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: start, lt: end } },
      _count: { userId: true },
    }),
  ]);

  const proposalUsageByUser = new Map(proposalUsage.map((row) => [row.userId, row._count.userId]));
  const artUsageByUser = new Map(artUsage.map((row) => [row.userId, row._count.userId]));
  const accumulatedProposalUsage = await Promise.all(
    users.map((user) =>
      prisma.proposalAsset.count({
        where: {
          userId: user.id,
          createdAt: { gte: user.subscription?.startedAt || user.createdAt },
        },
      }),
    ),
  );

  return NextResponse.json(
    {
      plans: [plans.free, ...publicPlans],
      users: users.map((user, index) => {
        const plan = user.subscription?.plan || "start";
        return {
          ...user,
          subscription: user.subscription || {
            plan,
            status: "pending",
            provider: null,
            providerCustomerId: null,
            providerSubscriptionId: null,
            providerCheckoutId: null,
          },
          usage: {
            proposalsThisMonth: proposalUsageByUser.get(user.id) || 0,
            proposalLimit: plans[plan].proposalLimit,
            proposalsUsedSinceSubscriptionStart: accumulatedProposalUsage[index] || 0,
            accumulatedProposalLimit: accumulatedProposalLimit(plans[plan].proposalLimit, user.subscription?.startedAt),
            artsThisMonth: artUsageByUser.get(user.id) || 0,
            artLimit: plans[plan].artLimit,
          },
        };
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

const allowedStatuses = new Set(["active", "trial", "blocked", "pending", "paused", "canceled"]);

export async function POST(request: Request) {
  await requireAdmin();

  const body = (await request.json()) as {
    email?: string;
    name?: string;
    password?: string;
    plan?: PlanCode;
    status?: string;
  };
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password || "";
  const plan = body.plan || "start";
  const status = body.status?.trim().toLowerCase() || "active";

  if (!name || !email || password.length < 8) {
    return jsonError("Informe nome, e-mail e senha com pelo menos 8 caracteres.");
  }

  if (!isValidEmail(email)) {
    return jsonError("Informe um e-mail valido.");
  }

  if (!plans[plan]) {
    return jsonError("Plano inválido.");
  }

  if (!allowedStatuses.has(status)) {
    return jsonError("Status inválido.");
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return jsonError("E-mail já cadastrado.", 409);
  }

  const user = await prisma.$transaction(async (tx) => {
    const passwordHash = await hashPassword(password);
    const created = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    await tx.planSubscription.create({
      data: {
        userId: created.id,
        plan,
        status,
        provider: "admin",
      },
    });

    return created;
  });

  return NextResponse.json({ user }, { status: 201 });
}
