import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { createSignupPlanCheckout } from "@/lib/mercadopago";
import { plans, type PlanCode } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; plan?: PlanCode } | null;
  const plan = body?.plan;
  const email = body?.email?.trim().toLowerCase();
  const origin = new URL(request.url).origin;

  if (!plan || !plans[plan]?.public) {
    return jsonError("Plano invalido.");
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

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar o pagamento.";
    return jsonError(message, 502);
  }
}
