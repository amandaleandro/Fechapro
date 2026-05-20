import { productionEnv } from "@/lib/security-env";

export async function verifyTurnstile(token: string | null): Promise<boolean> {
  const secret = productionEnv("TURNSTILE_SECRET_KEY");
  if (!secret) return true; // skip only in development/test when not configured

  if (!token) return false;

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });

  const data = (await res.json()) as { success: boolean };
  return data.success;
}
