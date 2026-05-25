export type PlanCode = "start" | "pro" | "plus" | "premium" | "premium_site";
export type ArtPackCode = "arts_5" | "arts_15" | "arts_30";

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
    proposalLimit: number;
    artLimit: number;
    public: boolean;
    features: string[];
  }
> = {
  start: {
    code: "start",
    name: "Start",
    price: "R$ 97/mês",
    priceCents: 9700,
    annualPrice: "R$ 897/ano",
    proposalLimit: 20,
    artLimit: 5,
    public: true,
    features: ["Até 20 propostas por mês", "5 artes para divulgar por mês", "Propostas profissionais", "PDF da proposta", "Portfólio básico", "Aceite online", "Modelos prontos", "Suporte básico"],
  },
  pro: {
    code: "pro",
    name: "Pro",
    price: "R$ 197/mês",
    priceCents: 19700,
    annualPrice: "R$ 1.200/ano",
    proposalLimit: 120,
    artLimit: 10,
    public: true,
    features: ["Até 120 propostas por mês", "Tudo do Start", "Personalização visual da proposta", "Portfólio dentro da proposta", "Depoimentos de clientes", "Serviços cadastrados", "Termos comerciais e aceite profissional", "Acompanhamento de visualizações", "Acompanhamento de cliques no WhatsApp", "10 artes para divulgar por mês", "Mensagens de envio e follow-up", "Suporte prioritário"],
  },
  plus: {
    code: "plus",
    name: "Profissional",
    price: "R$ 147/mês",
    priceCents: 14700,
    proposalLimit: 120,
    artLimit: 10,
    public: false,
    features: ["Até 120 propostas por mês", "10 artes de divulgação por mês", "Portfólio dentro do FechaPro", "Modelos de proposta", "Página de apresentação", "Suporte inicial"],
  },
  premium: {
    code: "premium",
    name: "Pro Site",
    price: "R$ 497 implantação",
    priceCents: 49700,
    maintenancePrice: "R$ 97/mês por 6 meses",
    maintenancePriceCents: 9700,
    proposalLimit: 300,
    artLimit: 10,
    public: false,
    features: ["Até 300 propostas por mês", "10 artes de divulgação por mês", "Tudo do Profissional", "Criação de site one page", "Início, serviços, sobre, portfólio e contato", "Botão para orçamento"],
  },
  premium_site: {
    code: "premium_site",
    name: "Estrutura Comercial Completa",
    price: "R$ 1.500/ano",
    priceCents: 150000,
    maintenancePrice: "12x de R$ 150",
    maintenancePriceCents: 15000,
    proposalLimit: 600,
    artLimit: 20,
    public: true,
    features: ["12 meses de FechaPro", "Até 600 propostas por mês", "Propostas profissionais com link e PDF", "Aceite online e botão para WhatsApp", "Acompanhamento de visualizações e cliques", "Pagamentos via Mercado Pago ou PIX direto", "Mini site profissional", "Diagnóstico Comercial do Instagram", "Ajuste e preparação da logo para uso comercial", "5 artes iniciais e 20 artes mensais", "Legendas, ideias de posts e chamadas para WhatsApp", "Mensagens prontas de abordagem e follow-up", "Configuração da marca, WhatsApp e PIX", "Cadastro dos primeiros serviços", "Primeira proposta criada com você", "Treinamento rápido de uso"],
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
