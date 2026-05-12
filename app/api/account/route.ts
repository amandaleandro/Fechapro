import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireSession, setSession, verifyPassword } from "@/lib/session";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";

export async function PUT(request: Request) {
  const session = await requireSession();
  const ip = getClientIp(request);
  if (!rateLimit(`account:${session.id}:${ip}`, 20, 15 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  };
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const currentPassword = body.currentPassword || "";
  const newPassword = body.newPassword || "";

  if (!name || !email) {
    return jsonError("Informe nome e e-mail.");
  }

  if (!isValidEmail(email)) {
    return jsonError("Informe um e-mail valido.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user) {
    return jsonError("Usuario nao encontrado.", 404);
  }

  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return jsonError("Este e-mail ja esta em uso.", 409);
  }

  const shouldChangePassword = Boolean(newPassword);
  if (shouldChangePassword) {
    if (newPassword.length < 8) {
      return jsonError("A nova senha precisa ter pelo menos 8 caracteres.");
    }

    if (!user.passwordHash || !verifyPassword(currentPassword, user.passwordHash)) {
      return jsonError("Senha atual incorreta.", 401);
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: {
      name,
      email,
      ...(shouldChangePassword ? { passwordHash: hashPassword(newPassword) } : {}),
    },
    select: { id: true, name: true, email: true },
  });

  await setSession(updated);
  return NextResponse.json(updated);
}
