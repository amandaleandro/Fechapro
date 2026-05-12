import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, isValidHttpUrl } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  const body = (await request.json()) as { title?: string; category?: string | null; imageUrl?: string | null };
  const title = cleanString(body.title);
  const category = cleanOptionalString(body.category);
  const imageUrl = cleanOptionalString(body.imageUrl);

  if (!title) return jsonError("Titulo obrigatorio.");
  if (imageUrl && !isValidHttpUrl(imageUrl) && !imageUrl.startsWith("/")) return jsonError("URL da imagem invalida.");

  await prisma.portfolioAsset.updateMany({
    where: {
      id,
      userId: session.id,
    },
    data: {
      title,
      category,
      imageUrl,
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
