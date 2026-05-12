import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { currentMonthRange } from "@/lib/plans";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await requireSession();

  const { start, end } = currentMonthRange();

  const [allTime, thisMonth] = await Promise.all([
    prisma.proposalAsset.groupBy({
      by: ["status"],
      where: { userId: session.id },
      _count: { status: true },
      _sum: { price: true },
    }),
    prisma.proposalAsset.groupBy({
      by: ["status"],
      where: { userId: session.id, createdAt: { gte: start, lt: end } },
      _count: { status: true },
      _sum: { price: true },
    }),
  ]);

  function sumByStatus(rows: typeof allTime) {
    const counts: Record<string, number> = {};
    const values: Record<string, number> = {};
    for (const row of rows) {
      counts[row.status] = row._count.status;
      values[row.status] = row._sum.price ?? 0;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const accepted = counts.accepted ?? 0;
    const totalValue = Object.values(values).reduce((a, b) => a + b, 0);
    const acceptedValue = values.accepted ?? 0;
    return {
      total,
      draft: counts.draft ?? 0,
      sent: counts.sent ?? 0,
      viewed: counts.viewed ?? 0,
      awaitingResponse: counts.awaiting_response ?? 0,
      accepted,
      declined: counts.declined ?? 0,
      expired: counts.expired ?? 0,
      acceptRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      totalValueCents: totalValue,
      acceptedValueCents: acceptedValue,
    };
  }

  return NextResponse.json(
    {
      allTime: sumByStatus(allTime),
      thisMonth: sumByStatus(thisMonth),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
