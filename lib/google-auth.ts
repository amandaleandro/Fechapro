import { randomBytes } from "node:crypto";

export const googleOAuthStateCookie = "fechapro_google_oauth_state";

const googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleUserInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";

export type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

export function isGoogleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export function createGoogleOAuthState() {
  return randomBytes(24).toString("base64url");
}

function cleanOrigin(value?: string) {
  return value?.trim().replace(/\/$/, "");
}

function isLocalOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(origin);
}

export function getPublicAppOrigin(origin: string) {
  const requestOrigin = origin.replace(/\/$/, "");

  if (process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin)) {
    return requestOrigin;
  }

  return (
    cleanOrigin(process.env.APP_URL) ||
    cleanOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    cleanOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    (isLocalOrigin(requestOrigin) ? "https://fechapro.com.br" : requestOrigin)
  );
}

export function getGoogleRedirectUri(origin: string) {
  const explicitRedirectUri = cleanOrigin(process.env.GOOGLE_REDIRECT_URI);
  if (explicitRedirectUri) return explicitRedirectUri;

  return `${getPublicAppOrigin(origin)}/api/auth/google/callback`;
}

export function getGoogleAuthorizationUrl(input: { origin: string; state: string }) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(input.origin),
    response_type: "code",
    scope: "openid email profile",
    state: input.state,
    prompt: "select_account",
  });

  return `${googleAuthUrl}?${params.toString()}`;
}

export async function getGoogleUserInfo(input: { code: string; origin: string }) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth nao configurado.");
  }

  const tokenResponse = await fetch(googleTokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(input.origin),
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Nao foi possivel validar o login do Google.");
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("Resposta do Google sem token de acesso.");
  }

  const userResponse = await fetch(googleUserInfoUrl, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userResponse.ok) {
    throw new Error("Nao foi possivel buscar o perfil do Google.");
  }

  return (await userResponse.json()) as GoogleUserInfo;
}
