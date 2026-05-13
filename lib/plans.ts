export type PlanCode = "start" | "pro" | "plus" | "premium" | "premium_site";

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
    maintenancePrice: "Depois R$ 197/mês",
    maintenancePriceCents: 19700,
    proposalLimit: 300,
    artLimit: 10,
    features: ["Até 300 propostas por mês", "10 artes de divulgação por mês", "Tudo do Profissional", "Criação de site one page", "Início, serviços, sobre, portfólio e contato", "Botão para orçamento"],
  },
  premium_site: {
    code: "premium_site",
    name: "Premium Site",
    price: "R$ 997 implantação",
    priceCents: 99700,
    maintenancePrice: "Depois R$ 297/mês",
    maintenancePriceCents: 29700,
    proposalLimit: 600,
    artLimit: 15,
    features: ["Até 600 propostas por mês", "15 artes de divulgação por mês", "Tudo do Pro Site", "Site completo simples", "Copy e textos do site", "Cadastro inicial de serviços", "Treinamento rápido"],
  },
};

export function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}
