import { beforeEach, describe, expect, it, vi } from "vitest";

const { createConversionEvent } = vi.hoisted(() => ({
  createConversionEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversionEvent: {
      create: createConversionEvent,
    },
  },
}));

import {
  cleanConversionMetadata,
  cleanConversionText,
  isConversionEventName,
  isConversionPlanCode,
  isLifetimeOfferVariant,
  trackConversionEvent,
} from "@/lib/conversion";

describe("conversion validation", () => {
  it("reconhece apenas eventos de conversao permitidos", () => {
    expect(isConversionEventName("landing_viewed")).toBe(true);
    expect(isConversionEventName("payment_approved")).toBe(true);
    expect(isConversionEventName("random_event")).toBe(false);
    expect(isConversionEventName(null)).toBe(false);
  });

  it("valida variantes e Planos permitidos", () => {
    expect(isLifetimeOfferVariant("close_more_proposals")).toBe(true);
    expect(isLifetimeOfferVariant("discount_popup")).toBe(false);
    expect(isConversionPlanCode("founder_professional")).toBe(true);
    expect(isConversionPlanCode("enterprise_custom")).toBe(false);
  });
});

describe("conversion sanitization", () => {
  it("limpa textos opcionais e respeita limite", () => {
    expect(cleanConversionText("  campanha-x  ")).toBe("campanha-x");
    expect(cleanConversionText("abcdef", 3)).toBe("abc");
    expect(cleanConversionText("   ")).toBeNull();
    expect(cleanConversionText(123)).toBeNull();
  });

  it("mantem apenas metadados simples e limita volume", () => {
    const metadata = cleanConversionMetadata({
      ok: true,
      count: 2,
      label: "x".repeat(600),
      nested: { ignore: true },
      list: ["ignore"],
      empty: null,
    });

    expect(metadata).toEqual({
      ok: true,
      count: 2,
      label: "x".repeat(500),
    });
  });
});

describe("trackConversionEvent", () => {
  beforeEach(() => {
    createConversionEvent.mockReset();
  });

  it("grava payload limpo para evento valido", async () => {
    createConversionEvent.mockResolvedValueOnce({ id: "evt_1" });

    await expect(trackConversionEvent({
      event: "checkout_started",
      userId: " user_1 ",
      proposalId: "proposal_1",
      plan: "founder",
      campaign: " campanha ",
      source: "landing",
      variant: "no_monthly_fee",
      path: "/checkout/cadastro/founder?x=1",
      context: "signup_plan_checkout",
      metadata: { checkoutId: "checkout_1", ignored: { nested: true } },
    })).resolves.toBe(true);

    expect(createConversionEvent).toHaveBeenCalledWith({
      data: {
        event: "checkout_started",
        userId: "user_1",
        proposalId: "proposal_1",
        plan: "founder",
        campaign: "campanha",
        source: "landing",
        variant: "no_monthly_fee",
        path: "/checkout/cadastro/founder?x=1",
        context: "signup_plan_checkout",
        metadata: { checkoutId: "checkout_1" },
      },
    });
  });

  it("ignora evento invalido sem chamar Prisma", async () => {
    await expect(trackConversionEvent({ event: "unknown" as never })).resolves.toBe(false);
    expect(createConversionEvent).not.toHaveBeenCalled();
  });

  it("retorna false quando o banco falha", async () => {
    createConversionEvent.mockRejectedValueOnce(new Error("database down"));

    await expect(trackConversionEvent({ event: "payment_approved" })).resolves.toBe(false);
  });
});
