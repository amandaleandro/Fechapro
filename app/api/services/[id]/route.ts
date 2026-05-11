import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  const body = (await request.json()) as { name?: string; price?: number; deadline?: string; includes?: string[] };

  await prisma.serviceAsset.updateMany({
    where: { id, userId: session.id },
    data: {
      name: body.name?.trim(),
      price: Number(body.price || 0),
      deadline: body.deadline?.trim() || null,
      includes: body.includes || [],
    },
  });

  const item = await prisma.serviceAsset.findFirst({ where: { id, userId: session.id } });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  await prisma.serviceAsset.deleteMany({ where: { id, userId: session.id } });
  return NextResponse.json({ ok: true });
}
