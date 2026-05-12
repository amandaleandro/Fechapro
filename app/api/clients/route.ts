import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
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
  const body = (await request.json()) as { name?: string; email?: string; phone?: string; segment?: string };
  const name = cleanString(body.name);
  const email = cleanOptionalString(body.email);
  const phone = cleanOptionalString(body.phone);
  const segment = cleanOptionalString(body.segment);

  if (!name) return jsonError("Nome obrigatório.");
  if (email && !isValidEmail(email)) return jsonError("E-mail inválido.");
  if (phone && !isValidPhone(phone)) return jsonError("Telefone inválido.");

  const item = await prisma.clientAsset.create({
    data: {
      userId: session.id,
      name,
      email,
      phone,
      segment,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
