"use client";

import { useEffect } from "react";

export function AccessTracker() {
  useEffect(() => {
    const payload = JSON.stringify({
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/metrics/access", blob);
      return;
    }

    fetch("/api/metrics/access", {
      body: payload,
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      method: "POST",
    }).catch(() => null);
  }, []);

  return null;
}
