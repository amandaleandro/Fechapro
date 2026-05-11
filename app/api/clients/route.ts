import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  const items = await prisma.clientAsset.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { name?: string; email?: string; phone?: string; segment?: string };
  if (!body.name?.trim()) return jsonError("Nome obrigatorio.");
  const item = await prisma.clientAsset.create({
    data: {
      userId: session.id,
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      segment: body.segment?.trim() || null,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
