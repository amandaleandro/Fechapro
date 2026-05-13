import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/prisma";
import { asaasEnvironment, checkAsaasConnection } from "@/lib/asaas";

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
  uptimeSeconds: number;
  version: string;
  services: Record<string, ServiceCheck>;
};

const startedAt = Date.now();

export function captureError(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
}

export function isObservabilityEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
}

export function isAuthorizedHealthRequest(request: Request) {
  const token = process.env.HEALTHCHECK_TOKEN?.trim();
  if (!token) return true;

  const authorization = request.headers.get("authorization");
  const headerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : request.headers.get("x-healthcheck-token")?.trim();

  return headerToken === token;
}

export async function getHealthReport(): Promise<HealthReport> {
  const [database, asaas] = await Promise.all([checkDatabase(), checkAsaas()]);
  const services = {
    database,
    asaas,
    email: checkEmail(),
    storage: checkStorage(),
    sentry: checkSentry(),
  };

  return {
    status: aggregateStatus(Object.values(services)),
    checkedAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    version: process.env.npm_package_version || "0.1.0",
    services,
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

async function checkAsaas(): Promise<ServiceCheck> {
  const config = asaasEnvironment();

  if (!config.hasApiKey) {
    return {
      status: "degraded",
      message: "ASAAS_API_KEY não configurada.",
      meta: {
        sandbox: config.sandbox,
        hasWebhookToken: config.hasWebhookToken,
      },
    };
  }

  const started = Date.now();
  const connection = await checkAsaasConnection();

  return {
    status: connection.ok ? "ok" : "down",
    latencyMs: Date.now() - started,
    message: connection.error || undefined,
    meta: {
      sandbox: config.sandbox,
      hasWebhookToken: config.hasWebhookToken,
      httpStatus: connection.status,
    },
  };
}

function checkEmail(): ServiceCheck {
  const configured = Boolean(process.env.RESEND_API_KEY?.trim());
  return {
    status: configured ? "ok" : "degraded",
    message: configured ? undefined : "RESEND_API_KEY não configurada; e-mails ficam desativados.",
    meta: {
      hasFrom: Boolean(process.env.EMAIL_FROM?.trim()),
    },
  };
}

function checkStorage(): ServiceCheck {
  const hasBucket = Boolean(process.env.S3_BUCKET?.trim());
  const hasCredentials = Boolean(
    process.env.S3_ACCESS_KEY_ID?.trim() && process.env.S3_SECRET_ACCESS_KEY?.trim()
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

function checkSentry(): ServiceCheck {
  const configured = isObservabilityEnabled();
  return {
    status: configured ? "ok" : "degraded",
    message: configured ? undefined : "NEXT_PUBLIC_SENTRY_DSN não configurada.",
  };
}

function aggregateStatus(checks: ServiceCheck[]): CheckStatus {
  if (checks.some((check) => check.status === "down")) return "down";
  if (checks.some((check) => check.status === "degraded")) return "degraded";
  return "ok";
}
