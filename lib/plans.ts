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
export type ArtPackCode = "arts_5" | "arts_15" | "arts_30";
export const UNLIMITED_PROPOSAL_LIMIT = Number.MAX_SAFE_INTEGER;
export const FREE_CLIENT_LIMIT = 10;
export const FREE_SERVICE_LIMIT = 10;
export const FREE_PORTFOLIO_LIMIT = 3;

export const plans: Record<
  PlanCode,
  {
    code: PlanCode;
    name: string;
    price: string;
    priceCents: number;
    annualPrice?: string;
    maintenancePrice?: string;
    maintenancePriceCents?: number;
    billingMode?: "subscription" | "one_time";
    proposalLimit: number;
    artLimit: number;
    public: boolean;
    /** Vendável pelo checkout mesmo sem aparecer na grade de preços pública (ex.: ofertas Fundador). */
    sellable?: boolean;
    /** Lote único de créditos de arte concedido na ativação (planos vitalícios). Não recorrente. */
    welcomeArtCredits?: number;
    features: string[];
    serviceEntitlements?: string[];
    excluded?: string[];
  }
> = {
  free: {
    code: "free",
    name: "Gratis",
    price: "R$ 0",
    priceCents: 0,
    proposalLimit: 3,
    artLimit: 0,
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
    name: "Start",
    price: "R$ 97/mês",
    priceCents: 9700,
    proposalLimit: 50,
    artLimit: 5,
    public: false,
    features: [
      "50 propostas por mês",
      "Link profissional para a proposta",
      "PDF da proposta",
      "Aceite online",
      "PIX e Mercado Pago integrados",
      "Cadastro de marca e clientes",
      "5 artes de divulgação por mês",
    ],
  },
  essential: {
    code: "essential",
    name: "Essencial",
    price: "R$ 500",
    priceCents: 50000,
    billingMode: "one_time",
    annualPrice: "pagamento único · acesso vitalício",
    proposalLimit: 60,
    artLimit: 0,
    public: false,
    features: ["Tudo da cota Start", "30 a 60 propostas por mês", "Contrato gerado após aceite", "Portfólio básico", "Acompanhamento de visualizações", "Modelos prontos", "Limite mensal renovado e acumulativo"],
    serviceEntitlements: ["Treinamento rápido", "Entrega: acesso e setup básico em até 48h úteis", "Suporte inicial melhor"],
    excluded: ["Não inclui site", "Não inclui artes mensais", "Não inclui implantação completa"],
  },
  professional: {
    code: "professional",
    name: "Profissional",
    price: "R$ 197/mês",
    priceCents: 19700,
    proposalLimit: 200,
    artLimit: 15,
    public: false,
    features: [
      "Tudo do Start",
      "200 propostas por mês",
      "Portfólio dentro da proposta",
      "Depoimentos de clientes",
      "Rastreamento avançado de visualizações e cliques",
      "15 artes de divulgação por mês",
    ],
  },
  complete: {
    code: "complete",
    name: "Completo",
    price: "R$ 2.000",
    priceCents: 200000,
    billingMode: "one_time",
    annualPrice: "pagamento único · acesso vitalício",
    proposalLimit: UNLIMITED_PROPOSAL_LIMIT,
    artLimit: 10,
    public: false,
    features: ["Tudo da cota Profissional", "Propostas ilimitadas", "Contrato gerado após aceite", "FechaPro completo", "Solicitação de artes de divulgação"],
    serviceEntitlements: ["Implantação assistida", "Primeira proposta profissional criada", "Kit de mensagens de venda", "Até 10 artes iniciais no primeiro mês", "Suporte inicial por 30 dias", "Site institucional de até 5 páginas"],
    excluded: ["Domínio pago à parte, se necessário", "Manutenção futura do site não inclusa", "Alterações do site incluídas apenas na implantação inicial", "Novas páginas podem ser cobradas à parte"],
  },
  pro: {
    code: "pro",
    name: "Pro",
    price: "R$ 197/mês",
    priceCents: 19700,
    proposalLimit: 200,
    artLimit: 15,
    public: false,
    features: ["Até 200 propostas por mês", "Tudo do Start", "Portfólio dentro da proposta", "Depoimentos de clientes", "Rastreamento avançado", "15 artes para divulgar por mês"],
  },
  plus: {
    code: "plus",
    name: "Profissional",
    price: "R$ 147/mês",
    priceCents: 14700,
    proposalLimit: 200,
    artLimit: 10,
    public: false,
    features: ["Até 200 propostas por mês", "10 artes de divulgação por mês", "Contrato gerado após aceite", "Portfólio dentro do FechaPro", "Modelos de proposta", "Página de apresentação", "Suporte inicial"],
  },
  premium: {
    code: "premium",
    name: "Pro Site",
    price: "R$ 297/mês",
    priceCents: 29700,
    proposalLimit: 200,
    artLimit: 20,
    public: false,
    features: [
      "Tudo do Profissional",
      "Mini site profissional",
      "Domínio próprio incluído",
      "200 propostas por mês",
      "20 artes de divulgação por mês",
    ],
  },
  premium_site: {
    code: "premium_site",
    name: "Estrutura Completa",
    price: "R$ 497/mês",
    priceCents: 49700,
    proposalLimit: UNLIMITED_PROPOSAL_LIMIT,
    artLimit: 50,
    public: false,
    features: [
      "Tudo ilimitado",
      "Mini site profissional",
      "Implantação assistida",
      "Diagnóstico do Instagram",
      "Primeira proposta criada com você",
      "Treinamento completo",
    ],
    serviceEntitlements: [
      "Implantação assistida pela equipe",
      "Diagnóstico do Instagram",
      "Primeira proposta criada com você",
      "Treinamento completo de uso",
    ],
  },
  founder_start: {
    code: "founder_start",
    name: "Start",
    price: "R$ 397",
    priceCents: 39700,
    billingMode: "one_time",
    annualPrice: "pagamento único · acesso vitalício",
    proposalLimit: 50,
    artLimit: 0,
    welcomeArtCredits: 5,
    public: true,
    sellable: true,
    features: [
      "50 propostas por mês",
      "Link profissional para a proposta",
      "PDF da proposta",
      "Aceite online",
      "PIX e Mercado Pago integrados",
      "Cadastro de marca e clientes",
      "5 artes de divulgação de boas-vindas",
      "Acesso vitalício — sem mensalidade",
    ],
    excluded: ["Não inclui portfólio avançado", "Não inclui mini site"],
  },
  founder_essential: {
    code: "founder_essential",
    name: "Essencial",
    price: "R$ 500",
    priceCents: 50000,
    billingMode: "one_time",
    annualPrice: "pagamento único · acesso vitalício",
    proposalLimit: 60,
    artLimit: 0,
    public: false,
    features: ["Tudo da cota Start", "Mais limite de propostas", "Contrato gerado após aceite", "Portfólio básico", "Acompanhamento de visualizações", "Modelos prontos"],
    serviceEntitlements: ["Treinamento rápido", "Entrega: acesso e setup básico em até 48h úteis", "Suporte inicial melhor"],
    excluded: ["Não inclui site", "Não inclui artes mensais", "Não inclui implantação completa"],
  },
  founder_professional: {
    code: "founder_professional",
    name: "Profissional",
    price: "R$ 797",
    priceCents: 79700,
    billingMode: "one_time",
    annualPrice: "pagamento único · acesso vitalício",
    proposalLimit: 200,
    artLimit: 0,
    welcomeArtCredits: 15,
    public: true,
    sellable: true,
    features: [
      "Tudo do Start",
      "200 propostas por mês",
      "Portfólio dentro da proposta",
      "Depoimentos de clientes",
      "Rastreamento avançado de visualizações e cliques",
      "15 artes de divulgação de boas-vindas",
      "Acesso vitalício — sem mensalidade",
    ],
    excluded: ["Não inclui mini site"],
  },
  founder_complete_site: {
    code: "founder_complete_site",
    name: "Pro Site",
    price: "R$ 1.197",
    priceCents: 119700,
    billingMode: "one_time",
    annualPrice: "pagamento único · acesso vitalício",
    proposalLimit: 200,
    artLimit: 0,
    welcomeArtCredits: 20,
    public: true,
    sellable: true,
    features: [
      "Tudo do Profissional",
      "Mini site profissional",
      "Domínio próprio incluído",
      "200 propostas por mês",
      "20 artes de divulgação de boas-vindas",
      "Acesso vitalício — sem mensalidade",
    ],
  },
  founder: {
    code: "founder",
    name: "Estrutura Completa",
    price: "R$ 1.697",
    priceCents: 169700,
    billingMode: "one_time",
    annualPrice: "pagamento único · acesso vitalício",
    proposalLimit: UNLIMITED_PROPOSAL_LIMIT,
    artLimit: 0,
    welcomeArtCredits: 50,
    public: true,
    sellable: true,
    features: [
      "Tudo ilimitado",
      "Mini site profissional",
      "Implantação assistida",
      "Diagnóstico do Instagram",
      "Primeira proposta criada com você",
      "Treinamento completo",
      "Acesso vitalício — sem mensalidade",
    ],
    serviceEntitlements: [
      "Implantação assistida pela equipe",
      "Diagnóstico do Instagram",
      "Primeira proposta criada com você",
      "Treinamento completo de uso",
    ],
  },
};

