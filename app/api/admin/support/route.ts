import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitError } from "@/lib/rate-limit";
import { cleanString } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await requireAdmin();
  const threads = await prisma.supportThread.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          brandProfile: { select: { businessName: true, whatsapp: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, body: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ threads }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!rateLimit(`admin-support:${admin.id}`, 60, 60 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as { threadId?: string; message?: string; status?: string };
  const threadId = cleanString(body.threadId);
  const message = cleanString(body.message).slice(0, 2000);
  const status = cleanString(body.status || "answered").toLowerCase();

  if (!threadId || !message) return jsonError("Informe a conversa e a resposta.");
  if (!["open", "answered", "closed"].includes(status)) return jsonError("Status inválido.");

  const existing = await prisma.supportThread.findUnique({
    where: { id: threadId },
    select: { id: true },
  });
  if (!existing) return jsonError("Conversa não encontrada.", 404);

  const thread = await prisma.$transaction(async (tx) => {
    await tx.supportMessage.create({
      data: {
        threadId,
        userId: admin.id,
        role: "admin",
        body: message,
      },
    });

    return tx.supportThread.update({
      where: { id: threadId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            brandProfile: { select: { businessName: true, whatsapp: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          select: { id: true, role: true, body: true, createdAt: true },
        },
      },
    });
  });

  return NextResponse.json({ thread });
}
