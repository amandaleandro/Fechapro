import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { currentMonthRange, plans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

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

  return NextResponse.json(
    {
      plans: Object.values(plans),
      users: users.map((user) => {
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
            artsThisMonth: artUsageByUser.get(user.id) || 0,
            artLimit: plans[plan].artLimit,
          },
        };
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
