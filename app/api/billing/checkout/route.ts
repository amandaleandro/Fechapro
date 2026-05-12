import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { plans, type PlanCode } from "@/lib/plans";
import { requireSession } from "@/lib/session";
import { createPlanCheckout } from "@/lib/asaas";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { plan?: PlanCode };

  if (!body.plan || !plans[body.plan]) {
    return jsonError("Plano invalido.");
  }

  const plan = plans[body.plan];
  const origin = new URL(request.url).origin;

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
        provider: "asaas",
        providerCheckoutId: checkout.id,
        status: "pending",
      },
      update: {
        plan: body.plan,
        provider: "asaas",
        providerCheckoutId: checkout.id,
        status: "pending",
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar o pagamento.";
    return jsonError(message, 502);
  }
}
