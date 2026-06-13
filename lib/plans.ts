export type PlanCode =
  | "free"
  | "start"
  | "essential"
  | "professional"
  | "complete"
  | "pro"
  | "plus"
  | "premium"
  | "premium_site"
  | "founder_start"
  | "founder_essential"
  | "founder_professional"
  | "founder_complete_site"
  | "founder";

export const UNLIMITED_PROPOSAL_LIMIT = Number.MAX_SAFE_INTEGER;
export const FREE_CLIENT_LIMIT = 10;
export const FREE_SERVICE_LIMIT = 10;
export const FREE_PORTFOLIO_LIMIT = 3;

type BillingMode = "subscription" | "one_time";

export type PlanDefinition = {
  code: PlanCode;
  name: string;
  price: string;
  priceCents: number;
  annualPrice?: string;
  maintenancePrice?: string;
  maintenancePriceCents?: number;
  billingMode?: BillingMode;
  proposalLimit: number;
  public: boolean;
  sellable?: boolean;
  features: string[];
  serviceEntitlements?: string[];
  excluded?: string[];
};

export const plans: Record<PlanCode, PlanDefinition> = {
  free: {
    code: "free",
    name: "Gratis",
    price: "R$ 0",
    priceCents: 0,
    proposalLimit: 3,
    public: false,
    features: [
      "3 propostas gratuitas",
      "10 clientes cadastrados",
      "10 servicos cadastrados",
      "3 fotos no portfolio da proposta",
      "Link profissional para enviar ao cliente",
      "Sem PDF, slides ou cobranca no link",
    ],
  },
  start: {
    code: "start",
    name: "Start legado",
    price: "R$ 97/mes",
    priceCents: 9700,
    billingMode: "subscription",
    proposalLimit: 50,
    public: false,
    features: ["Plano legado", "50 propostas por mes", "Link profissional", "PDF da proposta", "Aceite online"],
  },
  essential: {
    code: "essential",
    name: "Essencial",
    price: "R$ 19,97/mes",
    priceCents: 1997,
    billingMode: "subscription",
    annualPrice: "3 dias gratis para testar",
    proposalLimit: 5,
    public: true,
    features: [
      "Ate 5 propostas por mes",
      "1 modelo simples de proposta em link",
      "Envio pelo WhatsApp",
      "PDF simples com marca FechaPro",
      "Cadastro basico da empresa",
      "Acompanhamento de visualizacao do link",
    ],
    excluded: ["Sem portfolio, depoimentos e templates profissionais", "Sem contrato, pagamento no link e IA"],
  },
  professional: {
    code: "professional",
    name: "Profissional",
    price: "R$ 49,97/mes",
    priceCents: 4997,
    billingMode: "subscription",
    annualPrice: "3 dias gratis para testar",
    proposalLimit: 30,
    public: true,
    features: [
      "Ate 30 propostas por mes",
      "Modelos profissionais de proposta",
      "Aceite online",
      "Visualizacoes e historico de status",
      "PDF sem marca d'agua",
      "Clientes, servicos, portfolio e depoimentos",
      "Editar e duplicar propostas",
    ],
  },
  complete: {
    code: "complete",
    name: "Completo legado",
    price: "R$ 2.000",
    priceCents: 200000,
    billingMode: "one_time",
    annualPrice: "pagamento unico legado",
    proposalLimit: UNLIMITED_PROPOSAL_LIMIT,
    public: false,
    features: ["Plano legado", "Propostas ilimitadas", "Contrato apos aceite", "Implantacao assistida"],
  },
  pro: {
    code: "pro",
    name: "Pro legado",
    price: "R$ 197/mes",
    priceCents: 19700,
    billingMode: "subscription",
    proposalLimit: 200,
    public: false,
    features: ["Plano legado", "Ate 200 propostas por mes", "Portfolio", "Depoimentos", "Rastreamento avancado"],
  },
  plus: {
    code: "plus",
    name: "Profissional legado",
    price: "R$ 147/mes",
    priceCents: 14700,
    billingMode: "subscription",
    proposalLimit: 200,
    public: false,
    features: ["Plano legado", "Ate 200 propostas por mes", "Contrato apos aceite", "Templates", "Suporte inicial"],
  },
  premium: {
    code: "premium",
    name: "Premium",
    price: "R$ 99,97/mes",
    priceCents: 9997,
    billingMode: "subscription",
    annualPrice: "3 dias gratis para testar",
    proposalLimit: UNLIMITED_PROPOSAL_LIMIT,
    public: true,
    features: [
      "Tudo do Profissional",
      "Propostas ilimitadas",
      "Slides comerciais da proposta",
      "Contrato automatico apos aceite",
      "Botao de pagamento no link",
      "IA para ajudar na escrita da proposta",
      "Calculadora de custo e margem",
      "Lembretes de follow-up e relatorios simples",
      "Multiusuario/equipe e suporte prioritario",
    ],
  },
  premium_site: {
    code: "premium_site",
    name: "Estrutura Completa legado",
    price: "R$ 497/mes",
    priceCents: 49700,
    billingMode: "subscription",
    proposalLimit: UNLIMITED_PROPOSAL_LIMIT,
    public: false,
    features: ["Plano legado", "Tudo ilimitado", "Mini site profissional", "Implantacao assistida", "Treinamento completo"],
  },
  founder_start: {
    code: "founder_start",
    name: "Start Fundador legado",
    price: "R$ 397",
    priceCents: 39700,
    billingMode: "one_time",
    annualPrice: "pagamento unico legado",
    proposalLimit: 50,
    public: false,
    sellable: false,
    features: ["Oferta vitalicia legado", "50 propostas por mes", "Link profissional", "PDF", "Aceite online"],
  },
  founder_essential: {
    code: "founder_essential",
    name: "Essencial Fundador legado",
    price: "R$ 500",
    priceCents: 50000,
    billingMode: "one_time",
    annualPrice: "pagamento unico legado",
    proposalLimit: 60,
    public: false,
    sellable: false,
    features: ["Oferta vitalicia legado", "60 propostas por mes", "Modelos prontos", "Visualizacoes"],
  },
  founder_professional: {
    code: "founder_professional",
    name: "Profissional Fundador legado",
    price: "R$ 797",
    priceCents: 79700,
    billingMode: "one_time",
    annualPrice: "pagamento unico legado",
    proposalLimit: 200,
    public: false,
    sellable: false,
    features: ["Oferta vitalicia legado", "200 propostas por mes", "Portfolio", "Depoimentos", "Rastreamento avancado"],
  },
  founder_complete_site: {
    code: "founder_complete_site",
    name: "Pro Site Fundador legado",
    price: "R$ 1.197",
    priceCents: 119700,
    billingMode: "one_time",
    annualPrice: "pagamento unico legado",
    proposalLimit: 200,
    public: false,
    sellable: false,
    features: ["Oferta vitalicia legado", "Mini site profissional", "Dominio proprio", "200 propostas por mes"],
  },
  founder: {
    code: "founder",
    name: "Estrutura Completa Fundador legado",
    price: "R$ 1.697",
    priceCents: 169700,
    billingMode: "one_time",
    annualPrice: "pagamento unico legado",
    proposalLimit: UNLIMITED_PROPOSAL_LIMIT,
    public: false,
    sellable: false,
    features: ["Oferta vitalicia legado", "Tudo ilimitado", "Mini site profissional", "Implantacao assistida", "Treinamento completo"],
  },
};

export const publicPlans = Object.values(plans).filter((plan) => plan.public);

export function isPurchasablePlan(code: PlanCode) {
  const plan = plans[code];
  return Boolean(plan && (plan.public || plan.sellable));
}

export function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function isUnlimitedProposalLimit(limit: number) {
  return limit >= UNLIMITED_PROPOSAL_LIMIT;
}

export function formatProposalLimit(limit: number) {
  return isUnlimitedProposalLimit(limit) ? "propostas ilimitadas" : `${limit} propostas`;
}

export function monthsSinceSubscriptionStart(startedAt?: Date | string | null, now = new Date()) {
  if (!startedAt) return 1;
  const start = new Date(startedAt);
  if (Number.isNaN(start.getTime()) || start > now) return 1;
  return Math.max(1, (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + now.getUTCMonth() - start.getUTCMonth() + 1);
}

export function accumulatedProposalLimit(monthlyLimit: number, startedAt?: Date | string | null, now = new Date()) {
  if (isUnlimitedProposalLimit(monthlyLimit)) return UNLIMITED_PROPOSAL_LIMIT;
  return monthlyLimit * monthsSinceSubscriptionStart(startedAt, now);
}
