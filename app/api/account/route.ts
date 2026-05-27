import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireSession, setSession, verifyPassword } from "@/lib/session";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";
import { isBusinessSegment } from "@/lib/proposal-templates";

export async function PUT(request: Request) {
  const session = await requireSession();
  const ip = getClientIp(request);
  if (!rateLimit(`account:${session.id}:${ip}`, 20, 15 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    niche?: string;
    segment?: string;
    currentPassword?: string;
    newPassword?: string;
  };
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";
  const niche = body.niche?.trim();
  const segment = body.segment?.trim();

  if (!name || !email || !niche || !isBusinessSegment(segment)) {
    return jsonError("Informe nome, e-mail, nicho e segmento.");
  }

  if (!isValidEmail(email)) {
    return jsonError("Informe um e-mail válido.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user) {
    return jsonError("Usuário não encontrado.", 404);
  }

  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return jsonError("Este e-mail já está em uso.", 409);
  }

  const shouldChangePassword = Boolean(newPassword);
  if (shouldChangePassword) {
    if (newPassword.length < 8) {
      return jsonError("A nova senha precisa ter pelo menos 8 caracteres.");
    }

    if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return jsonError("Senha atual incorreta.", 401);
    }
  }

  const passwordHash = shouldChangePassword ? await hashPassword(newPassword) : undefined;

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: {
      name,
      email,
      niche,
      segment,
      ...(passwordHash ? { passwordHash } : {}),
    },
    select: { id: true, name: true, email: true, niche: true, segment: true },
  });

  await setSession(updated);
  return NextResponse.json(updated);
}
