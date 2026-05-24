import { prisma } from "@/lib/prisma";

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const provider = process.env.WHATSAPP_PROVIDER || "";
const baileysAuthDir = process.env.WHATSAPP_BAILEYS_AUTH_DIR || ".baileys-session";
const webhookUrl = process.env.WHATSAPP_NOTIFICATION_WEBHOOK_URL || "";
const webhookToken = process.env.WHATSAPP_NOTIFICATION_WEBHOOK_TOKEN || "";
const cloudPhoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || "";
const cloudAccessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || "";

type ProposalWhatsAppNotification = {
  title: string;
  body: string;
  slug: string;
  tag: string;
};

type BaileysSocket = Awaited<ReturnType<typeof createBaileysSocket>>;

let baileysSocketPromise: Promise<BaileysSocket> | null = null;
let baileysConnected = false;

export function isWhatsAppNotificationConfigured() {
  return Boolean(provider === "baileys" || webhookUrl || (cloudPhoneNumberId && cloudAccessToken));
}

export async function sendProposalWhatsAppNotification(userId: string, input: ProposalWhatsAppNotification) {
  if (!isWhatsAppNotificationConfigured()) return;

  const brand = await prisma.brandProfile.findUnique({
    where: { userId },
    select: { whatsapp: true, businessName: true },
  });
  const phone = formatWhatsAppPhone(brand?.whatsapp);
  if (!phone) return;

  const proposalUrl = `${APP_URL}/p/${input.slug}`;
  const message = `${input.title}\n\n${input.body}\n\nAbrir proposta: ${proposalUrl}`;

  try {
    if (provider === "baileys") {
      await sendViaBaileys(phone, message);
      return;
    }

    if (webhookUrl) {
      await sendViaWebhook({
        phone,
        message,
        title: input.title,
        body: input.body,
        url: proposalUrl,
        tag: input.tag,
        businessName: brand?.businessName || null,
      });
      return;
    }

    await sendViaCloudApi(phone, message);
  } catch (error) {
    console.error("Nao foi possivel enviar notificacao por WhatsApp.", error);
  }
}

function formatWhatsAppPhone(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length < 10) return "";
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

async function sendViaBaileys(phone: string, message: string) {
  const socket = await getBaileysSocket();
  if (!baileysConnected) {
    await socket.waitForConnectionUpdate(async (update) => update.connection === "open", 30_000);
  }

  await socket.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
}

async function getBaileysSocket() {
  if (!baileysSocketPromise) {
    baileysSocketPromise = createBaileysSocket().catch((error) => {
      baileysSocketPromise = null;
      throw error;
    });
  }

  return baileysSocketPromise;
}

async function createBaileysSocket() {
  const baileys = await import("@whiskeysockets/baileys");
  const { state, saveCreds } = await baileys.useMultiFileAuthState(baileysAuthDir);
  const socket = baileys.makeWASocket({
    auth: state,
    logger: silentLogger,
    printQRInTerminal: true,
  });

  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", (update) => {
    baileysConnected = update.connection === "open";

    if (update.connection === "close") {
      const statusCode = getDisconnectStatusCode(update.lastDisconnect?.error);
      if (statusCode !== baileys.DisconnectReason.loggedOut) {
        baileysSocketPromise = null;
      }
    }
  });

  return socket;
}

function getDisconnectStatusCode(error: unknown) {
  if (typeof error !== "object" || error === null) return 0;
  const output = (error as { output?: { statusCode?: number } }).output;
  return output?.statusCode || 0;
}

async function sendViaWebhook(payload: {
  phone: string;
  message: string;
  title: string;
  body: string;
  url: string;
  tag: string;
  businessName: string | null;
}) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook WhatsApp respondeu com status ${response.status}.`);
  }
}

const silentLogger = {
  level: "silent",
  child() {
    return silentLogger;
  },
  trace() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
};

async function sendViaCloudApi(phone: string, message: string) {
  const response = await fetch(`https://graph.facebook.com/v20.0/${cloudPhoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cloudAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: {
        preview_url: true,
        body: message,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Cloud API WhatsApp respondeu com status ${response.status}.`);
  }
}
