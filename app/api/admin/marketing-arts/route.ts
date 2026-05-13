import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await requireAdmin();

  const items = await prisma.marketingArtAsset.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          brandProfile: {
            select: {
              businessName: true,
              whatsapp: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(items, { headers: { "Cache-Control": "no-store" } });
}
