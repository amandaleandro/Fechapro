import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

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

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Titulo obrigatorio." }, { status: 400 });
  }

  const item = await prisma.portfolioAsset.create({
    data: {
      userId: session.id,
      title: body.title.trim(),
      category: body.category?.trim() || null,
      imageUrl: body.imageUrl?.trim() || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
