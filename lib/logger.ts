import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, boolean | number | string | null | undefined>;

const redactedKeys = /token|secret|password|key|authorization|cookie/i;

export function logInfo(message: string, context?: LogContext) {
  writeLog("info", message, context);
}

export function logWarn(message: string, context?: LogContext) {
  writeLog("warn", message, context);
}

export function logError(message: string, error?: unknown, context?: LogContext) {
  const safeContext = sanitizeContext(context);
  const errorContext = error instanceof Error
    ? { errorName: error.name, errorMessage: error.message }
    : { errorMessage: typeof error === "string" ? error : "Unknown error" };

  writeLog("error", message, { ...safeContext, ...errorContext });
  Sentry.captureException(error instanceof Error ? error : new Error(message), { extra: safeContext });
}

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;

  const line = JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    service: "fechapro",
    environment: process.env.NODE_ENV || "development",
    ...sanitizeContext(context),
  });

  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

function sanitizeContext(context?: LogContext): LogContext {
  if (!context) return {};
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      redactedKeys.test(key) ? "[redacted]" : normalizeValue(value),
    ]),
  );
}

function normalizeValue(value: LogContext[string]) {
  if (typeof value === "string") return value.slice(0, 500);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean" || value === null || value === undefined) return value;
  return String(value).slice(0, 500);
}
