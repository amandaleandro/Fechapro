export type PlanCode =
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
  | "founder_complete_site";
export type ArtPackCode = "arts_5" | "arts_15" | "arts_30";
export const UNLIMITED_PROPOSAL_LIMIT = Number.MAX_SAFE_INTEGER;

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
    features: string[];
    serviceEntitlements?: string[];
    excluded?: string[];
  }
> = {
  start: {
    code: "start",
    name: "Start",
    price: "R$ 250",
    priceCents: 25000,
    billingMode: "one_time",
    annualPrice: "pagamento único · acesso vitalício",
    proposalLimit: 20,
    artLimit: 0,
    public: true,
    features: ["Acesso ao FechaPro Start", "10 a 20 propostas por mês", "Propostas profissionais com link", "PDF da proposta", "Contrato gerado após aceite", "Aceite online", "Cadastro de marca", "Cadastro de clientes e serviços", "Limite mensal renovado e acumulativo"],
    serviceEntitlements: ["Entrega: acesso em até 24h úteis", "Suporte básico por 7 dias"],
    excluded: ["Não inclui site", "Não inclui artes", "Não inclui implantação feita pela equipe", "Não inclui primeira proposta criada pela equipe", "Não inclui kit completo de mensagens", "Não inclui suporte personalizado contínuo"],
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
    public: true,
    features: ["Tudo da cota Start", "30 a 60 propostas por mês", "Contrato gerado após aceite", "Portfólio básico", "Acompanhamento de visualizações", "Modelos prontos", "Limite mensal renovado e acumulativo"],
    serviceEntitlements: ["Treinamento rápido", "Entrega: acesso e setup básico em até 48h úteis", "Suporte inicial melhor"],
    excluded: ["Não inclui site", "Não inclui artes mensais", "Não inclui implantação completa"],
  },
  professional: {
    code: "professional",
    name: "Profissional",
    price: "R$ 1.000",
    priceCents: 100000,
    billingMode: "one_time",
    annualPrice: "pagamento único · acesso vitalício",
    proposalLimit: 200,
    artLimit: 5,
    public: true,
    features: ["Tudo da cota Essencial", "60 a 200 propostas por mês", "Contrato gerado após aceite", "Solicitação de artes de divulgação", "Limite mensal renovado e acumulativo"],
    serviceEntitlements: ["Implantação inicial em até 5 dias úteis após envio das informações", "Configuração da marca no painel", "Primeira proposta criada com ajuda", "Kit de mensagens para envio e follow-up", "Apoio inicial para começar a vender", "Até 5 artes iniciais no primeiro mês"],
    excluded: ["Não inclui site completo", "Não inclui manutenção contínua de artes", "Não inclui suporte ilimitado"],
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
    public: true,
    features: ["Tudo da cota Profissional", "Propostas ilimitadas", "Contrato gerado após aceite", "FechaPro completo", "Solicitação de artes de divulgação"],
    serviceEntitlements: ["Implantação assistida", "Primeira proposta profissional criada", "Kit de mensagens de venda", "Até 10 artes iniciais no primeiro mês", "Suporte inicial por 30 dias", "Site institucional de até 5 páginas"],
    excluded: ["Domínio pago à parte, se necessário", "Manutenção futura do site não inclusa", "Alterações do site incluídas apenas na implantação inicial", "Novas páginas podem ser cobradas à parte"],
  },
  pro: {
    code: "pro",
    name: "Pro",
    price: "R$ 197/mês",
    priceCents: 19700,
    annualPrice: "R$ 1.200/ano",
    proposalLimit: 200,
    artLimit: 10,
    public: false,
    features: ["Até 200 propostas por mês", "Tudo do Start", "Contrato gerado após aceite", "Personalização visual da proposta", "Portfólio dentro da proposta", "Depoimentos de clientes", "Serviços cadastrados", "Termos comerciais e aceite profissional", "Acompanhamento de visualizações", "Acompanhamento de cliques no WhatsApp", "10 artes para divulgar por mês", "Mensagens de envio e follow-up", "Suporte prioritário"],
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
    price: "R$ 497 implantação",
    priceCents: 49700,
    maintenancePrice: "R$ 97/mês por 6 meses",
    maintenancePriceCents: 9700,
    proposalLimit: UNLIMITED_PROPOSAL_LIMIT,
    artLimit: 10,
    public: false,
    features: ["Propostas ilimitadas", "10 artes de divulgação por mês", "Tudo do Profissional", "Contrato gerado após aceite", "Criação de site one page", "Início, serviços, sobre, portfólio e contato", "Botão para orçamento"],
  },
  premium_site: {
    code: "premium_site",
    name: "Estrutura Comercial Completa",
    price: "R$ 1.500/ano",
    priceCents: 150000,
    maintenancePrice: "12x de R$ 150",
    maintenancePriceCents: 15000,
    proposalLimit: UNLIMITED_PROPOSAL_LIMIT,
    artLimit: 20,
    public: false,
    features: ["12 meses de FechaPro", "Propostas ilimitadas", "Propostas profissionais com link e PDF", "Contrato gerado após aceite", "Aceite online e botão para WhatsApp", "Acompanhamento de visualizações e cliques", "Pagamentos via Mercado Pago ou PIX direto", "20 artes mensais"],
    serviceEntitlements: ["Mini site profissional", "Diagnóstico Comercial do Instagram", "Ajuste e preparação da logo para uso comercial", "5 artes iniciais", "Legendas, ideias de posts e chamadas para WhatsApp", "Mensagens prontas de abordagem e follow-up", "Configuração da marca, WhatsApp e PIX", "Cadastro dos primeiros serviços", "Primeira proposta criada com você", "Treinamento rápido de uso"],
  },
  founder_start: {
    code: "founder_start",
    name: "Start",
    price: "R$ 250",
    priceCents: 25000,
    billingMode: "one_time",
    annualPrice: "pagamento único · acesso vitalício",
    proposalLimit: 20,
    artLimit: 0,
    public: false,
    features: ["Acesso ao FechaPro Start", "Propostas profissionais com link", "PDF da proposta", "Contrato gerado após aceite", "Aceite online", "Cadastro de marca", "Cadastro de clientes e serviços", "10 a 20 propostas por mês", "Limite mensal renovado e acumulativo"],
    serviceEntitlements: ["Entrega: acesso em até 24h úteis", "Suporte básico por 7 dias"],
    excluded: ["Não inclui site", "Não inclui artes", "Não inclui implantação feita pela equipe", "Não inclui primeira proposta criada pela equipe", "Não inclui kit completo de mensagens", "Não inclui suporte personalizado contínuo"],
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
    price: "R$ 1.000",
    priceCents: 100000,
    billingMode: "one_time",
    annualPrice: "pagamento único · acesso vitalício",
    proposalLimit: 200,
    artLimit: 5,
    public: false,
    features: ["Tudo da cota Essencial", "60 a 200 propostas por mês", "Contrato gerado após aceite", "Solicitação de artes de divulgação", "Limite mensal renovado e acumulativo"],
    serviceEntitlements: ["Implantação inicial em até 5 dias úteis após envio das informações", "Configuração da marca no painel", "Primeira proposta criada com ajuda", "Kit de mensagens para envio e follow-up", "Apoio inicial para começar a vender", "Até 5 artes iniciais no primeiro mês"],
    excluded: ["Não inclui site completo", "Não inclui manutenção contínua de artes", "Não inclui suporte ilimitado"],
  },
  founder_complete_site: {
    code: "founder_complete_site",
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
};

export const publicPlans = Object.values(plans).filter((plan) => plan.public);

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
