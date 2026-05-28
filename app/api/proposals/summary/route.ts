import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await requireSession();

  const total = await prisma.proposalAsset.count({ where: { userId: session.id } });
  const accepted = await prisma.proposalAsset.count({ where: { userId: session.id, status: "accepted" } });
  const sent = await prisma.proposalAsset.count({ where: { userId: session.id, status: { not: "draft" } } });
  const viewed = await prisma.proposalAsset.count({ where: { userId: session.id, status: "viewed" } });
  const awaitingResponse = await prisma.proposalAsset.count({ where: { userId: session.id, status: "awaiting_response" } });
  const declined = await prisma.proposalAsset.count({ where: { userId: session.id, status: "declined" } });
  const expired = await prisma.proposalAsset.count({ where: { userId: session.id, status: "expired" } });

  const acceptedValueAgg = await prisma.proposalAsset.aggregate({ where: { userId: session.id, status: "accepted" }, _sum: { price: true } });
  const acceptedValue = acceptedValueAgg._sum.price || 0;
  const sentValueAgg = await prisma.proposalAsset.aggregate({ where: { userId: session.id, status: { not: "draft" } }, _sum: { price: true } });
  const sentValue = sentValueAgg._sum.price || 0;

  const totalViewsAgg = await prisma.proposalAsset.aggregate({ where: { userId: session.id }, _sum: { viewCount: true } });
  const totalViews = totalViewsAgg._sum.viewCount || 0;
  const whatsappClicksAgg = await prisma.proposalAsset.aggregate({ where: { userId: session.id }, _sum: { whatsappClickCount: true } });
  const whatsappClicks = whatsappClicksAgg._sum.whatsappClickCount || 0;

  // follow-up samples: proposals in sent/viewed/awaiting_response and older than 2 days
  const threshold = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const followUps = await prisma.proposalAsset.findMany({
    where: {
      userId: session.id,
      status: { in: ["sent", "viewed", "awaiting_response"] },
      OR: [{ updatedAt: { lte: threshold } }, { createdAt: { lte: threshold } }],
    },
    orderBy: { updatedAt: "desc" },
    take: 3,
  });

  const openValueAgg = await prisma.proposalAsset.aggregate({
    where: { userId: session.id, status: { in: ["sent", "viewed", "awaiting_response"] } },
    _sum: { price: true },
  });
  const openValue = openValueAgg._sum.price || 0;

  const acceptanceRate = total ? Math.round((accepted / total) * 100) : 0;

  return NextResponse.json(
    {
      total,
      accepted,
      sent,
      viewed,
      awaitingResponse,
      declined,
      expired,
      acceptedValue,
      sentValue,
      openValue,
      totalViews,
      whatsappClicks,
      acceptanceRate,
      followUps,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
