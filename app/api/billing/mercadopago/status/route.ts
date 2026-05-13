import { NextResponse } from "next/server";
import { checkMercadoPagoConnection, mercadoPagoEnvironment } from "@/lib/mercadopago";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  await requireSession();
  const origin = process.env.APP_URL || new URL(request.url).origin;
  const config = mercadoPagoEnvironment();
  const connection = await checkMercadoPagoConnection();

  return NextResponse.json({
    apiHost: config.apiBase.replace(/^https?:\/\//, ""),
    connection,
    hasAccessToken: config.hasAccessToken,
    hasWebhookSecret: config.hasWebhookSecret,
    sandbox: config.sandbox,
    webhookUrl: `${origin.replace(/\/$/, "")}/api/webhooks/mercadopago`,
  });
}
