import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { artPacks, plans, type ArtPackCode, type PlanCode } from "@/lib/plans";
import { requireSession } from "@/lib/session";
import { createArtPackCheckout, createPlanCheckout } from "@/lib/asaas";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { artPack?: ArtPackCode; plan?: PlanCode };
  const origin = new URL(request.url).origin;

  if (body.artPack) {
    if (!artPacks[body.artPack]) {
      return jsonError("Pacote de artes invalido.");
    }

    try {
      const checkout = await createArtPackCheckout({
        origin,
        pack: body.artPack,
        userEmail: session.email,
        userId: session.id,
      });

      await prisma.artCreditPurchase.create({
        data: {
          userId: session.id,
          pack: body.artPack,
          credits: artPacks[body.artPack].credits,
          provider: "asaas",
          providerCheckoutId: checkout.id,
          status: "pending",
        },
      });

      await prisma.planSubscription.upsert({
        where: { userId: session.id },
        create: {
          userId: session.id,
          plan: "start",
          status: "pending",
        },
        update: {},
      });

      return NextResponse.json({ url: checkout.url });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel criar o pagamento.";
      return jsonError(message, 502);
    }
  }

  if (!body.plan || !plans[body.plan]) {
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
    const message = error instanceof Error ? error.message : "Não foi possível criar o pagamento.";
    return jsonError(message, 502);
  }
}
