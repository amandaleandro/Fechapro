import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function PATCH(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { ids?: string[] };

  if (!Array.isArray(body.ids) || !body.ids.length) return jsonError("Lista de itens inválida.");

  const items = await prisma.portfolioAsset.findMany({
    where: { userId: session.id, id: { in: body.ids } },
    select: { id: true },
  });

  if (items.length !== body.ids.length) return jsonError("Lista de itens inválida.");

  await prisma.$transaction(
    body.ids.map((id, index) =>
      prisma.portfolioAsset.update({
        where: { id },
        data: { order: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
