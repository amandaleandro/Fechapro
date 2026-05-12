import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, cleanStringList, normalizePrice } from "@/lib/validation";

export async function GET() {
  const session = await requireSession();
  const items = await prisma.serviceAsset.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { name?: string; price?: number; deadline?: string; includes?: string[] };
  const name = cleanString(body.name);
  const price = normalizePrice(body.price);

  if (!name) return jsonError("Servico obrigatorio.");
  if (price === null || price < 0) return jsonError("Informe um valor valido para o servico.");

  const item = await prisma.serviceAsset.create({
    data: {
      userId: session.id,
      name,
      price,
      deadline: cleanOptionalString(body.deadline),
      includes: cleanStringList(body.includes),
    },
  });
  return NextResponse.json(item, { status: 201 });
}
