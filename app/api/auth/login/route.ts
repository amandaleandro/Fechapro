import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { setSession, verifyPassword } from "@/lib/session";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";
import { isAdminEmail } from "@/lib/admin";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return jsonError("Informe e-mail e senha.");
  }

  if (!isValidEmail(email)) {
    return jsonError("Informe um e-mail válido.");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError("Credenciais inválidas.", 401);
  }

  const session = { id: user.id, name: user.name, email: user.email };
  await setSession(session);
  return NextResponse.json({ ...session, isAdmin: isAdminEmail(user.email) });
}
