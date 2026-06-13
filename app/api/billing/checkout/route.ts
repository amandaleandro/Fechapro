import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { isPurchasablePlan, plans, type PlanCode } from "@/lib/plans";
import { requireSession } from "@/lib/session";
import { createPlanCheckout } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { cleanConversionText, trackConversionEvent } from "@/lib/conversion";

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as {
    campaign?: string;
    plan?: PlanCode;
    source?: string;
    variant?: string;
  };
  const origin = new URL(request.url).origin;

  if (!body.plan || !isPurchasablePlan(body.plan)) {
    return jsonError("Plano inválido.");
  }

  const plan = plans[body.plan];

  try {
    const checkout = await createPlanCheckout({
      origin,
      plan: plan.code,
      userEmail: session.email,
      userId: session.id,
    });

    await prisma.planSubscription.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        plan: body.plan,
        provider: "mercadopago",
        providerCheckoutId: checkout.id,
        conversionCampaign: cleanConversionText(body.campaign),
        conversionSource: cleanConversionText(body.source) || "authenticated_checkout",
        conversionVariant: cleanConversionText(body.variant),
        status: "pending",
      },
      update: {
        plan: body.plan,
        provider: "mercadopago",
        providerCheckoutId: checkout.id,
        conversionCampaign: cleanConversionText(body.campaign),
        conversionSource: cleanConversionText(body.source) || "authenticated_checkout",
        conversionVariant: cleanConversionText(body.variant),
        status: "pending",
      },
    });

    await trackConversionEvent({
      event: "checkout_started",
      userId: session.id,
      plan: body.plan,
      campaign: body.campaign,
      source: body.source || "authenticated_checkout",
      variant: body.variant,
      context: "plan_checkout",
      metadata: { checkoutId: checkout.id },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar o pagamento.";
    return jsonError(message, 502);
  }
}
