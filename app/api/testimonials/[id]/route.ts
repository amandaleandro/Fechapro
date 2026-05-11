import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  const body = (await request.json()) as { authorName?: string; company?: string | null; quote?: string };

  await prisma.testimonialAsset.updateMany({
    where: { id, userId: session.id },
    data: {
      authorName: body.authorName?.trim(),
      company: body.company?.trim() || null,
      quote: body.quote?.trim(),
    },
  });

  const item = await prisma.testimonialAsset.findFirst({ where: { id, userId: session.id } });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  await prisma.testimonialAsset.deleteMany({ where: { id, userId: session.id } });
  return NextResponse.json({ ok: true });
}
