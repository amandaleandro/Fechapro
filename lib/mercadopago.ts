import { artPacks, type ArtPackCode, type PlanCode, plans } from "@/lib/plans";

const MERCADO_PAGO_BASE = "https://api.mercadopago.com";

function accessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN nao configurado.");
  return token;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${MERCADO_PAGO_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
  if (!res.ok) {
    throw new Error(data?.message || data?.error || "Erro na API do Mercado Pago.");
  }
  return data as T;
}

interface MercadoPagoPreference {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
}

interface MercadoPagoPreapproval {
  id: string;
  init_point?: string;
  status: string;
  external_reference?: string;
  payer_email?: string;
 }

export interface MercadoPagoPayment {
  id: number;
  status: string;
  status_detail?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  external_reference?: string;
  transaction_details?: {
    external_resource_url?: string;
  };
}

export interface MercadoPagoSubscription {
  id: string;
  status: string;
  external_reference?: string;
  payer_email?: string;
}

export function mercadoPagoEnvironment() {
  return {
    apiBase: MERCADO_PAGO_BASE,
    hasAccessToken: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim()),
    hasWebhookSecret: Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim()),
    sandbox: process.env.MERCADO_PAGO_SANDBOX === "true",
  };
}

export async function checkMercadoPagoConnection() {
  const config = mercadoPagoEnvironment();
  if (!config.hasAccessToken) {
    return {
      ok: false,
      status: null,
      totalCount: null,
      error: "MERCADO_PAGO_ACCESS_TOKEN nao configurado.",
    };
  }

  try {
    const res = await fetch(`${MERCADO_PAGO_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken()}` },
    });
    const data = (await res.json().catch(() => null)) as { message?: string; id?: number } | null;
    return {
      ok: res.ok,
      status: res.status,
      totalCount: typeof data?.id === "number" ? 1 : null,
      error: res.ok ? null : data?.message || "Nao foi possivel conectar ao Mercado Pago.",
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      totalCount: null,
      error: error instanceof Error ? error.message : "Nao foi possivel conectar ao Mercado Pago.",
    };
  }
}

function preferenceUrl(preference: MercadoPagoPreference) {
  const sandbox = process.env.MERCADO_PAGO_SANDBOX === "true";
  return sandbox ? preference.sandbox_init_point || preference.init_point : preference.init_point || preference.sandbox_init_point;
}

function notificationUrl(origin: string) {
  const url = new URL("/api/webhooks/mercadopago", publicOrigin(origin));
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  if (secret) url.searchParams.set("secret", secret);
  return url.toString();
}

function publicOrigin(origin: string) {
  return process.env.APP_URL?.trim().replace(/\/$/, "") || origin;
}

async function createPreference(input: {
  amountCents: number;
  description: string;
  externalReference: string;
  origin: string;
  payerEmail?: string | null;
  successPath: string;
  title: string;
}) {
  const successUrl = new URL(input.successPath, input.origin);
  const canAutoReturn = successUrl.protocol === "https:";
  const preference = await request<MercadoPagoPreference>("POST", "/checkout/preferences", {
    items: [
      {
        title: input.title,
        description: input.description,
        quantity: 1,
        currency_id: "BRL",
        unit_price: input.amountCents / 100,
      },
    ],
    payer: input.payerEmail ? { email: input.payerEmail } : undefined,
    external_reference: input.externalReference,
    back_urls: {
      success: `${input.origin}${input.successPath}`,
      pending: `${input.origin}${input.successPath}`,
      failure: `${input.origin}${input.successPath.replace("payment=success", "payment=failure")}`,
    },
    notification_url: notificationUrl(input.origin),
    auto_return: canAutoReturn ? "approved" : undefined,
  });

  const url = preferenceUrl(preference);
  if (!url) throw new Error("Mercado Pago nao retornou URL de checkout.");
  return { externalReference: input.externalReference, id: preference.id, url };
}

export async function createProposalCheckout(input: {
  amountCents: number;
  clientName: string;
  clientEmail?: string | null;
  origin: string;
  publicSlug: string;
  serviceName: string;
}) {
  return createPreference({
    amountCents: input.amountCents,
    description: `Proposta para ${input.clientName}`,
    externalReference: `proposal:${input.publicSlug}`,
    origin: input.origin,
    payerEmail: input.clientEmail,
    successPath: `/p/${input.publicSlug}?payment=success`,
    title: input.serviceName,
  });
}

export async function createPlanCheckout(input: {
  origin: string;
  plan: PlanCode;
  userEmail: string;
  userId: string;
}) {
  const plan = plans[input.plan];
  return createSubscriptionCheckout({
    amountCents: recurringAmountCents(input.plan),
    backPath: `/?payment=success&plan=${plan.code}`,
    externalReference: `subscription:${input.userId}:${plan.code}`,
    origin: input.origin,
    payerEmail: input.userEmail,
    reason: `FechaPro ${plan.name}`,
  });
}

export async function createSignupPlanCheckout(input: {
  checkoutId: string;
  email: string;
  origin: string;
  plan: PlanCode;
}) {
  const plan = plans[input.plan];
  return createSubscriptionCheckout({
    amountCents: recurringAmountCents(input.plan),
    backPath: `/cadastro?checkout=${input.checkoutId}&plan=${plan.code}&payment=success`,
    externalReference: `signup_plan:${input.checkoutId}`,
    origin: input.origin,
    payerEmail: input.email,
    reason: `FechaPro ${plan.name}`,
  });
}

async function createSubscriptionCheckout(input: {
  amountCents: number;
  backPath: string;
  externalReference: string;
  origin: string;
  payerEmail: string;
  reason: string;
}) {
  const subscription = await request<MercadoPagoPreapproval>("POST", "/preapproval", {
    reason: input.reason,
    external_reference: input.externalReference,
    payer_email: input.payerEmail,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: input.amountCents / 100,
      currency_id: "BRL",
    },
    back_url: `${publicOrigin(input.origin)}${input.backPath}`,
    status: "pending",
  });

  if (!subscription.init_point) throw new Error("Mercado Pago nao retornou URL de assinatura.");
  return {
    externalReference: input.externalReference,
    id: subscription.id,
    status: subscription.status,
    url: subscription.init_point,
  };
}

function recurringAmountCents(planCode: PlanCode) {
  const plan = plans[planCode];
  return plan.maintenancePriceCents || plan.priceCents;
}

export async function createArtPackCheckout(input: {
  origin: string;
  pack: ArtPackCode;
  userEmail: string;
  userId: string;
}) {
  const pack = artPacks[input.pack];
  const referenceId = crypto.randomUUID();
  return createPreference({
    amountCents: pack.priceCents,
    description: `${pack.name}: ${pack.credits} creditos extras para criacao de artes de divulgacao no FechaPro.`,
    externalReference: `art_pack:${input.userId}:${pack.code}:${referenceId}`,
    origin: input.origin,
    payerEmail: input.userEmail,
    successPath: `/?payment=success&artPack=${pack.code}`,
    title: `FechaPro ${pack.name}`,
  });
}

export async function getMercadoPagoPayment(paymentId: string | number) {
  return request<MercadoPagoPayment>("GET", `/v1/payments/${paymentId}`);
}

export async function getMercadoPagoSubscription(preapprovalId: string) {
  return request<MercadoPagoSubscription>("GET", `/preapproval/${preapprovalId}`);
}

export function verifyMercadoPagoWebhook(url: string) {
  const expected = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
  if (!expected) return;
  const received = new URL(url).searchParams.get("secret");
  if (received !== expected) throw new Error("Token do webhook invalido.");
}
