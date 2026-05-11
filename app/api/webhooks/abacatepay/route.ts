import { NextResponse } from "next/server";
import { verifyAbacateSignature } from "@/lib/abacatepay";
import { plans, type PlanCode } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

type AbacateWebhookPaymentResource = {
  externalId?: string | null;
  id?: string;
  methods?: string[];
  receiptUrl?: string | null;
  status?: string;
  updatedAt?: string;
};

type AbacateWebhook = {
  event?: string;
  data?: {
    billing?: AbacateWebhookPaymentResource;
    checkout?: AbacateWebhookPaymentResource;
    externalId?: string | null;
    id?: string;
    methods?: string[];
    receiptUrl?: string | null;
    status?: string;
    updatedAt?: string;
  };
};

export async function POST(request: Request) {
  const url = new URL(request.url);
  const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET?.trim();

  if (expectedSecret && url.searchParams.get("webhookSecret") !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature") || request.headers.get("x-abacate-signature");

  if (signature && !verifyAbacateSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as AbacateWebhook;
  const checkout = (payload.data?.checkout || payload.data?.billing || payload.data) as AbacateWebhookPaymentResource | undefined;

  if (!checkout?.id && !checkout?.externalId) {
    return NextResponse.json({ ok: true });
  }

  const externalId = checkout.externalId || "";
  if (externalId.startsWith("fechapro-plan-")) {
    const [, , userId, plan] = externalId.split("-");
    const isPaid = payload.event === "checkout.completed" || checkout.status === "paid" || checkout.status === "PAID";

    if (userId && plan && plans[plan as PlanCode] && isPaid) {
      await prisma.planSubscription.upsert({
        where: { userId },
        create: { userId, plan: plan as PlanCode, status: "active" },
        update: { plan: plan as PlanCode, status: "active" },
      });
    }

    return NextResponse.json({ ok: true });
  }

  const proposalId = externalId.startsWith("fechapro-proposal-") ? externalId.replace("fechapro-proposal-", "") : undefined;
  const isPaid = payload.event === "checkout.completed" || payload.event === "billing.paid" || checkout.status === "paid" || checkout.status === "PAID";
  const paymentStatus = isPaid ? "paid" : checkout.status || payload.event || "updated";

  await prisma.proposalAsset.updateMany({
    where: {
      OR: [{ abacatePayCheckoutId: checkout.id }, ...(proposalId ? [{ id: proposalId }] : [])],
    },
    data: {
      abacatePayCheckoutId: checkout.id || undefined,
      abacatePayReceiptUrl: checkout.receiptUrl || undefined,
      paymentMethod: checkout.methods?.[0] || undefined,
      paymentPaidAt: isPaid ? new Date() : undefined,
      paymentStatus,
      paymentUpdatedAt: checkout.updatedAt ? new Date(checkout.updatedAt) : new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
