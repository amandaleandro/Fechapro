import { rm } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const provider = process.env.WHATSAPP_PROVIDER || "baileys";
// Resolve para caminho absoluto: sob o Next standalone o CWD pode variar entre
// rotas/cron, e um caminho relativo apontaria para pastas diferentes — deixando
// a sessão "presa" porque o reset apagaria uma pasta e o socket leria outra.
const baileysAuthDir = path.resolve(process.env.WHATSAPP_BAILEYS_AUTH_DIR || ".baileys-session");
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
  var __baileysSocketInstance: BaileysSocket | null;
  // eslint-disable-next-line no-var
  var __baileysConnected: boolean;
  // eslint-disable-next-line no-var
  var __baileysQr: string | null;
  // eslint-disable-next-line no-var
  var __baileysPhone: string | null;
  // eslint-disable-next-line no-var
  var __baileysError: string | null;
}

if (globalThis.__baileysConnected === undefined) globalThis.__baileysConnected = false;
if (globalThis.__baileysQr === undefined) globalThis.__baileysQr = null;
if (globalThis.__baileysPhone === undefined) globalThis.__baileysPhone = null;
if (globalThis.__baileysSocketPromise === undefined) globalThis.__baileysSocketPromise = null;
if (globalThis.__baileysSocketInstance === undefined) globalThis.__baileysSocketInstance = null;
if (globalThis.__baileysError === undefined) globalThis.__baileysError = null;

function getState() {
  return {
    get socketPromise() { return globalThis.__baileysSocketPromise; },
    set socketPromise(v) { globalThis.__baileysSocketPromise = v; },
    get socketInstance() { return globalThis.__baileysSocketInstance; },
    set socketInstance(v) { globalThis.__baileysSocketInstance = v; },
    get connected() { return globalThis.__baileysConnected; },
    set connected(v) { globalThis.__baileysConnected = v; },
    get qr() { return globalThis.__baileysQr; },
    set qr(v) { globalThis.__baileysQr = v; },
    get phone() { return globalThis.__baileysPhone; },
    set phone(v) { globalThis.__baileysPhone = v; },
    get error() { return globalThis.__baileysError; },
    set error(v) { globalThis.__baileysError = v; },
  };
}

export function buildProposalClientWhatsAppUrl(clientPhone: string, ownerName: string, serviceName: string, slug: string) {
  const digits = clientPhone.replace(/\D/g, "");
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  const proposalUrl = `${APP_URL}/p/${slug}`;
  const message = `Olá! ${ownerName} preparou uma proposta de ${serviceName} especialmente para você. Acesse o link para ver os detalhes e confirmar sua resposta: ${proposalUrl}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export async function sendProposalToClientViaWhatsApp(clientPhone: string, ownerName: string, serviceName: string, slug: string) {
  if (!cloudPhoneNumberId || !cloudAccessToken) return false;

  const digits = clientPhone.replace(/\D/g, "");
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  const proposalUrl = `${APP_URL}/p/${slug}`;
  const message = `Olá! ${ownerName} preparou uma proposta de ${serviceName} especialmente para você. Acesse o link para ver os detalhes: ${proposalUrl}`;

  try {
    await sendViaCloudApi(phone, message);
    return true;
  } catch {
    return false;
  }
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

  state.error = null;

  const socketPromise = getBaileysSocket().catch((error: unknown) => {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Baileys] Erro ao iniciar socket:", msg);
    getState().error = msg;
    throw error;
  });

  await Promise.race([
    socketPromise.then(() => waitForBaileysQrOrConnection(15_000)),
    waitForBaileysQrOrConnection(15_000),
  ]).catch(() => null);

  return getBaileysWhatsAppStatus();
}

export async function disconnectBaileysWhatsApp() {
  await resetBaileysSession();
}

export function getBaileysWhatsAppStatus() {
  const state = getState();
  return {
    authDir: baileysAuthDir,
    configured: provider === "baileys",
    connected: state.connected,
    phone: state.phone,
    qr: state.qr,
    error: state.error,
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
  const existing = state.socketInstance;
  if (existing) {
    try { (existing.ws as any)?.terminate?.(); } catch {}
    state.socketInstance = null;
  }
  state.socketPromise = null;
  state.connected = false;
  state.qr = null;
  state.phone = null;
  state.error = null;

  // A remoção da pasta de credenciais NÃO pode falhar em silêncio: se ela
  // continua no disco, todo "Conectar" reabre a mesma sessão deslogada e o
  // painel fica preso no erro "Sessão encerrada". Em vez de engolir o erro,
  // propagamos uma mensagem clara para o admin.
  try {
    await rm(baileysAuthDir, { force: true, recursive: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Baileys] Falha ao remover a sessão:", baileysAuthDir, msg);
    state.error = `Não foi possível limpar a sessão do WhatsApp em "${baileysAuthDir}": ${msg}. Apague essa pasta manualmente no servidor e tente novamente.`;
    throw new Error(state.error);
  }
}

async function waitForBaileysQrOrConnection(timeoutMs = 30_000) {
  const timeoutAt = Date.now() + timeoutMs;
  while (Date.now() < timeoutAt) {
    const state = getState();
    if (state.connected || state.qr || state.error) break;
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

  getState().socketInstance = socket;
  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", (update) => {
    const state = getState();
    // Ignora eventos de um socket que já foi substituído (ex.: o close atrasado
    // do socket antigo após um reset). Sem isso, o handler antigo sobrescreve o
    // estado do socket novo (mesmo globalThis), deixando a sessão órfã.
    if (state.socketInstance !== socket) return;

    const { connection, qr, lastDisconnect } = update;
    console.log("[Baileys] connection.update:", connection, "qr:", !!qr, "error:", (lastDisconnect?.error as Error | undefined)?.message);

    if (qr) {
      state.qr = qr;
      state.error = null;
      console.log("[Baileys] QR gerado, tamanho:", qr.length);
    }

    if (connection === "open") {
      state.connected = true;
      state.qr = null;
      state.phone = socket.user?.id || null;
      state.error = null;
      console.log("[Baileys] Conectado! Numero:", state.phone);
    } else if (connection === "close") {
      const hadPhoneOrQr = Boolean(state.phone) || Boolean(state.qr);
      const statusCode = getDisconnectStatusCode(lastDisconnect?.error);

      state.connected = false;
      // Clear the promise so the next getBaileysSocket() creates a fresh socket.
      state.socketPromise = null;
      state.socketInstance = null;

      if (statusCode === baileys.DisconnectReason.loggedOut) {
        state.qr = null;
        state.phone = null;
        state.error = "Sessão encerrada pelo WhatsApp. Reconecte para gerar um novo QR Code.";
        rm(baileysAuthDir, { force: true, recursive: true }).catch(() => null);
      } else if (!hadPhoneOrQr) {
        // Fechou antes de gerar QR ou conectar — erro de rede ou rejeição do WhatsApp.
        const errMsg = (lastDisconnect?.error as Error | undefined)?.message;
        state.error = errMsg
          ? `Falha ao conectar ao WhatsApp: ${errMsg}. Verifique a rede do servidor.`
          : "Não foi possível conectar ao WhatsApp. Verifique a conexão do servidor e tente novamente.";
        console.error("[Baileys] Conexão encerrada antes do QR/telefone:", errMsg);
      }
    } else {
      state.connected = false;
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
