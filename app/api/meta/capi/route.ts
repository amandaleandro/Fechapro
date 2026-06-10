import { NextResponse } from "next/server";
import { isCapiConfigured, sendCapiEvent } from "@/lib/meta-capi";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Ponte browser -> Conversions API. O cliente espelha cada evento do Pixel
// aqui com o mesmo eventId; o servidor adiciona IP, user-agent e e-mail
// (hash) para melhorar a correspondência. A Meta deduplica por eventId.
export async function POST(request: Request) {
  if (!isCapiConfigured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const body = (await request.json().catch(() => null)) as {
    event?: string;
    eventId?: string;
    eventSourceUrl?: string;
    data?: Record<string, unknown>;
    email?: string;
    fbp?: string | null;
    fbc?: string | null;
  } | null;

  if (!body?.event || !body.eventId) {
    return NextResponse.json({ error: "Evento inválido" }, { status: 400 });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");

  await sendCapiEvent({
    eventName: body.event,
    eventId: body.eventId,
    eventSourceUrl: body.eventSourceUrl,
    customData: body.data,
    userData: {
      email: body.email,
      fbp: body.fbp,
      fbc: body.fbc,
      clientIpAddress: clientIp,
      clientUserAgent: request.headers.get("user-agent"),
    },
  });

  return NextResponse.json({ ok: true });
}
