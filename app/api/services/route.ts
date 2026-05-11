import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  const items = await prisma.serviceAsset.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { name?: string; price?: number; deadline?: string; includes?: string[] };
  if (!body.name?.trim()) return jsonError("Servico obrigatorio.");
  const item = await prisma.serviceAsset.create({
    data: {
      userId: session.id,
      name: body.name.trim(),
      price: Number(body.price || 0),
      deadline: body.deadline?.trim() || null,
      includes: body.includes || [],
    },
  });
  return NextResponse.json(item, { status: 201 });
}
