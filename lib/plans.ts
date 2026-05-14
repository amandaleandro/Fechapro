export type PlanCode = "start" | "pro" | "plus" | "premium" | "premium_site";
export type ArtPackCode = "arts_5" | "arts_15" | "arts_30";

export const plans: Record<
  PlanCode,
  {
    code: PlanCode;
    name: string;
    price: string;
    priceCents: number;
    maintenancePrice?: string;
    maintenancePriceCents?: number;
    proposalLimit: number;
    artLimit: number;
    features: string[];
  }
> = {
  start: {
    code: "start",
    name: "Start",
    price: "R$ 49/mês",
    priceCents: 4900,
    proposalLimit: 20,
    artLimit: 0,
    features: ["Até 20 propostas por mês", "Artes de divulgação não inclusas", "Link para enviar ao cliente", "Modelos básicos"],
  },
  pro: {
    code: "pro",
    name: "Essencial",
    price: "R$ 97/mês",
    priceCents: 9700,
    proposalLimit: 50,
    artLimit: 0,
    features: ["Até 50 propostas por mês", "Artes de divulgação não inclusas", "Orçamentos personalizados", "Cadastro de serviços", "Identidade básica", "Link profissional"],
  },
  plus: {
    code: "plus",
    name: "Profissional",
    price: "R$ 147/mês",
    priceCents: 14700,
    proposalLimit: 120,
    artLimit: 5,
    features: ["Até 120 propostas por mês", "5 artes de divulgação por mês", "Portfólio dentro do FechaPro", "Modelos de proposta", "Página de apresentação", "Suporte inicial"],
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
    features: ["Até 300 propostas por mês", "10 artes de divulgação por mês", "Tudo do Profissional", "Criação de site one page", "Início, serviços, sobre, portfólio e contato", "Botão para orçamento"],
  },
  premium_site: {
    code: "premium_site",
    name: "Premium Site",
    price: "R$ 997 implantação",
    priceCents: 99700,
    maintenancePrice: "R$ 197/mês por 6 meses",
    maintenancePriceCents: 19700,
    proposalLimit: 600,
    artLimit: 15,
    features: ["Até 600 propostas por mês", "15 artes de divulgação por mês", "Tudo do Pro Site", "Site completo simples", "Copy e textos do site", "Cadastro inicial de serviços", "Treinamento rápido"],
  },
};

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
