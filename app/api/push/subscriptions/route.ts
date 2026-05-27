import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

type BrowserPushSubscription = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as { subscription?: BrowserPushSubscription };
  const subscription = body.subscription;

  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return jsonError("Inscrição push inválida.", 400);
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      userId: session.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: request.headers.get("user-agent"),
    },
    update: {
      userId: session.id,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: request.headers.get("user-agent"),
    },
  });

  return NextResponse.json({ ok: true });
}
