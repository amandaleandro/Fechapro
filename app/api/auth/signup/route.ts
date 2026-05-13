import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { sendWelcomeEmail } from "@/lib/email";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSession } from "@/lib/session";
import { verifyTurnstile } from "@/lib/turnstile";
import { isValidEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as {
    checkoutId?: string;
    email?: string;
    name?: string;
    password?: string;
    turnstileToken?: string;
  };
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

  const checkoutId = body.checkoutId?.trim();
  if (!checkoutId) {
    return jsonError("Escolha e pague um plano antes de criar a conta.", 402);
  }

  const signupPayment = await prisma.signupPayment.findUnique({ where: { id: checkoutId } });
  if (!signupPayment || signupPayment.status !== "paid" || signupPayment.claimedAt) {
    return jsonError("Pagamento do plano ainda nao confirmado ou ja utilizado.", 402);
  }
  if (signupPayment.email && signupPayment.email.toLowerCase() !== email) {
    return jsonError("Use o mesmo e-mail informado no pagamento da assinatura.", 409);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError("E-mail ja cadastrado.", 409);
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, passwordHash: hashPassword(password) },
    });
    await tx.planSubscription.create({
      data: {
        userId: created.id,
        plan: signupPayment.plan,
        provider: "mercadopago",
        providerCheckoutId: signupPayment.providerCheckoutId,
        status: "active",
      },
    });
    await tx.signupPayment.update({
      where: { id: signupPayment.id },
      data: {
        claimedAt: new Date(),
        email,
        userId: created.id,
      },
    });
    return created;
  });

  const session = { id: user.id, name: user.name, email: user.email };
  await setSession(session);
  await sendWelcomeEmail(user.email, user.name);
  return NextResponse.json(session, { status: 201 });
}
