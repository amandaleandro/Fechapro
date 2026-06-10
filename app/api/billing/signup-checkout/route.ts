import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { createSignupPlanCheckout } from "@/lib/mercadopago";
import { isPurchasablePlan, type PlanCode } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { cleanConversionText, trackConversionEvent } from "@/lib/conversion";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    campaign?: string;
    email?: string;
    plan?: PlanCode;
    source?: string;
    variant?: string;
  } | null;
  const plan = body?.plan;
  const email = body?.email?.trim().toLowerCase();
  const origin = new URL(request.url).origin;

  if (!plan || !isPurchasablePlan(plan)) {
    return jsonError("Plano inválido.");
  }
  if (!email || !isValidEmail(email)) {
    return jsonError("Informe um e-mail valido para iniciar a assinatura.");
  }

  try {
    const signupPayment = await prisma.signupPayment.create({
      data: {
        email,
        plan,
        provider: "mercadopago",
        conversionCampaign: cleanConversionText(body?.campaign),
        conversionSource: cleanConversionText(body?.source) || "signup_checkout",
        conversionVariant: cleanConversionText(body?.variant),
        status: "pending",
      },
    });
    const checkout = await createSignupPlanCheckout({
      checkoutId: signupPayment.id,
      email,
      origin,
      plan,
    });

    await prisma.signupPayment.update({
      where: { id: signupPayment.id },
      data: { providerCheckoutId: checkout.id },
    });

    await trackConversionEvent({
      event: "checkout_started",
      plan,
      campaign: body?.campaign,
      source: body?.source || "signup_checkout",
      variant: body?.variant,
      context: "signup_plan_checkout",
      metadata: { checkoutId: signupPayment.id, providerCheckoutId: checkout.id, email },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar o pagamento.";
    return jsonError(message, 502);
  }
}
