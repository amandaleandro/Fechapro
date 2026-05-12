import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, cleanStringList, normalizePrice } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  const body = (await request.json()) as { name?: string; price?: number; deadline?: string; includes?: string[] };
  const name = cleanString(body.name);
  const price = normalizePrice(body.price);

  if (!name) return jsonError("Serviço obrigatório.");
  if (price === null || price < 0) return jsonError("Informe um valor válido para o serviço.");

  await prisma.serviceAsset.updateMany({
    where: { id, userId: session.id },
    data: {
      name,
      price,
      deadline: cleanOptionalString(body.deadline),
      includes: cleanStringList(body.includes),
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
