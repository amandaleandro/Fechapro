import { NextResponse } from "next/server";
import { asaasEnvironment, checkAsaasConnection } from "@/lib/asaas";
import { requireSession } from "@/lib/session";

export async function GET(request: Request) {
  await requireSession();
  const origin = process.env.APP_URL || new URL(request.url).origin;
  const config = asaasEnvironment();
  const connection = await checkAsaasConnection();

  return NextResponse.json({
    apiHost: config.apiBase.replace(/^https?:\/\//, ""),
    connection,
    hasApiKey: config.hasApiKey,
    hasWebhookToken: config.hasWebhookToken,
    sandbox: config.sandbox,
    webhookUrl: `${origin.replace(/\/$/, "")}/api/webhooks/asaas`,
  });
}
