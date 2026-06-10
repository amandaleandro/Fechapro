"use client";

import type { ConversionEventName } from "@/lib/conversion";
import type { PlanCode } from "@/lib/plans";

type TrackConversionInput = {
  event: ConversionEventName;
  proposalId?: string | null;
  plan?: PlanCode | null;
  campaign?: string | null;
  source?: string | null;
  variant?: string | null;
  path?: string | null;
  context?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function trackConversion(input: TrackConversionInput) {
  if (typeof window === "undefined") return;

  const payload = {
    ...input,
    path: input.path || `${window.location.pathname}${window.location.search}`,
  };
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon("/api/metrics/conversion", blob)) return;
  }

  void fetch("/api/metrics/conversion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}
