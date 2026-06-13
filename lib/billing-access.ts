import { type PlanCode, plans } from "@/lib/plans";

export const blockedSubscriptionStatuses = new Set(["blocked", "pending", "paused", "canceled"]);
export const usableSubscriptionStatuses = new Set(["active", "trial"]);
export const trustedSubscriptionProviders = new Set(["mercadopago", "admin"]);

export type SubscriptionAccessInput = {
  plan: PlanCode;
  provider?: string | null;
  status: string;
};

export function canUsePaidFeatures(subscription: SubscriptionAccessInput) {
  return usableSubscriptionStatuses.has(subscription.status) && trustedSubscriptionProviders.has(subscription.provider || "");
}

export function blockedSubscriptionMessage(status: string) {
  if (status === "blocked") return "Sua assinatura está bloqueada. Regularize o pagamento para voltar a usar.";
  if (status === "paused") return "Sua assinatura está pausada. Fale com o suporte para reativar.";
  if (status === "canceled") return "Sua assinatura foi cancelada. Escolha um plano para voltar a usar.";
  return "Para usar este recurso, escolha um plano e conclua o pagamento.";
}

export function planLimits(plan: PlanCode) {
  return plans[plan] || plans.essential;
}

const presentationPlans = new Set<PlanCode>(["premium", "premium_site", "founder_complete_site", "founder"]);
const professionalPlans = new Set<PlanCode>(["professional", "premium", "premium_site", "founder_professional", "founder_complete_site", "founder"]);
const premiumPlans = new Set<PlanCode>(["premium", "premium_site", "founder_complete_site", "founder"]);

export function canUseProposalPresentation(subscription: SubscriptionAccessInput | null | undefined) {
  if (!subscription || !canUsePaidFeatures(subscription)) return false;
  return presentationPlans.has(subscription.plan);
}

export function isFreeProposalLinkPlan(subscription: SubscriptionAccessInput | null | undefined) {
  return subscription?.plan === "free";
}

export function canUseProposalDocuments(subscription: SubscriptionAccessInput | null | undefined) {
  return Boolean(subscription && canUsePaidFeatures(subscription) && !isFreeProposalLinkPlan(subscription));
}

export function canUseProposalContracts(subscription: SubscriptionAccessInput | null | undefined) {
  return Boolean(subscription && canUsePaidFeatures(subscription) && premiumPlans.has(subscription.plan));
}

export function canUseProposalPayments(subscription: SubscriptionAccessInput | null | undefined) {
  return Boolean(subscription && canUsePaidFeatures(subscription) && premiumPlans.has(subscription.plan));
}

export function canUseProfessionalCatalog(subscription: SubscriptionAccessInput | null | undefined) {
  return Boolean(subscription && canUsePaidFeatures(subscription) && professionalPlans.has(subscription.plan));
}

export function canUsePremiumAutomation(subscription: SubscriptionAccessInput | null | undefined) {
  return Boolean(subscription && canUsePaidFeatures(subscription) && premiumPlans.has(subscription.plan));
}
