import { rm } from "node:fs/promises";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const provider = process.env.WHATSAPP_PROVIDER || "baileys";
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

// Turbopack compiles whatsapp.ts into multiple chunks (one per route), so
// module-level variables are NOT shared between routes. globalThis is.
declare global {
  // eslint-disable-next-line no-var
  var __baileysSocketPromise: Promise<BaileysSocket> | null;
  // eslint-disable-next-line no-var
  var __baileysConnected: boolean;
  // eslint-disable-next-line no-var
  var __baileysQr: string | null;
  // eslint-disable-next-line no-var
  var __baileysPhone: string | null;
}

if (globalThis.__baileysConnected === undefined) globalThis.__baileysConnected = false;
if (globalThis.__baileysQr === undefined) globalThis.__baileysQr = null;
if (globalThis.__baileysPhone === undefined) globalThis.__baileysPhone = null;
if (globalThis.__baileysSocketPromise === undefined) globalThis.__baileysSocketPromise = null;

function getState() {
  return {
    get socketPromise() { return globalThis.__baileysSocketPromise; },
    set socketPromise(v) { globalThis.__baileysSocketPromise = v; },
    get connected() { return globalThis.__baileysConnected; },
    set connected(v) { globalThis.__baileysConnected = v; },
    get qr() { return globalThis.__baileysQr; },
    set qr(v) { globalThis.__baileysQr = v; },
    get phone() { return globalThis.__baileysPhone; },
    set phone(v) { globalThis.__baileysPhone = v; },
  };
}

export function isWhatsAppNotificationConfigured() {
  return Boolean(provider === "baileys" || webhookUrl || (cloudPhoneNumberId && cloudAccessToken));
}

export async function connectBaileysWhatsApp(options: { resetSession?: boolean } = {}) {
  if (provider !== "baileys") {
    throw new Error('Configure WHATSAPP_PROVIDER="baileys" para conectar pelo painel admin.');
  }

  const state = getState();
  if (options.resetSession && !state.connected) {
    await resetBaileysSession();
  }

  await getBaileysSocket();
  await waitForBaileysQrOrConnection();
  return getBaileysWhatsAppStatus();
}

export function getBaileysWhatsAppStatus() {
  const state = getState();
  return {
    authDir: baileysAuthDir,
    configured: provider === "baileys",
    connected: state.connected,
    phone: state.phone,
    qr: state.qr,
  };
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
  const message = `*${input.title}*\n\n${input.body}\n\nAcompanhe aqui: ${proposalUrl}\n\nMensagem automatica do FechaPro.`;

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
    console.error("Não foi possível enviar notificação por WhatsApp.", error);
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
  if (!getState().connected) {
    await socket.waitForConnectionUpdate(async (update) => update.connection === "open", 30_000);
  }

  await socket.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
}

async function getBaileysSocket() {
  const state = getState();
  if (!state.socketPromise) {
    state.socketPromise = createBaileysSocket().catch((error) => {
      state.socketPromise = null;
      throw error;
    });
  }

  return state.socketPromise;
}

async function resetBaileysSession() {
  const state = getState();
  state.socketPromise = null;
  state.connected = false;
  state.qr = null;
  state.phone = null;
  await rm(baileysAuthDir, { force: true, recursive: true }).catch(() => null);
}

async function waitForBaileysQrOrConnection() {
  const timeoutAt = Date.now() + 30_000;
  while (!getState().connected && !getState().qr && Date.now() < timeoutAt) {
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function createBaileysSocket() {
  console.log("[Baileys] Iniciando socket, authDir:", baileysAuthDir);
  const baileys = await import("@whiskeysockets/baileys");
  const { state: authState, saveCreds } = await baileys.useMultiFileAuthState(baileysAuthDir);
  console.log("[Baileys] Auth state carregado");
  const socket = baileys.makeWASocket({
    auth: authState,
    logger: silentLogger,
    printQRInTerminal: false,
  });

  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", (update) => {
    console.log("[Baileys] connection.update:", update.connection, "qr:", !!update.qr, "error:", update.lastDisconnect?.error?.message);
    const state = getState();
    state.connected = update.connection === "open";
    if (update.qr) {
      state.qr = update.qr;
      console.log("[Baileys] QR gerado, tamanho:", update.qr.length);
    }

    if (update.connection === "close") {
      const statusCode = getDisconnectStatusCode(update.lastDisconnect?.error);
      if (statusCode !== baileys.DisconnectReason.loggedOut) {
        state.socketPromise = null;
      }
    } else if (update.connection === "open") {
      state.qr = null;
      state.phone = socket.user?.id || null;
      console.log("[Baileys] Conectado! Numero:", state.phone);
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
