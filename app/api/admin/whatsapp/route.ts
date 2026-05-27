import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { connectBaileysWhatsApp, getBaileysWhatsAppStatus } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await requireAdmin();
  return NextResponse.json(await statusPayload());
}

export async function POST(request: Request) {
  await requireAdmin();
  try {
    const body = (await request.json().catch(() => null)) as { resetSession?: boolean } | null;
    await connectBaileysWhatsApp({ resetSession: Boolean(body?.resetSession) });
    return NextResponse.json(await statusPayload());
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Não foi possível conectar o WhatsApp.", 502);
  }
}

async function statusPayload() {
  const status = getBaileysWhatsAppStatus();
  return {
    ...status,
    qrImage: status.qr ? await QRCode.toDataURL(status.qr, { margin: 1, width: 280 }) : null,
  };
}
