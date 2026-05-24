import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { connectBaileysWhatsApp, getBaileysWhatsAppStatus } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await requireAdmin();
  return NextResponse.json(await statusPayload());
}

export async function POST() {
  await requireAdmin();
  await connectBaileysWhatsApp();
  return NextResponse.json(await statusPayload());
}

async function statusPayload() {
  const status = getBaileysWhatsAppStatus();
  return {
    ...status,
    qrImage: status.qr ? await QRCode.toDataURL(status.qr, { margin: 1, width: 280 }) : null,
  };
}
