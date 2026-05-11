import { NextResponse } from "next/server";
import { jsonError, slugify } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;

  const source = await prisma.proposalAsset.findFirst({
    where: { id, userId: session.id },
  });

  if (!source) {
    return jsonError("Proposta nao encontrada.", 404);
  }

  const copy = await prisma.proposalAsset.create({
    data: {
      userId: session.id,
      clientName: source.clientName,
      clientEmail: source.clientEmail,
      serviceName: source.serviceName,
      price: source.price,
      deadline: source.deadline,
      validUntil: source.validUntil,
      payment: source.payment,
      included: source.included,
      notes: source.notes,
      status: "sent",
      publicSlug: slugify(`${source.clientName}-${source.serviceName}`),
    },
  });

  return NextResponse.json(copy, { status: 201 });
}
