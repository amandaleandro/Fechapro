import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/session";
import { decodeResetToken, verifyResetToken } from "@/lib/token";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`reset:${ip}`, 10, 15 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as { token?: string; password?: string };
  const token = body.token?.trim();
  const password = body.password || "";

  if (!token || password.length < 8) {
    return jsonError("Token e senha com pelo menos 8 caracteres são obrigatórios.");
  }

  const decoded = decodeResetToken(token);
  if (!decoded) {
    return jsonError("Link inválido ou expirado.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, passwordHash: true },
  });

  if (!user?.passwordHash || !verifyResetToken(token, user.passwordHash)) {
    return jsonError("Link inválido ou expirado.", 400);
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
