import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { trackConversionEvent } from "@/lib/conversion";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json().catch(() => null)) as { reason?: string } | null;

  const subscription = await prisma.planSubscription.findUnique({ where: { userId: session.id } });
  if (!subscription) return jsonError("Assinatura nao encontrada.", 404);

  const updated = await prisma.planSubscription.update({
    where: { id: subscription.id },
    data: { status: "canceled" },
  });

  await trackConversionEvent({
    event: "subscription_canceled",
    userId: session.id,
    plan: subscription.plan,
    source: "dashboard",
    context: "subscription_canceled",
    metadata: { reason: body?.reason || "not_informed" },
  });

  return NextResponse.json({ subscription: updated });
}
