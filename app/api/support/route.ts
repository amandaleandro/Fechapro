import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitError } from "@/lib/rate-limit";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await requireSession();
  const thread = await prisma.supportThread.findFirst({
    where: { userId: session.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, body: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ thread }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!rateLimit(`support:${session.id}`, 20, 60 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as { message?: string; subject?: string };
  const message = cleanString(body.message).slice(0, 2000);
  const subject = cleanOptionalString(body.subject)?.slice(0, 100) || "Suporte";

  if (!message) return jsonError("Escreva sua mensagem para o suporte.");

  const thread = await prisma.$transaction(async (tx) => {
    const existing = await tx.supportThread.findFirst({
      where: { userId: session.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    const current = existing || await tx.supportThread.create({
      data: { userId: session.id, subject },
      select: { id: true },
    });

    await tx.supportMessage.create({
      data: {
        threadId: current.id,
        userId: session.id,
        role: "user",
        body: message,
      },
    });

    return tx.supportThread.update({
      where: { id: current.id },
      data: { status: "open" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: { id: true, role: true, body: true, createdAt: true },
        },
      },
    });
  });

  return NextResponse.json({ thread }, { status: 201 });
}
