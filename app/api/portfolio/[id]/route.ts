import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, isValidHttpUrl } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  const body = (await request.json()) as { title?: string; category?: string | null; description?: string | null; imageUrl?: string | null };
  const title = cleanString(body.title);
  const category = cleanOptionalString(body.category);
  const description = cleanOptionalString(body.description);
  const imageUrl = cleanOptionalString(body.imageUrl);

  if (!title) return jsonError("Título obrigatório.");
  if (imageUrl && !isValidHttpUrl(imageUrl) && !imageUrl.startsWith("/")) return jsonError("URL da imagem inválida.");

  await prisma.portfolioAsset.updateMany({
    where: {
      id,
      userId: session.id,
    },
    data: {
      title,
      category,
      description,
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
