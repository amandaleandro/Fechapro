import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  const body = (await request.json()) as { title?: string; category?: string | null; imageUrl?: string | null };

  await prisma.portfolioAsset.updateMany({
    where: {
      id,
      userId: session.id,
    },
    data: {
      title: body.title?.trim(),
      category: body.category?.trim() || null,
      imageUrl: body.imageUrl?.trim() || null,
    },
  });

  const item = await prisma.portfolioAsset.findFirst({ where: { id, userId: session.id } });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;

  await prisma.portfolioAsset.deleteMany({
    where: {
      id,
      userId: session.id,
    },
  });

  return NextResponse.json({ ok: true });
}