export const publicPlans = Object.values(plans).filter((plan) => plan.public);

/** Plano pode ser comprado pelo checkout (listado na grade pública OU vendável por link direto, como as ofertas Fundador). */
export function isPurchasablePlan(code: PlanCode) {
  const plan = plans[code];
  return Boolean(plan && (plan.public || plan.sellable));
}

export const artPacks: Record<
  ArtPackCode,
  {
    code: ArtPackCode;
    name: string;
    price: string;
    priceCents: number;
    credits: number;
    features: string[];
  }
> = {
  arts_5: {
    code: "arts_5",
    name: "Pacote 5 artes",
    price: "R$ 39",
    priceCents: 3900,
    credits: 5,
    features: ["5 criações individuais", "Créditos extras para usar quando quiser", "Mantém seu plano principal ativo"],
  },
  arts_15: {
    code: "arts_15",
    name: "Pacote 15 artes",
    price: "R$ 97",
    priceCents: 9700,
    credits: 15,
    features: ["15 criações individuais", "Ideal para campanhas e lançamentos", "Créditos extras acumuláveis"],
  },
  arts_30: {
    code: "arts_30",
    name: "Pacote 30 artes",
    price: "R$ 179",
    priceCents: 17900,
    credits: 30,
    features: ["30 criações individuais", "Melhor custo por arte", "Perfeito para divulgação recorrente"],
  },
};

export function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function isUnlimitedProposalLimit(limit: number) {
  return limit >= UNLIMITED_PROPOSAL_LIMIT;
}

export function isUnlimitedArtLimit(limit: number) {
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
