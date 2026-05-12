import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSession } from "@/lib/session";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { isValidEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as { name?: string; email?: string; password?: string; turnstileToken?: string };
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password || "";

  if (!name || !email || password.length < 8) {
    return jsonError("Informe nome, e-mail e senha com pelo menos 8 caracteres.");
  }

  if (!isValidEmail(email)) {
    return jsonError("Informe um e-mail valido.");
  }

  if (!(await verifyTurnstile(body.turnstileToken || null))) {
    return jsonError("Nao foi possivel validar a protecao anti-bot.", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError("E-mail ja cadastrado.", 409);
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: hashPassword(password) },
  });

  const session = { id: user.id, name: user.name, email: user.email };
  await setSession(session);
  return NextResponse.json(session, { status: 201 });
}
