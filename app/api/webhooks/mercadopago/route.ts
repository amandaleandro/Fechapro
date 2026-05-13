import { NextResponse } from "next/server";
import { getMercadoPagoPayment, getMercadoPagoSubscription, verifyMercadoPagoWebhook } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { sendProposalPushNotification } from "@/lib/push";

type MercadoPagoWebhookPayload = {
  action?: string;
  type?: string;
  data?: {
    id?: string;
  };
};

export async function POST(request: Request) {
  try {
    verifyMercadoPagoWebhook(request.url);
  } catch {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as MercadoPagoWebhookPayload | null;
  const eventId = payload?.data?.id;
  const type = payload?.type || payload?.action;

  if (!eventId) {
    return NextResponse.json({ received: true });
  }

  if (type && String(type).includes("preapproval")) {
    const subscription = await getMercadoPagoSubscription(eventId);
    const reference = subscription.external_reference || "";
    const active = subscription.status === "authorized";
    const pending = subscription.status === "pending";
    const inactive = ["cancelled", "canceled", "paused"].includes(subscription.status);

    if (reference.startsWith("subscription:")) {
      const [, userId] = reference.split(":");
      const plan = reference.split(":")[2];
      const current = await prisma.planSubscription.findUnique({ where: { userId } });
      if (!current) return NextResponse.json({ received: true });

      if (active) {
        await prisma.planSubscription.update({
          where: { id: current.id },
          data: { provider: "mercadopago", providerSubscriptionId: subscription.id, status: "active" },
        });
      } else if (pending) {
        await prisma.planSubscription.update({
          where: { id: current.id },
          data: { providerSubscriptionId: subscription.id, status: "pending" },
        });
      } else if (inactive) {
        await prisma.planSubscription.update({
          where: { id: current.id },
          data: { status: "canceled" },
        });
      }
      return NextResponse.json({ received: true, plan });
    }

    if (reference.startsWith("signup_plan:")) {
      const checkoutId = reference.replace("signup_plan:", "");
      const signupPayment = await prisma.signupPayment.findUnique({ where: { id: checkoutId } });
      if (!signupPayment) return NextResponse.json({ received: true });

      if (active) {
        await prisma.signupPayment.update({
          where: { id: signupPayment.id },
          data: { paidAt: new Date(), providerCheckoutId: subscription.id, status: "paid" },
        });
      } else if (pending) {
        await prisma.signupPayment.update({
          where: { id: signupPayment.id },
          data: { providerCheckoutId: subscription.id, status: "pending" },
        });
      } else if (inactive) {
        await prisma.signupPayment.update({
          where: { id: signupPayment.id },
          data: { status: "canceled" },
        });
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  }

  if (type && !String(type).includes("payment")) {
    return NextResponse.json({ received: true });
  }

  const payment = await getMercadoPagoPayment(eventId);
  const reference = payment.external_reference || "";
  const paid = payment.status === "approved";
  const pending = payment.status === "pending" || payment.status === "in_process";
  const failed = ["cancelled", "rejected", "refunded", "charged_back"].includes(payment.status);

  if (reference.startsWith("proposal:")) {
    const publicSlug = reference.replace("proposal:", "");
    const proposal = await prisma.proposalAsset.findUnique({ where: { publicSlug } });
    if (!proposal) return NextResponse.json({ received: true });

    if (paid && proposal.paymentStatus !== "paid") {
      await prisma.proposalAsset.update({
        where: { id: proposal.id },
        data: {
          paymentStatus: "paid",
          paymentProvider: "mercadopago",
          paymentMethod: payment.payment_type_id || payment.payment_method_id || proposal.paymentMethod,
          paymentPaidAt: new Date(),
          paymentUpdatedAt: new Date(),
          providerReceiptUrl: payment.transaction_details?.external_resource_url || proposal.providerReceiptUrl,
        },
      });
      await sendProposalPushNotification(proposal.userId, {
        title: "Proposta paga",
        body: `${proposal.clientName} pagou a proposta de ${proposal.serviceName}.`,
        slug: proposal.publicSlug,
        tag: `proposal-${proposal.publicSlug}-paid`,
      });
    } else if (pending) {
      await prisma.proposalAsset.update({
        where: { id: proposal.id },
        data: { paymentStatus: "pending", paymentUpdatedAt: new Date() },
      });
    } else if (failed) {
      await prisma.proposalAsset.update({
        where: { id: proposal.id },
        data: { paymentStatus: "failed", paymentUpdatedAt: new Date() },
      });
    }
    return NextResponse.json({ received: true });
  }

  if (reference.startsWith("subscription:")) {
    const [, userId] = reference.split(":");
    const subscription = await prisma.planSubscription.findUnique({ where: { userId } });
    if (!subscription) return NextResponse.json({ received: true });

    if (paid) {
      await prisma.planSubscription.update({
        where: { id: subscription.id },
        data: { status: "active", provider: "mercadopago" },
      });
    } else if (failed) {
      await prisma.planSubscription.update({
        where: { id: subscription.id },
        data: { status: "canceled" },
      });
    }
    return NextResponse.json({ received: true });
  }

  if (reference.startsWith("signup_plan:")) {
    const checkoutId = reference.replace("signup_plan:", "");
    const signupPayment = await prisma.signupPayment.findUnique({ where: { id: checkoutId } });
    if (!signupPayment) return NextResponse.json({ received: true });

    if (paid) {
      await prisma.signupPayment.update({
        where: { id: signupPayment.id },
        data: { paidAt: new Date(), status: "paid" },
      });
    } else if (pending) {
      await prisma.signupPayment.update({
        where: { id: signupPayment.id },
        data: { status: "pending" },
      });
    } else if (failed) {
      await prisma.signupPayment.update({
        where: { id: signupPayment.id },
        data: { status: "canceled" },
      });
    }
    return NextResponse.json({ received: true });
  }

  if (reference.startsWith("art_pack:")) {
    const [, userId, pack] = reference.split(":");
    const artCreditPurchase = await prisma.artCreditPurchase.findFirst({
      where: { providerCheckoutId: reference, userId, pack, provider: "mercadopago", status: { not: "paid" } },
      orderBy: { createdAt: "desc" },
    });

    if (!artCreditPurchase) return NextResponse.json({ received: true });

    if (paid && artCreditPurchase.status !== "paid") {
      await prisma.$transaction([
        prisma.artCreditPurchase.update({
          where: { id: artCreditPurchase.id },
          data: { status: "paid", paidAt: new Date(), provider: "mercadopago" },
        }),
        prisma.planSubscription.upsert({
          where: { userId: artCreditPurchase.userId },
          create: {
            userId: artCreditPurchase.userId,
            plan: "start",
            status: "pending",
            artCreditBalance: artCreditPurchase.credits,
          },
          update: {
            artCreditBalance: { increment: artCreditPurchase.credits },
          },
        }),
      ]);
    } else if (failed) {
      await prisma.artCreditPurchase.update({
        where: { id: artCreditPurchase.id },
        data: { status: "canceled" },
      });
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
