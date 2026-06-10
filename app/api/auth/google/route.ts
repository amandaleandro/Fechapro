import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createGoogleOAuthState,
  getGoogleAuthorizationUrl,
  googleOAuthStateCookie,
  isGoogleOAuthConfigured,
} from "@/lib/google-auth";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?oauth=google_not_configured", origin));
  }

  const state = createGoogleOAuthState();
  const authorizationUrl = getGoogleAuthorizationUrl({ origin, state });
  if (!authorizationUrl) {
    return NextResponse.redirect(new URL("/login?oauth=google_not_configured", origin));
  }

  const cookieStore = await cookies();
  cookieStore.set(googleOAuthStateCookie, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });

  return NextResponse.redirect(authorizationUrl);
}
