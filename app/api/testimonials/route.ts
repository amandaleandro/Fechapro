import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  const items = await prisma.testimonialAsset.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { authorName?: string; company?: string; quote?: string };
  if (!body.authorName?.trim() || !body.quote?.trim()) return jsonError("Nome e depoimento sao obrigatorios.");
  const item = await prisma.testimonialAsset.create({
    data: {
      userId: session.id,
      authorName: body.authorName.trim(),
      company: body.company?.trim() || null,
      quote: body.quote.trim(),
    },
  });
  return NextResponse.json(item, { status: 201 });
}
