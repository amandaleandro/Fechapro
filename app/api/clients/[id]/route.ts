import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  const body = (await request.json()) as { name?: string; email?: string; phone?: string; segment?: string };

  await prisma.clientAsset.updateMany({
    where: { id, userId: session.id },
    data: {
      name: body.name?.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      segment: body.segment?.trim() || null,
    },
  });

  const item = await prisma.clientAsset.findFirst({ where: { id, userId: session.id } });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  await prisma.clientAsset.deleteMany({ where: { id, userId: session.id } });
  return NextResponse.json({ ok: true });
}
