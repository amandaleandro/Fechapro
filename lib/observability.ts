import * as Sentry from "@sentry/nextjs";
import { checkMercadoPagoConnection, mercadoPagoEnvironment } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { productionEnv } from "@/lib/security-env";
import { logError } from "@/lib/logger";

type CheckStatus = "ok" | "degraded" | "down";

type ServiceCheck = {
  status: CheckStatus;
  latencyMs?: number;
  message?: string;
  meta?: Record<string, boolean | number | string | null>;
};

type HealthReport = {
  status: CheckStatus;
  checkedAt: string;
  environment: string;
  nodeVersion: string;
  uptimeSeconds: number;
  version: string;
  services: Record<string, ServiceCheck>;
};

const startedAt = Date.now();

export function captureError(error: unknown, context?: Record<string, unknown>) {
  logError("Captured application error", error, normalizeLogContext(context));
  Sentry.captureException(error, { extra: context });
}

export function isObservabilityEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
}

export function isAuthorizedHealthRequest(request: Request) {
  const token = productionEnv("HEALTHCHECK_TOKEN");
  if (!token) return true;

  const authorization = request.headers.get("authorization");
  const headerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : request.headers.get("x-healthcheck-token")?.trim();

  return headerToken === token;
}

export async function getHealthReport(): Promise<HealthReport> {
  const [database, mercadopago] = await Promise.all([checkDatabase(), checkMercadoPago()]);
  const services = {
    app: checkApp(),
    database,
    mercadopago,
    email: checkEmail(),
    googleOAuth: checkGoogleOAuth(),
    openai: checkOpenAI(),
    push: checkPush(),
    storage: checkStorage(),
    turnstile: checkTurnstile(),
    whatsapp: checkWhatsApp(),
    sentry: checkSentry(),
  };

  return {
    status: aggregateStatus(Object.values(services)),
    checkedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    version: process.env.npm_package_version || "0.1.0",
    services,
  };
}

function checkApp(): ServiceCheck {
  const hasAppUrl = Boolean(process.env.APP_URL?.trim());
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET?.trim());
  return {
    status: hasAppUrl && hasAuthSecret ? "ok" : "degraded",
    message: hasAppUrl && hasAuthSecret ? undefined : "APP_URL ou AUTH_SECRET ausente.",
    meta: {
      hasAppUrl,
      hasPublicSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
      hasAuthSecret,
      hasHealthcheckToken: Boolean(process.env.HEALTHCHECK_TOKEN?.trim()),
    },
  };
}

async function checkDatabase(): Promise<ServiceCheck> {
  const started = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    captureError(error, { service: "database", check: "health" });
    return {
      status: "down",
      latencyMs: Date.now() - started,
      message: error instanceof Error ? error.message : "Banco indisponivel.",
    };
  }
}

async function checkMercadoPago(): Promise<ServiceCheck> {
  const config = mercadoPagoEnvironment();

  if (!config.hasAccessToken) {
    return {
      status: "degraded",
      message: "MERCADO_PAGO_ACCESS_TOKEN nao configurado.",
      meta: {
        sandbox: config.sandbox,
        hasWebhookSecret: config.hasWebhookSecret,
      },
    };
  }

  const started = Date.now();
  const connection = await checkMercadoPagoConnection();

  return {
    status: connection.ok ? "ok" : "down",
    latencyMs: Date.now() - started,
    message: connection.error || undefined,
    meta: {
      sandbox: config.sandbox,
      hasWebhookSecret: config.hasWebhookSecret,
      httpStatus: connection.status,
    },
  };
}

function checkEmail(): ServiceCheck {
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
  const hasSmtp = Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASSWORD?.trim());
  const configured = hasResend || hasSmtp;
  return {
    status: configured ? "ok" : "degraded",
    message: configured ? undefined : "Email nao configurado; envios ficam indisponiveis.",
    meta: {
      hasResend,
      hasSmtp,
      hasFrom: Boolean(process.env.EMAIL_FROM?.trim()),
    },
  };
}

