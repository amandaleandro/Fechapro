export type PlanCode = "start" | "pro" | "plus" | "premium";

export const plans: Record<
  PlanCode,
  {
    code: PlanCode;
    name: string;
    price: string;
    priceCents: number;
    proposalLimit: number;
    features: string[];
  }
> = {
  start: {
    code: "start",
    name: "Start",
    price: "R$ 49,90/mes",
    priceCents: 4990,
    proposalLimit: 20,
    features: ["Ate 20 propostas por mes", "Portfolio", "PDF", "Link publico"],
  },
  pro: {
    code: "pro",
    name: "Pro",
    price: "R$ 97/mes",
    priceCents: 9700,
    proposalLimit: 60,
    features: ["Ate 60 propostas por mes", "Aceite da proposta", "Status de visualizacao", "Marca personalizada"],
  },
  plus: {
    code: "plus",
    name: "Plus",
    price: "R$ 147/mes",
    priceCents: 14700,
    proposalLimit: 150,
    features: ["Ate 150 propostas por mes", "Templates por nicho", "IA para propostas", "Historico de visualizacoes"],
  },
  premium: {
    code: "premium",
    name: "Premium",
    price: "R$ 247/mes",
    priceCents: 24700,
    proposalLimit: 400,
    features: ["Ate 400 propostas por mes", "Tudo do Plus", "Base para equipe", "Dominio personalizado"],
  },
};

export function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}
