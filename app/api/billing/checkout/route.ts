import { NextResponse } from "next/server";
import { createAbacateCheckout, createAbacateProduct } from "@/lib/abacatepay";
import { jsonError } from "@/lib/api";
import { plans, type PlanCode } from "@/lib/plans";
import { requireSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { plan?: PlanCode };

  if (!body.plan || !plans[body.plan]) {
    return jsonError("Plano invalido.");
  }

  const plan = plans[body.plan];
  const origin = new URL(request.url).origin;
  const productExternalId = `fechapro-plan-${plan.code}`;
  const checkoutExternalId = `fechapro-plan-${session.id}-${plan.code}-${Date.now()}`;

  try {
    const product = await createAbacateProduct({
      description: `${plan.name} do FechaPro com limite de ${plan.proposalLimit} propostas por mes.`,
      externalId: productExternalId,
      name: `FechaPro ${plan.name}`,
      price: plan.priceCents,
    });

    const checkout = await createAbacateCheckout({
      completionUrl: `${origin}/?payment=success&plan=${plan.code}`,
      externalId: checkoutExternalId,
      metadata: {
        plan: plan.code,
        userId: session.id,
      },
      productId: product.id,
      returnUrl: `${origin}/`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar o pagamento.";
    return jsonError(message, 502);
  }
}
