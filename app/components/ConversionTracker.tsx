"use client";

import { useEffect } from "react";
import { trackConversion } from "@/lib/conversion-client";
import type { ConversionEventName } from "@/lib/conversion";
import type { PlanCode } from "@/lib/plans";

type ConversionTrackerProps = {
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

export default function ConversionTracker(props: ConversionTrackerProps) {
  useEffect(() => {
    trackConversion(props);
  }, [props]);

  return null;
}
