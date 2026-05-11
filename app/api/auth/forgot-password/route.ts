import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { createResetToken } from "@/lib/token";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";

const OK_RESPONSE = NextResponse.json({ ok: true });

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`forgot:${ip}`, 5, 15 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  // Always return OK to avoid revealing if email exists
  if (!email) return OK_RESPONSE;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });

  if (user?.passwordHash) {
    const token = createResetToken(user.id, user.passwordHash);
    await sendPasswordResetEmail(user.email, token);
  }

  return OK_RESPONSE;
}
