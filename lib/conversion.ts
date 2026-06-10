import { plans, type PlanCode } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { cleanOptionalString } from "@/lib/validation";

export const conversionEvents = [
  "landing_viewed",
  "primary_cta_clicked",
  "signup_created",
  "onboarding_started",
  "onboarding_completed",
  "first_proposal_created",
  "public_proposal_viewed",
  "lifetime_offer_clicked",
  "checkout_started",
  "payment_approved",
] as const;

export type ConversionEventName = (typeof conversionEvents)[number];

export const lifetimeOfferVariants = [
  "close_more_proposals",
  "complete_structure",
  "no_monthly_fee",
  "assisted_setup",
] as const;

export type LifetimeOfferVariant = (typeof lifetimeOfferVariants)[number];

export type ConversionEventInput = {
  event: ConversionEventName;
  userId?: string | null;
  proposalId?: string | null;
  plan?: PlanCode | null;
  campaign?: string | null;
  source?: string | null;
  variant?: LifetimeOfferVariant | string | null;
  path?: string | null;
  context?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function isConversionEventName(value: unknown): value is ConversionEventName {
  return typeof value === "string" && conversionEvents.includes(value as ConversionEventName);
}

export function isLifetimeOfferVariant(value: unknown): value is LifetimeOfferVariant {
  return typeof value === "string" && lifetimeOfferVariants.includes(value as LifetimeOfferVariant);
}

export function isConversionPlanCode(value: unknown): value is PlanCode {
  return typeof value === "string" && value in plans;
}

export function cleanConversionText(value: unknown, maxLength = 160) {
  const cleaned = cleanOptionalString(value);
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

export function cleanConversionMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 20)
      .map(([key, item]) => [key.slice(0, 80), cleanMetadataValue(item)])
      .filter(([, item]) => item !== null),
  );
}

export async function trackConversionEvent(input: ConversionEventInput) {
  try {
    if (!isConversionEventName(input.event)) return false;

    await prisma.conversionEvent.create({
      data: {
        event: input.event,
        userId: cleanConversionText(input.userId, 128),
        proposalId: cleanConversionText(input.proposalId, 128),
        plan: isConversionPlanCode(input.plan) ? input.plan : null,
        campaign: cleanConversionText(input.campaign),
        source: cleanConversionText(input.source),
        variant: cleanConversionText(input.variant),
        path: cleanConversionText(input.path, 500),
        context: cleanConversionText(input.context),
        metadata: cleanConversionMetadata(input.metadata),
      },
    });

    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("conversion tracking failed", error);
    }
    return false;
  }
}

function cleanMetadataValue(value: unknown): string | number | boolean | null {
  if (typeof value === "string") return value.slice(0, 500);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  return null;
}
