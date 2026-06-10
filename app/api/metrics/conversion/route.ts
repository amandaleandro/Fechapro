import { NextResponse } from "next/server";
import {
  cleanConversionMetadata,
  cleanConversionText,
  isConversionPlanCode,
  isConversionEventName,
  trackConversionEvent,
  type ConversionEventName,
} from "@/lib/conversion";
import type { PlanCode } from "@/lib/plans";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ConversionPayload = {
  event?: unknown;
  userId?: unknown;
  proposalId?: unknown;
  plan?: unknown;
  campaign?: unknown;
  source?: unknown;
  variant?: unknown;
  path?: unknown;
  context?: unknown;
  metadata?: unknown;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`conversion:${ip}`, 120, 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json().catch(() => null)) as ConversionPayload | null;
  if (!isConversionEventName(body?.event)) {
    return NextResponse.json({ error: "Evento de conversao invalido." }, { status: 400 });
  }

  const session = await getSession().catch(() => null);
  const userId = session?.id || cleanConversionText(body?.userId, 128);
  const ok = await trackConversionEvent({
    event: body.event as ConversionEventName,
    userId,
    proposalId: cleanConversionText(body?.proposalId, 128),
    plan: isConversionPlanCode(body?.plan) ? (body.plan as PlanCode) : null,
    campaign: cleanConversionText(body?.campaign),
    source: cleanConversionText(body?.source),
    variant: cleanConversionText(body?.variant),
    path: cleanConversionText(body?.path, 500),
    context: cleanConversionText(body?.context),
    metadata: {
      ...cleanConversionMetadata(body?.metadata),
      userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
      ip,
    },
  });

  return NextResponse.json({ ok }, { headers: { "Cache-Control": "no-store" } });
}
