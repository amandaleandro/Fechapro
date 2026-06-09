import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { FREE_CLIENT_LIMIT } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, isValidEmail, isValidPhone } from "@/lib/validation";

export async function GET() {
  const session = await requireSession();
  const items = await prisma.clientAsset.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { interestService?: string; name?: string; email?: string; notes?: string; phone?: string; segment?: string; status?: string };
  const name = cleanString(body.name);
  const email = cleanOptionalString(body.email);
  const phone = cleanOptionalString(body.phone);
  const segment = cleanOptionalString(body.segment);
  const interestService = cleanOptionalString(body.interestService);
  const status = cleanOptionalString(body.status) || "lead";
  const notes = cleanOptionalString(body.notes);

  if (!name) return jsonError("Nome obrigatório.");
  if (email && !isValidEmail(email)) return jsonError("E-mail inválido.");
  if (phone && !isValidPhone(phone)) return jsonError("Telefone inválido.");

  const subscription = await prisma.planSubscription.findUnique({ where: { userId: session.id }, select: { plan: true } });
  if (subscription?.plan === "free") {
    const total = await prisma.clientAsset.count({ where: { userId: session.id } });
    if (total >= FREE_CLIENT_LIMIT) return jsonError(`Plano grátis permite cadastrar até ${FREE_CLIENT_LIMIT} clientes.`, 402);
  }

  const item = await prisma.clientAsset.create({
    data: {
      userId: session.id,
      name,
      email,
      phone,
      segment,
      interestService,
      status,
      notes,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
