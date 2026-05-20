import { createHmac } from "node:crypto";
import { productionEnv } from "@/lib/security-env";

const secret = productionEnv("AUTH_SECRET", "fechapro_dev_secret_change_me");
const TTL_MS = 60 * 60 * 1000; // 1 hour

export function createResetToken(userId: string, passwordHash: string): string {
  const expiry = Date.now() + TTL_MS;
  const payload = `${userId}.${expiry}`;
  const sig = createHmac("sha256", secret)
    .update(`${payload}.${passwordHash.slice(0, 16)}`)
    .digest("base64url");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function decodeResetToken(token: string): { userId: string; expiry: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length < 3) return null;
    const userId = parts[0];
    const expiry = Number(parts[1]);
    if (!userId || isNaN(expiry)) return null;
    return { userId, expiry };
  } catch {
    return null;
  }
}

export function verifyResetToken(token: string, passwordHash: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    const payload = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const [, expiryStr] = payload.split(".");
    if (Date.now() > Number(expiryStr)) return false;
    const expected = createHmac("sha256", secret)
      .update(`${payload}.${passwordHash.slice(0, 16)}`)
      .digest("base64url");
    return sig === expected;
  } catch {
    return false;
  }
}
