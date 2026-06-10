"use client";

// Cliente do Meta Pixel (browser) com espelho na Conversions API (servidor).
// Degrada graciosamente: sem NEXT_PUBLIC_META_PIXEL_ID, nada é disparado.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

export type MetaStandardEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase"
  | "Contact"
  | "Lead";

export type MetaEventData = {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: { id: string; quantity: number }[];
  [key: string]: unknown;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function generateEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Dispara um evento no Meta Pixel (browser) e o espelha na Conversions API
 * (servidor) usando o mesmo `eventID` — a Meta deduplica os dois lados.
 * Não bloqueia a navegação. Retorna o eventId usado, ou null se desativado.
 */
export function trackPixel(
  event: MetaStandardEvent,
  data: MetaEventData = {},
  options: { email?: string; eventId?: string } = {},
): string | null {
  if (!META_PIXEL_ID || typeof window === "undefined") return null;

  const eventId = options.eventId ?? generateEventId();

  window.fbq?.("track", event, data, { eventID: eventId });

  // Espelho server-side (Conversions API).
  try {
    const payload = JSON.stringify({
      event,
      eventId,
      eventSourceUrl: window.location.href,
      data,
      email: options.email,
      fbp: getCookie("_fbp"),
      fbc: getCookie("_fbc"),
    });
    const blob = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/meta/capi", blob)) {
      void fetch("/api/meta/capi", {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => null);
    }
  } catch {
    // espelho server-side é best-effort; nunca quebra a UI
  }

  return eventId;
}
