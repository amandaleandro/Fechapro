import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  const body = (await request.json()) as { authorName?: string; company?: string | null; quote?: string };
  const authorName = cleanString(body.authorName);
  const quote = cleanString(body.quote);

  if (!authorName || !quote) return jsonError("Nome e depoimento são obrigatórios.");

  await prisma.testimonialAsset.updateMany({
    where: { id, userId: session.id },
    data: {
      authorName,
      company: cleanOptionalString(body.company),
      quote,
    },
  });

  const item = await prisma.testimonialAsset.findFirst({ where: { id, userId: session.id } });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;
  await prisma.testimonialAsset.deleteMany({ where: { id, userId: session.id } });
  return NextResponse.json({ ok: true });
}
