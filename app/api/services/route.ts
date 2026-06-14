import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { FREE_SERVICE_LIMIT } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, cleanStringList, isValidHttpUrl, normalizePrice } from "@/lib/validation";

export async function GET() {
  const session = await requireSession();
  const items = await prisma.serviceAsset.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { name?: string; price?: number; deadline?: string; includes?: string[]; imageUrl?: string | null; active?: boolean };
  const name = cleanString(body.name);
  const price = normalizePrice(body.price);
  const imageUrl = cleanOptionalString(body.imageUrl);

  if (!name) return jsonError("Serviço obrigatório.");
  if (price === null || price < 0) return jsonError("Informe um valor válido para o serviço.");

  if (imageUrl && !isValidHttpUrl(imageUrl) && !imageUrl.startsWith("/")) return jsonError("URL da imagem inválida.");

  // Evita serviços duplicados no catálogo (mesmo nome, ignorando maiúsculas/minúsculas).
  // Acontecia ao salvar uma proposta com um serviço já existente: retorna o serviço atual em vez de criar outro.
  const existing = await prisma.serviceAsset.findFirst({
    where: { userId: session.id, name: { equals: name, mode: "insensitive" } },
  });
  if (existing) return NextResponse.json(existing, { status: 200 });

  const subscription = await prisma.planSubscription.findUnique({ where: { userId: session.id }, select: { plan: true } });
  if (subscription?.plan === "free") {
    const total = await prisma.serviceAsset.count({ where: { userId: session.id } });
    if (total >= FREE_SERVICE_LIMIT) return jsonError(`Plano grátis permite cadastrar até ${FREE_SERVICE_LIMIT} serviços.`, 402);
  }

  const item = await prisma.serviceAsset.create({
    data: {
      userId: session.id,
      name,
      price,
      deadline: cleanOptionalString(body.deadline),
      includes: cleanStringList(body.includes),
      imageUrl,
      active: body.active === undefined ? true : Boolean(body.active),
    },
  });
  return NextResponse.json(item, { status: 201 });
}
