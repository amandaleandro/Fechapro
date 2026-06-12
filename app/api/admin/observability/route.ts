import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getHealthReport } from "@/lib/observability";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await requireAdmin();

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    health,
    access24h,
    conversions24h,
    proposals24h,
    paidProposals24h,
    signupPayments24h,
    supportOpen,
    failedProposalPayments7d,
    failedSignupPayments7d,
  ] = await Promise.all([
    getHealthReport(),
    prisma.accessEvent.count({ where: { createdAt: { gte: last24h } } }),
    prisma.conversionEvent.groupBy({
      by: ["event"],
      where: { createdAt: { gte: last24h } },
      _count: { event: true },
      orderBy: { _count: { event: "desc" } },
    }),
    prisma.proposalAsset.count({ where: { createdAt: { gte: last24h } } }),
    prisma.proposalAsset.count({ where: { paymentStatus: "paid", paymentPaidAt: { gte: last24h } } }),
    prisma.signupPayment.count({ where: { createdAt: { gte: last24h } } }),
    prisma.supportThread.count({ where: { status: "open" } }),
    prisma.proposalAsset.count({ where: { paymentStatus: "failed", paymentUpdatedAt: { gte: last7d } } }),
    prisma.signupPayment.count({ where: { status: "canceled", updatedAt: { gte: last7d } } }),
  ]);

  return NextResponse.json(
    {
      generatedAt: now.toISOString(),
      health,
      windows: {
        last24h: {
          accessEvents: access24h,
          conversionEvents: Object.fromEntries(conversions24h.map((item) => [item.event, item._count.event])),
          proposalsCreated: proposals24h,
          proposalPaymentsApproved: paidProposals24h,
          signupPaymentsCreated: signupPayments24h,
        },
        last7d: {
          failedProposalPayments: failedProposalPayments7d,
          failedSignupPayments: failedSignupPayments7d,
        },
      },
      queues: {
        openSupportThreads: supportOpen,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
