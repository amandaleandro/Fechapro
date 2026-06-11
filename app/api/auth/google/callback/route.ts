import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { getGoogleUserInfo, getPublicAppOrigin, googleOAuthStateCookie } from "@/lib/google-auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";
import { setSession } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const publicOrigin = getPublicAppOrigin(origin);
  const ip = getClientIp(request);

  if (!rateLimit(`google-login:${ip}`, 10, 60_000)) {
    return rateLimitError();
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(googleOAuthStateCookie)?.value;
  cookieStore.delete(googleOAuthStateCookie);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?oauth=invalid_state", publicOrigin));
  }

  try {
    const profile = await getGoogleUserInfo({ code, origin });
    const email = profile.email?.trim().toLowerCase();

    if (!email || !profile.email_verified) {
      return NextResponse.redirect(new URL("/login?oauth=email_not_verified", publicOrigin));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.redirect(new URL("/login?oauth=account_not_found", publicOrigin));
    }

    await setSession({ id: user.id, name: user.name || profile.name || user.email, email: user.email });
    return NextResponse.redirect(new URL(isAdminEmail(user.email) ? "/admin" : "/", publicOrigin));
  } catch {
    return NextResponse.redirect(new URL("/login?oauth=google_failed", publicOrigin));
  }
}
