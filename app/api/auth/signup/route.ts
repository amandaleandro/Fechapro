import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { sendNewSignupNotificationEmail, sendWelcomeEmail } from "@/lib/email";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSession } from "@/lib/session";
import { verifyTurnstile } from "@/lib/turnstile";
import { isValidEmail } from "@/lib/validation";
import { isBusinessSegment } from "@/lib/proposal-templates";
import { plans, type PlanCode } from "@/lib/plans";
import { trackConversionEvent } from "@/lib/conversion";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as {
    checkoutId?: string;
    email?: string;
    name?: string;
    niche?: string;
    plan?: string;
    segment?: string;
    password?: string;
    turnstileToken?: string;
  };
  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password || "";
  const niche = body.niche?.trim();
  const segment = body.segment?.trim();

  if (!name || !email || !niche || !isBusinessSegment(segment) || password.length < 8) {
    return jsonError("Informe nome, e-mail, nicho, segmento e senha com pelo menos 8 caracteres.");
  }

  if (!isValidEmail(email)) {
    return jsonError("Informe um e-mail valido.");
  }

  if (!(await verifyTurnstile(body.turnstileToken || null))) {
    return jsonError("Não foi possível validar a proteção anti-bot.", 400);
  }

  const checkoutId = body.checkoutId?.trim();
  const requestedPlan = body.plan === "free" ? "free" : null;
  if (!checkoutId && !requestedPlan) {
    return jsonError("Escolha e pague um plano antes de criar a conta.", 402);
  }

  const signupPayment = checkoutId ? await prisma.signupPayment.findUnique({ where: { id: checkoutId } }) : null;
  if (checkoutId) {
    if (!signupPayment || signupPayment.status !== "paid" || signupPayment.claimedAt) {
      return jsonError("Pagamento do plano ainda não confirmado ou já utilizado.", 402);
    }
    if (signupPayment.email && signupPayment.email.toLowerCase() !== email) {
      return jsonError("Use o mesmo e-mail informado no pagamento da assinatura.", 409);
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError("E-mail já cadastrado.", 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, niche, segment, passwordHash },
    });
    await tx.planSubscription.create({
      data: {
        userId: created.id,
        plan: signupPayment?.plan || requestedPlan || "free",
        provider: signupPayment ? "mercadopago" : "admin",
        providerCheckoutId: signupPayment?.providerCheckoutId || null,
        status: "active",
      },
    });
    if (signupPayment) {
      await tx.signupPayment.update({
        where: { id: signupPayment.id },
        data: {
          claimedAt: new Date(),
          email,
          userId: created.id,
        },
      });
    }
    return created;
  });

  const session = { id: user.id, name: user.name, email: user.email };
  await setSession(session);
  await trackConversionEvent({
    event: "signup_created",
    userId: user.id,
    plan: signupPayment?.plan || requestedPlan || "free",
    campaign: signupPayment?.conversionCampaign || null,
    source: signupPayment?.conversionSource || "signup",
    variant: signupPayment?.conversionVariant || null,
    context: checkoutId ? "paid_signup" : "free_signup",
    metadata: { checkoutId: checkoutId || null, segment, niche },
  });
  await sendWelcomeEmail(user.email, user.name);

  const planCode = (signupPayment?.plan || requestedPlan || "free") as PlanCode;
  await sendNewSignupNotificationEmail({
    name: user.name,
    email: user.email,
    planName: plans[planCode]?.name || planCode,
    paid: Boolean(signupPayment),
    niche,
    segment,
  });

  return NextResponse.json(session, { status: 201 });
}
