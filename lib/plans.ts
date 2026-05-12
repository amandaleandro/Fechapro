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
    features: string[];
  }
> = {
  start: {
    code: "start",
    name: "Start",
    price: "R$ 49/mes",
    priceCents: 4900,
    proposalLimit: 20,
    features: ["Orcamentos simples", "Link para enviar ao cliente", "Modelos basicos", "Ate 20 propostas por mes"],
  },
  pro: {
    code: "pro",
    name: "Essencial",
    price: "R$ 97/mes",
    priceCents: 9700,
    proposalLimit: 50,
    features: ["Ate 50 propostas por mes", "Orcamentos personalizados", "Cadastro de servicos", "Identidade basica", "Link profissional"],
  },
  plus: {
    code: "plus",
    name: "Profissional",
    price: "R$ 147/mes",
    priceCents: 14700,
    proposalLimit: 120,
    features: ["Ate 120 propostas por mes", "Portfolio dentro do FechaPro", "Modelos de proposta", "Pagina de apresentacao", "Suporte inicial"],
  },
  premium: {
    code: "premium",
    name: "Pro Site",
    price: "R$ 497 primeiro mes",
    priceCents: 49700,
    maintenancePrice: "R$ 197/mes depois",
    maintenancePriceCents: 19700,
    proposalLimit: 300,
    features: ["Ate 300 propostas por mes", "Tudo do Profissional", "Criacao de site one page", "Inicio, servicos, sobre, portfolio e contato", "Botao para orcamento"],
  },
  premium_site: {
    code: "premium_site",
    name: "Premium Site",
    price: "R$ 997 primeiro mes",
    priceCents: 99700,
    maintenancePrice: "R$ 297/mes depois",
    maintenancePriceCents: 29700,
    proposalLimit: 600,
    features: ["Ate 600 propostas por mes", "Tudo do Pro Site", "Site completo simples", "Copy e textos do site", "Cadastro inicial de servicos", "Treinamento rapido"],
  },
};

export function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}
