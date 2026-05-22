import { describe, expect, it } from "vitest";
import { canUseProposalPresentation } from "@/lib/billing-access";

describe("canUseProposalPresentation", () => {
  it("libera apresentacao para assinaturas premium ativas", () => {
    expect(canUseProposalPresentation({ plan: "premium", provider: "admin", status: "active" })).toBe(true);
    expect(canUseProposalPresentation({ plan: "premium_site", provider: "mercadopago", status: "trial" })).toBe(true);
  });

  it("bloqueia planos menores e assinaturas sem acesso pago", () => {
    expect(canUseProposalPresentation({ plan: "pro", provider: "admin", status: "active" })).toBe(false);
    expect(canUseProposalPresentation({ plan: "premium_site", provider: "admin", status: "paused" })).toBe(false);
    expect(canUseProposalPresentation({ plan: "premium_site", provider: null, status: "active" })).toBe(false);
  });
});
