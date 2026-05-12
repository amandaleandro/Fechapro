import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString } from "@/lib/validation";

export async function GET() {
  const session = await requireSession();
  const items = await prisma.testimonialAsset.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { authorName?: string; company?: string; quote?: string };
  const authorName = cleanString(body.authorName);
  const quote = cleanString(body.quote);

  if (!authorName || !quote) return jsonError("Nome e depoimento sao obrigatorios.");

  const item = await prisma.testimonialAsset.create({
    data: {
      userId: session.id,
      authorName,
      company: cleanOptionalString(body.company),
      quote,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
