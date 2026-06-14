import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { FREE_PORTFOLIO_LIMIT } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, isValidHttpUrl } from "@/lib/validation";

export async function GET() {
  const session = await requireSession();
  const items = await prisma.portfolioAsset.findMany({
    where: {
      userId: session.id,
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as {
    title?: string;
    category?: string;
    description?: string;
    imageUrl?: string;
  };

  const title = cleanString(body.title);
  const category = cleanOptionalString(body.category);
  const description = cleanOptionalString(body.description);
  const imageUrl = cleanOptionalString(body.imageUrl);

  if (!title) return jsonError("Título obrigatório.");
  if (imageUrl && !isValidHttpUrl(imageUrl) && !imageUrl.startsWith("/")) return jsonError("URL da imagem inválida.");

  const subscription = await prisma.planSubscription.findUnique({ where: { userId: session.id }, select: { plan: true } });
  if (subscription?.plan === "free") {
    const total = await prisma.portfolioAsset.count({ where: { userId: session.id } });
    if (total >= FREE_PORTFOLIO_LIMIT) return jsonError(`Plano grátis permite cadastrar até ${FREE_PORTFOLIO_LIMIT} fotos no portfólio da proposta.`, 402);
  }

  const lowestOrder = await prisma.portfolioAsset.aggregate({
    where: { userId: session.id },
    _min: { order: true },
  });

  const item = await prisma.portfolioAsset.create({
    data: {
      userId: session.id,
      title,
      category,
      description,
      imageUrl,
      order: (lowestOrder._min.order ?? 0) - 1,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
