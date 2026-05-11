import crypto from "node:crypto";

const ABACATEPAY_API_URL = "https://api.abacatepay.com/v2";
const ABACATEPAY_PUBLIC_HMAC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

type AbacateResponse<T> = {
  data: T;
  error: string | null;
  success: boolean;
};

type AbacateLegacyResponse<T> = {
  data: T;
  error: string | null;
};

export type AbacateProduct = {
  id: string;
  externalId: string;
  name: string;
  price: number;
};

export type AbacateCheckout = {
  id: string;
  externalId: string | null;
  url: string;
  amount: number;
  paidAmount: number | null;
  receiptUrl: string | null;
  status: string;
  methods?: string[];
};

export class AbacateKeyVersionError extends Error {
  constructor() {
    super("A chave da AbacatePay nao e compativel com a API v2.");
  }
}

function apiKey() {
  const key = process.env.ABACATEPAY_API_KEY?.trim();
  if (!key) throw new Error("ABACATEPAY_API_KEY nao configurada.");
  return key;
}

async function abacateFetch<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${ABACATEPAY_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as AbacateResponse<T> | null;

  if (!response.ok || !payload?.success) {
    if (payload?.error?.toLowerCase().includes("api key version mismatch")) {
      throw new AbacateKeyVersionError();
    }
    throw new Error(payload?.error || `Erro AbacatePay (${response.status}).`);
  }

  return payload.data;
}

export async function findAbacateProductByExternalId(externalId: string) {
  const params = new URLSearchParams({ externalId, limit: "1" });
  const result = await abacateFetch<AbacateProduct[]>(`/products/list?${params.toString()}`);
  return result[0] || null;
}

export async function createAbacateProduct(input: {
  description?: string;
  externalId: string;
  name: string;
  price: number;
}) {
  try {
    return await abacateFetch<AbacateProduct>("/products/create", {
      method: "POST",
      body: JSON.stringify({
        currency: "BRL",
        description: input.description,
        externalId: input.externalId,
        name: input.name,
        price: input.price,
      }),
    });
  } catch (error) {
    if (error instanceof AbacateKeyVersionError) throw error;
    const existing = await findAbacateProductByExternalId(input.externalId);
    if (existing) return existing;
    throw error;
  }
}

export async function createAbacateCheckout(input: {
  completionUrl: string;
  externalId: string;
  metadata?: Record<string, string>;
  productId: string;
  returnUrl: string;
}) {
  return abacateFetch<AbacateCheckout>("/checkouts/create", {
    method: "POST",
    body: JSON.stringify({
      completionUrl: input.completionUrl,
      externalId: input.externalId,
      items: [{ id: input.productId, quantity: 1 }],
      methods: ["PIX", "CARD"],
      metadata: {
        ...input.metadata,
        source: "fechapro",
      },
      returnUrl: input.returnUrl,
    }),
  });
}

export async function createAbacateBilling(input: {
  completionUrl: string;
  description: string;
  externalId: string;
  name: string;
  price: number;
  returnUrl: string;
}) {
  const response = await fetch("https://api.abacatepay.com/v1/billing/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      allowCoupons: false,
      completionUrl: input.completionUrl,
      externalId: input.externalId,
      frequency: "ONE_TIME",
      methods: ["PIX", "CARD"],
      metadata: {
        externalId: input.externalId,
        source: "fechapro",
      },
      products: [
        {
          description: input.description,
          externalId: `${input.externalId}-product`,
          name: input.name,
          price: input.price,
          quantity: 1,
        },
      ],
      returnUrl: input.returnUrl,
    }),
  });
  const payload = (await response.json().catch(() => null)) as AbacateLegacyResponse<AbacateCheckout> | null;

  if (!response.ok || payload?.error || !payload?.data) {
    throw new Error(payload?.error || `Erro AbacatePay v1 (${response.status}).`);
  }

  return payload.data;
}

export function verifyAbacateSignature(rawBody: string, signature: string) {
  const expectedSig = crypto.createHmac("sha256", ABACATEPAY_PUBLIC_HMAC_KEY).update(Buffer.from(rawBody, "utf8")).digest("base64");
  const expected = Buffer.from(expectedSig);
  const received = Buffer.from(signature);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
