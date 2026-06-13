import { NextResponse } from "next/server";
import { getMercadoPagoPayment, getMercadoPagoSubscription, verifyMercadoPagoWebhook } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { proposalNotification } from "@/lib/proposal-notifications";
import { sendProposalPushNotification } from "@/lib/push";
import { trackConversionEvent } from "@/lib/conversion";

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
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
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
        await trackConversionEvent({
          event: "payment_approved",
          userId,
          plan: current.plan,
          campaign: current.conversionCampaign,
          source: current.conversionSource || "mercadopago_preapproval",
          variant: current.conversionVariant,
          context: "subscription_preapproval",
          metadata: { providerSubscriptionId: subscription.id, reference },
        });
        await trackConversionEvent({
          event: "subscription_started",
          userId,
          plan: current.plan,
          campaign: current.conversionCampaign,
          source: current.conversionSource || "mercadopago_preapproval",
          variant: current.conversionVariant,
          context: "subscription_preapproval",
          metadata: { providerSubscriptionId: subscription.id, reference },
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
        await trackConversionEvent({
          event: "payment_approved",
          userId: signupPayment.userId,
          plan: signupPayment.plan,
          campaign: signupPayment.conversionCampaign,
          source: signupPayment.conversionSource || "mercadopago_signup_preapproval",
          variant: signupPayment.conversionVariant,
          context: "signup_preapproval",
          metadata: { checkoutId: signupPayment.id, providerCheckoutId: subscription.id, email: signupPayment.email },
        });
        await trackConversionEvent({
          event: "subscription_started",
          userId: signupPayment.userId,
          plan: signupPayment.plan,
          campaign: signupPayment.conversionCampaign,
          source: signupPayment.conversionSource || "mercadopago_signup_preapproval",
          variant: signupPayment.conversionVariant,
          context: "signup_preapproval",
          metadata: { checkoutId: signupPayment.id, providerCheckoutId: subscription.id, email: signupPayment.email },
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
    const proposal = await prisma.proposalAsset.findUnique({
      where: { publicSlug },
      include: { user: { include: { subscription: true } } },
    });
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
      await trackConversionEvent({
        event: "payment_approved",
        userId: proposal.userId,
        proposalId: proposal.id,
        plan: proposal.user.subscription?.plan || null,
        source: "mercadopago_proposal_payment",
        path: `/p/${proposal.publicSlug}`,
        context: "proposal_payment",
        metadata: {
          amountCents: proposal.price,
          paymentMethod: payment.payment_type_id || payment.payment_method_id || proposal.paymentMethod,
          providerPaymentId: eventId,
          publicSlug: proposal.publicSlug,
          reference,
        },
      });
      await sendProposalPushNotification(
        proposal.userId,
        proposalNotification("paid", {
          clientName: proposal.clientName,
          serviceName: proposal.serviceName,
          slug: proposal.publicSlug,
        })
      );
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
      const plan = reference.split(":")[2];
      await trackConversionEvent({
        event: "payment_approved",
        userId,
        plan: subscription.plan,
        campaign: subscription.conversionCampaign,
        source: subscription.conversionSource || "mercadopago_payment",
        variant: subscription.conversionVariant,
        context: "subscription_payment",
        metadata: { providerPaymentId: eventId, reference, referencePlan: plan },
      });
      await trackConversionEvent({
        event: "subscription_started",
        userId,
        plan: subscription.plan,
        campaign: subscription.conversionCampaign,
        source: subscription.conversionSource || "mercadopago_payment",
        variant: subscription.conversionVariant,
        context: "subscription_payment",
        metadata: { providerPaymentId: eventId, reference, referencePlan: plan },
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
      await trackConversionEvent({
        event: "payment_approved",
        userId: signupPayment.userId,
        plan: signupPayment.plan,
        campaign: signupPayment.conversionCampaign,
        source: signupPayment.conversionSource || "mercadopago_signup_payment",
        variant: signupPayment.conversionVariant,
        context: "signup_payment",
        metadata: { checkoutId: signupPayment.id, providerPaymentId: eventId, email: signupPayment.email },
      });
      await trackConversionEvent({
        event: "subscription_started",
        userId: signupPayment.userId,
        plan: signupPayment.plan,
        campaign: signupPayment.conversionCampaign,
        source: signupPayment.conversionSource || "mercadopago_signup_payment",
        variant: signupPayment.conversionVariant,
        context: "signup_payment",
        metadata: { checkoutId: signupPayment.id, providerPaymentId: eventId, email: signupPayment.email },
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
