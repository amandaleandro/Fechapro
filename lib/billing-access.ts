import { type PlanCode, plans } from "@/lib/plans";

export const blockedSubscriptionStatuses = new Set(["blocked", "pending", "paused", "canceled"]);
export const usableSubscriptionStatuses = new Set(["active", "trial"]);
export const trustedSubscriptionProviders = new Set(["asaas", "admin"]);

export type SubscriptionAccessInput = {
  plan: PlanCode;
  provider?: string | null;
  status: string;
};

export function canUsePaidFeatures(subscription: SubscriptionAccessInput) {
  return usableSubscriptionStatuses.has(subscription.status) && trustedSubscriptionProviders.has(subscription.provider || "");
}

export function blockedSubscriptionMessage(status: string) {
  if (status === "blocked") return "Sua assinatura esta bloqueada. Regularize o pagamento para voltar a usar.";
  if (status === "paused") return "Sua assinatura esta pausada. Fale com o suporte para reativar.";
  if (status === "canceled") return "Sua assinatura foi cancelada. Escolha um plano para voltar a usar.";
  return "Para usar este recurso, escolha um plano e conclua o pagamento.";
}

export function planLimits(plan: PlanCode) {
  return plans[plan] || plans.start;
}
