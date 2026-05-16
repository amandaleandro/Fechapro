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
    annualPrice: "R$ 1.497/ano",
    proposalLimit: 120,
    artLimit: 10,
    public: true,
    features: ["Até 120 propostas por mês", "Tudo do Start", "Modelos mais completos", "Personalização visual", "Portfólio e proposta mais fortes", "10 artes para divulgar por mês", "Suporte melhor"],
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
    name: "Premium com Site",
    price: "R$ 1.500/ano",
    priceCents: 150000,
    maintenancePrice: "ou R$ 300/mês + R$ 997 implantação",
    maintenancePriceCents: 30000,
    proposalLimit: 600,
    artLimit: 20,
    public: true,
    features: ["12 meses de FechaPro", "Mini site profissional", "FechaPro configurado", "Primeiras propostas criadas", "PDF profissional", "Portfólio organizado", "Link para enviar no WhatsApp", "Botão de aceite da proposta", "20 artes mensais de divulgação", "Kit de mensagens para abordar clientes", "Calendário de divulgação de 7 dias", "Treinamento rápido para usar"],
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