function checkGoogleOAuth(): ServiceCheck {
  const hasClient = Boolean(process.env.GOOGLE_CLIENT_ID?.trim());
  const hasSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());
  const enabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true";

  if (!enabled && !hasClient && !hasSecret) {
    return { status: "ok", message: "Login Google desativado.", meta: { enabled } };
  }

  return {
    status: hasClient && hasSecret ? "ok" : "degraded",
    message: hasClient && hasSecret ? undefined : "Login Google habilitado sem credenciais completas.",
    meta: {
      enabled,
      hasClient,
      hasSecret,
      hasRedirectUri: Boolean(process.env.GOOGLE_REDIRECT_URI?.trim()),
    },
  };
}

function checkOpenAI(): ServiceCheck {
  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
  return {
    status: configured ? "ok" : "degraded",
    message: configured ? undefined : "OPENAI_API_KEY nao configurada; artes por IA podem ficar indisponiveis.",
    meta: {
      hasImageModel: Boolean(process.env.OPENAI_IMAGE_MODEL?.trim()),
    },
  };
}

function checkPush(): ServiceCheck {
  const hasPublicKey = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim());
  const hasPrivateKey = Boolean(process.env.VAPID_PRIVATE_KEY?.trim());
  const hasSubject = Boolean(process.env.VAPID_SUBJECT?.trim());
  const ok = hasPublicKey && hasPrivateKey && hasSubject;

  return {
    status: ok ? "ok" : "degraded",
    message: ok ? undefined : "VAPID incompleto; push notifications podem ficar indisponiveis.",
    meta: { hasPublicKey, hasPrivateKey, hasSubject },
  };
}

function checkStorage(): ServiceCheck {
  const hasBucket = Boolean(process.env.S3_BUCKET?.trim());
  const hasCredentials = Boolean(
    process.env.S3_ACCESS_KEY_ID?.trim() && process.env.S3_SECRET_ACCESS_KEY?.trim(),
  );

  if (!hasBucket && !hasCredentials) {
    return {
      status: "ok",
      message: "Usando armazenamento local.",
      meta: { mode: "local" },
    };
  }

  return {
    status: hasBucket && hasCredentials ? "ok" : "degraded",
    message: hasBucket && hasCredentials ? undefined : "Configuracao S3 incompleta.",
    meta: {
      mode: "s3",
      hasBucket,
      hasCredentials,
      hasPublicUrl: Boolean(process.env.S3_PUBLIC_URL?.trim()),
    },
  };
}

function checkTurnstile(): ServiceCheck {
  const hasSiteKey = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
  const hasSecret = Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());

  return {
    status: hasSiteKey && hasSecret ? "ok" : "degraded",
    message: hasSiteKey && hasSecret ? undefined : "Turnstile incompleto ou nao configurado.",
    meta: { hasSiteKey, hasSecret },
  };
}

function checkWhatsApp(): ServiceCheck {
  const provider = process.env.WHATSAPP_PROVIDER?.trim() || null;
  const baileysDir = process.env.WHATSAPP_BAILEYS_AUTH_DIR?.trim();
  if (!provider) {
    return { status: "ok", message: "WhatsApp provider nao configurado; recurso opcional.", meta: { provider } };
  }

  return {
    status: provider === "baileys" && !baileysDir ? "degraded" : "ok",
    message: provider === "baileys" && !baileysDir ? "WHATSAPP_BAILEYS_AUTH_DIR nao configurado." : undefined,
    meta: {
      provider,
      hasBaileysAuthDir: Boolean(baileysDir),
      hasSupportNumber: Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim()),
    },
  };
}

function checkSentry(): ServiceCheck {
  const configured = isObservabilityEnabled();
  return {
    status: configured ? "ok" : "degraded",
    message: configured ? undefined : "NEXT_PUBLIC_SENTRY_DSN nao configurada.",
  };
}

function aggregateStatus(checks: ServiceCheck[]): CheckStatus {
  if (checks.some((check) => check.status === "down")) return "down";
  if (checks.some((check) => check.status === "degraded")) return "degraded";
  return "ok";
}

function normalizeLogContext(context?: Record<string, unknown>) {
  if (!context) return undefined;
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null
        ? value
        : JSON.stringify(value).slice(0, 500),
    ]),
  );
}
