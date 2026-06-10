import "server-only";
import { createHash } from "node:crypto";

// Conversions API (CAPI) da Meta — envio server-side dos eventos do Pixel.
// Degrada graciosamente: sem PIXEL_ID + access token, nada é enviado.

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? "";
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE ?? "";
const GRAPH_VERSION = "v21.0";

export function isCapiConfigured() {
  return Boolean(PIXEL_ID && ACCESS_TOKEN);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashEmail(email?: string | null): string[] | undefined {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return undefined;
  return [sha256(normalized)];
}

type CapiUserData = {
  email?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
};

export async function sendCapiEvent(params: {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
  actionSource?: string;
  customData?: Record<string, unknown>;
  userData: CapiUserData;
}): Promise<void> {
  if (!isCapiConfigured()) return;

  const userData: Record<string, unknown> = {};
  const em = hashEmail(params.userData.email);
  if (em) userData.em = em;
  if (params.userData.fbp) userData.fbp = params.userData.fbp;
  if (params.userData.fbc) userData.fbc = params.userData.fbc;
  if (params.userData.clientIpAddress) userData.client_ip_address = params.userData.clientIpAddress;
  if (params.userData.clientUserAgent) userData.client_user_agent = params.userData.clientUserAgent;

  const body = {
    data: [
      {
        event_name: params.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId,
        event_source_url: params.eventSourceUrl,
        action_source: params.actionSource ?? "website",
        user_data: userData,
        custom_data: params.customData ?? {},
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[meta-capi] envio falhou", res.status, text);
    }
  } catch (error) {
    console.error("[meta-capi] erro de rede", error);
  }
}
