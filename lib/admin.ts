import { jsonError } from "@/lib/api";
import { type SessionUser, requireSession } from "@/lib/session";

function configuredAdminEmails() {
  return (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (!isAdminEmail(session.email)) {
    throw jsonError("Acesso restrito ao administrador geral.", 403);
  }
  return session;
}
