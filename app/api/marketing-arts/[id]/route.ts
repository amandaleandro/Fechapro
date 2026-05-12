import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const item = await prisma.marketingArtAsset.findFirst({
    where: { id, userId: session.id },
  });

  if (!item) return jsonError("Arte nao encontrada.", 404);

  await prisma.marketingArtAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
