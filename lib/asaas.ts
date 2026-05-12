import { type PlanCode, plans } from "@/lib/plans";

const ASAAS_BASE =
  process.env.ASAAS_SANDBOX === "true"
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/v3";

function apiKey() {
  const key = process.env.ASAAS_API_KEY?.trim();
  if (!key) throw new Error("ASAAS_API_KEY nao configurada.");
  return key;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    method,
    headers: {
      "access_token": apiKey(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as { errors?: { description: string }[] };
  if (!res.ok) {
    const msg =
      Array.isArray(data?.errors) && data.errors[0]?.description
        ? data.errors[0].description
        : "Erro na API do Asaas.";
    throw new Error(msg);
  }
  return data as T;
}

interface AsaasPaymentLink {
  id: string;
  url: string;
  name: string;
  status: string;
}

export function asaasEnvironment() {
  return {
    apiBase: ASAAS_BASE,
    hasApiKey: Boolean(process.env.ASAAS_API_KEY?.trim()),
    hasWebhookToken: Boolean(process.env.ASAAS_WEBHOOK_TOKEN?.trim()),
    sandbox: process.env.ASAAS_SANDBOX === "true",
  };
}

export async function checkAsaasConnection() {
  const config = asaasEnvironment();
  if (!config.hasApiKey) {
    return {
      ok: false,
      status: null,
      totalCount: null,
      error: "ASAAS_API_KEY nao configurada.",
    };
  }

  try {
    const res = await fetch(`${ASAAS_BASE}/paymentLinks?limit=1`, {
      headers: { access_token: apiKey() },
    });
    const data = (await res.json().catch(() => null)) as {
      data?: unknown[];
      errors?: { description: string }[];
      totalCount?: number;
    } | null;
    return {
      ok: res.ok,
      status: res.status,
      totalCount: typeof data?.totalCount === "number" ? data.totalCount : null,
      error: res.ok ? null : data?.errors?.[0]?.description || "Nao foi possivel conectar ao Asaas.",
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      totalCount: null,
      error: error instanceof Error ? error.message : "Nao foi possivel conectar ao Asaas.",
    };
  }
}

export async function createProposalCheckout(input: {
  amountCents: number;
  clientName: string;
  clientEmail?: string | null;
  origin: string;
  publicSlug: string;
  serviceName: string;
}) {
  return request<AsaasPaymentLink>("POST", "/paymentLinks", {
    name: input.serviceName,
    description: `Proposta para ${input.clientName}`,
    value: input.amountCents / 100,
    billingType: "UNDEFINED",
    chargeType: "DETACHED",
    notificationEnabled: !!input.clientEmail,
    callback: {
      successUrl: `${input.origin}/p/${input.publicSlug}?payment=success`,
      autoRedirect: true,
    },
  });
}

export async function createPlanCheckout(input: {
  origin: string;
  plan: PlanCode;
  userEmail: string;
  userId: string;
}) {
  const plan = plans[input.plan];
  const hasSetup = Boolean(plan.maintenancePriceCents);
  return request<AsaasPaymentLink>("POST", "/paymentLinks", {
    name: `FechaPro ${plan.name}`,
    description: hasSetup
      ? `${plan.name}: implantacao inicial. Manutencao depois: ${plan.maintenancePrice}. Limite de ${plan.proposalLimit} propostas por mes.`
      : `${plan.name} do FechaPro com limite de ${plan.proposalLimit} propostas por mes.`,
    value: plan.priceCents / 100,
    billingType: "UNDEFINED",
    chargeType: hasSetup ? "DETACHED" : "RECURRENT",
    subscriptionCycle: hasSetup ? undefined : "MONTHLY",
    notificationEnabled: true,
    callback: {
      successUrl: `${input.origin}/?payment=success&plan=${plan.code}`,
      autoRedirect: true,
    },
  });
}

export function verifyAsaasWebhook(token: string) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  if (!expected) throw new Error("ASAAS_WEBHOOK_TOKEN nao configurado.");
  if (token !== expected) throw new Error("Token do webhook invalido.");
}
