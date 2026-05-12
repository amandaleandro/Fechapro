import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAsaasWebhook } from "@/lib/asaas";

interface AsaasPayment {
  id: string;
  status: string;
  billingType: string;
  value: number;
  paymentLink?: string | null;
}

interface AsaasWebhookPayload {
  event: string;
  payment: AsaasPayment;
}

export async function POST(request: Request) {
  const token = request.headers.get("asaas-access-token") ?? "";

  try {
    verifyAsaasWebhook(token);
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const payload = (await request.json()) as AsaasWebhookPayload;
  const { event, payment } = payload;

  const isPaid = event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED";
  const isOverdue = event === "PAYMENT_OVERDUE";
  const isDeleted = event === "PAYMENT_DELETED";

  if (!isPaid && !isOverdue && !isDeleted) {
    return NextResponse.json({ received: true });
  }

  const paymentLinkId = payment?.paymentLink;
  if (!paymentLinkId) {
    return NextResponse.json({ received: true });
  }

  const proposal = await prisma.proposalAsset.findFirst({
    where: { providerCheckoutId: paymentLinkId },
  });

  if (proposal) {
    if (isPaid) {
      await prisma.proposalAsset.update({
        where: { id: proposal.id },
        data: {
          paymentStatus: "paid",
          paymentProvider: "asaas",
          paymentMethod: payment.billingType?.toLowerCase() || null,
          paymentPaidAt: new Date(),
          paymentUpdatedAt: new Date(),
        },
      });
    } else if (isOverdue) {
      await prisma.proposalAsset.update({
        where: { id: proposal.id },
        data: { paymentStatus: "overdue", paymentUpdatedAt: new Date() },
      });
    }
    return NextResponse.json({ received: true });
  }

  const subscription = await prisma.planSubscription.findFirst({
    where: { providerCheckoutId: paymentLinkId },
  });

  if (subscription) {
    if (isPaid) {
      await prisma.planSubscription.update({
        where: { id: subscription.id },
        data: { status: "active", provider: "asaas" },
      });
    } else if (isOverdue) {
      await prisma.planSubscription.update({
        where: { id: subscription.id },
        data: { status: "past_due" },
      });
    } else if (isDeleted) {
      await prisma.planSubscription.update({
        where: { id: subscription.id },
        data: { status: "canceled" },
      });
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
