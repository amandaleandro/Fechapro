import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const item = await prisma.marketingArtAsset.findFirst({
    where: { id, userId: session.id },
  });

  if (!item) return jsonError("Arte não encontrada.", 404);
  if (!item.imageUrl) return jsonError("A arte ainda não foi enviada para aprovação.", 400);

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "approve") return jsonError("Acao invalida.", 400);

  const updated = await prisma.marketingArtAsset.update({
    where: { id },
    data: {
      source: "approved",
      prompt: `${item.prompt}\n\nAprovada pelo cliente em ${new Date().toISOString()}.`,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const item = await prisma.marketingArtAsset.findFirst({
    where: { id, userId: session.id },
  });

  if (!item) return jsonError("Arte não encontrada.", 404);

  await prisma.marketingArtAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
