import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, isValidHttpUrl } from "@/lib/validation";

export async function GET() {
  const session = await requireSession();
  const items = await prisma.portfolioAsset.findMany({
    where: {
      userId: session.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as {
    title?: string;
    category?: string;
    imageUrl?: string;
  };

  const title = cleanString(body.title);
  const category = cleanOptionalString(body.category);
  const imageUrl = cleanOptionalString(body.imageUrl);

  if (!title) return jsonError("Titulo obrigatorio.");
  if (imageUrl && !isValidHttpUrl(imageUrl) && !imageUrl.startsWith("/")) return jsonError("URL da imagem invalida.");

  const item = await prisma.portfolioAsset.create({
    data: {
      userId: session.id,
      title,
      category,
      imageUrl,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
