import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const ALLOWED_STATUSES = ["sent", "viewed", "accepted", "declined", "expired"] as const;
type AllowedStatus = typeof ALLOWED_STATUSES[number];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  const body = (await request.json()) as { status?: string };

  if (body.status !== undefined && !ALLOWED_STATUSES.includes(body.status as AllowedStatus)) {
    return jsonError("Status invalido.");
  }

  await prisma.proposalAsset.updateMany({
    where: { id, userId: session.id },
    data: { status: body.status as AllowedStatus | undefined },
  });
  const item = await prisma.proposalAsset.findFirst({ where: { id, userId: session.id } });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  await prisma.proposalAsset.deleteMany({ where: { id, userId: session.id } });
  return NextResponse.json({ ok: true });
}
