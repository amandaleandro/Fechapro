import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, isValidEmail, isValidPhone } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
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

  await prisma.clientAsset.updateMany({
    where: { id, userId: session.id },
    data: {
      name,
      email,
      phone,
      segment,
      interestService,
      status,
      notes,
    },
  });

  const item = await prisma.clientAsset.findFirst({ where: { id, userId: session.id } });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  await prisma.clientAsset.deleteMany({ where: { id, userId: session.id } });
  return NextResponse.json({ ok: true });
}
