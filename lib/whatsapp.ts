import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const provider = process.env.WHATSAPP_PROVIDER || "baileys";
// Resolve para caminho absoluto: sob o Next standalone o CWD pode variar entre
// rotas/cron, e um caminho relativo apontaria para pastas diferentes — deixando
// a sessão "presa" porque o reset apagaria uma pasta e o socket leria outra.
const baileysAuthDir = path.resolve(/*turbopackIgnore: true*/ process.env.WHATSAPP_BAILEYS_AUTH_DIR || ".baileys-session");
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

// Histórico curto (em memória) dos últimos envios, para dar visibilidade no
// painel admin sem depender do log do terminal. Reinicia junto com o processo.
export type WhatsAppSendLogEntry = {
  at: string; // ISO
  tag: string;
  phone: string; // já mascarado
  channel: string;
  ok: boolean;
  reason?: string;
};

const MAX_SEND_LOG = 15;

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
  // eslint-disable-next-line no-var
  var __baileysReconnects: number;
  // eslint-disable-next-line no-var
  var __baileysClosing: boolean;
  // eslint-disable-next-line no-var
  var __whatsappSendLog: WhatsAppSendLogEntry[];
}

if (globalThis.__baileysConnected === undefined) globalThis.__baileysConnected = false;
if (globalThis.__baileysQr === undefined) globalThis.__baileysQr = null;
if (globalThis.__baileysPhone === undefined) globalThis.__baileysPhone = null;
if (globalThis.__baileysSocketPromise === undefined) globalThis.__baileysSocketPromise = null;
if (globalThis.__baileysSocketInstance === undefined) globalThis.__baileysSocketInstance = null;
if (globalThis.__baileysError === undefined) globalThis.__baileysError = null;
if (globalThis.__baileysReconnects === undefined) globalThis.__baileysReconnects = 0;
if (globalThis.__baileysClosing === undefined) globalThis.__baileysClosing = false;
if (globalThis.__whatsappSendLog === undefined) globalThis.__whatsappSendLog = [];

function recordWhatsAppSend(entry: WhatsAppSendLogEntry) {
  const log = globalThis.__whatsappSendLog;
  log.unshift(entry); // mais recente primeiro
  if (log.length > MAX_SEND_LOG) log.length = MAX_SEND_LOG;
}

export function getWhatsAppSendLog(): WhatsAppSendLogEntry[] {
  return globalThis.__whatsappSendLog ?? [];
}

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
    get reconnects() { return globalThis.__baileysReconnects; },
    set reconnects(v) { globalThis.__baileysReconnects = v; },
    // true enquanto um reset/disconnect manual está em andamento — impede que o
    // handler de "close" do socket antigo dispare uma reconexão automática.
    get closing() { return globalThis.__baileysClosing; },
    set closing(v) { globalThis.__baileysClosing = v; },
  };
}

// Acima desse número de reconexões automáticas seguidas (sem chegar em "open"),
// paramos de tentar e mostramos um erro — evita loop infinito quando o WhatsApp
// recusa a conexão (versão incompatível, número banido, etc.).
const MAX_BAILEYS_RECONNECTS = 6;

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

export function buildSatisfactionSurveyClientWhatsAppUrl(clientPhone: string, ownerName: string, serviceName: string, slug: string) {
  const digits = clientPhone.replace(/\D/g, "");
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  const surveyUrl = `${APP_URL}/p/${slug}#satisfacao`;
  const message = `Ola! ${ownerName} marcou o servico ${serviceName} como concluido e enviou uma pesquisa rapida de satisfacao. Pode responder por aqui: ${surveyUrl}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export async function sendSatisfactionSurveyToClientViaWhatsApp(clientPhone: string, ownerName: string, serviceName: string, slug: string) {
  if (!isWhatsAppNotificationConfigured()) return false;

  const digits = clientPhone.replace(/\D/g, "");
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  const surveyUrl = `${APP_URL}/p/${slug}#satisfacao`;
  const message = `Ola! ${ownerName} marcou o servico ${serviceName} como concluido e enviou uma pesquisa rapida de satisfacao.\n\nResponda por aqui: ${surveyUrl}`;

  try {
    if (provider === "baileys") {
      await sendViaBaileys(phone, message);
      return true;
    }

    if (webhookUrl) {
      await sendViaWebhook({
        phone,
        message,
        title: "Pesquisa de satisfacao",
        body: message,
        url: surveyUrl,
        tag: "satisfaction_survey",
        businessName: null,
      });
      return true;
    }

    await sendViaCloudApi(phone, message);
    return true;
  } catch (error) {
    console.error("Nao foi possivel enviar pesquisa de satisfacao por WhatsApp.", error);
    return false;
  }
}

export async function connectBaileysWhatsApp(options: { resetSession?: boolean } = {}) {
  if (provider !== "baileys") {
    throw new Error('Configure WHATSAPP_PROVIDER="baileys" para conectar pelo painel admin.');
  }

  const state = getState();

  // Já conectado: nada a fazer além de devolver o status atual.
  if (state.connected && !options.resetSession) {
    return getBaileysWhatsAppStatus();
  }

  // "Conectar" sempre começa do zero quando ainda não há sessão ativa: apaga
  // credenciais antigas/inválidas e zera o contador de reconexões.
  if (options.resetSession || !state.connected) {
    await resetBaileysSession();
  }

  state.error = null;
  state.reconnects = 0;

  // Dispara a criação do socket. Não dá throw aqui — o resultado (QR, conexão
  // ou erro) é refletido no estado e o painel faz polling do status.
  void getBaileysSocket().catch((error: unknown) => {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Baileys] Erro ao iniciar socket:", msg);
    getState().error = msg;
  });

  // Espera curta para já devolver o QR (ou a conexão) na própria resposta.
  await waitForBaileysQrOrConnection(20_000);

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
    recentSends: getWhatsAppSendLog(),
  };
}

export type WhatsAppNotificationResult = { sent: boolean; reason?: string };

export async function sendProposalWhatsAppNotification(
  userId: string,
  input: ProposalWhatsAppNotification
): Promise<WhatsAppNotificationResult> {
  if (!isWhatsAppNotificationConfigured()) {
    console.warn(`[WhatsApp] "${input.tag}" não enviada: integração não configurada (defina WHATSAPP_PROVIDER/Cloud API ou conecte o Baileys no painel admin).`);
    return { sent: false, reason: "not_configured" };
  }

  const channel = provider === "baileys" ? "baileys" : webhookUrl ? "webhook" : "cloud";

  const brand = await prisma.brandProfile.findUnique({
    where: { userId },
    select: { whatsapp: true, businessName: true },
  });
  const phone = formatWhatsAppPhone(brand?.whatsapp);
  if (!phone) {
    console.warn(`[WhatsApp] "${input.tag}" não enviada: perfil de marca do usuário ${userId} está sem WhatsApp válido.`);
    recordWhatsAppSend({ at: new Date().toISOString(), tag: input.tag, phone: "—", channel, ok: false, reason: "no_phone" });
    return { sent: false, reason: "no_phone" };
  }

  const proposalUrl = `${APP_URL}/p/${input.slug}`;
  const message = `*${input.title}*\n\n${input.body}\n\nAcompanhe aqui: ${proposalUrl}\n\nMensagem automatica do FechaPro.`;

  try {
    if (provider === "baileys") {
      await sendViaBaileys(phone, message);
    } else if (webhookUrl) {
      await sendViaWebhook({
        phone,
        message,
        title: input.title,
        body: input.body,
        url: proposalUrl,
        tag: input.tag,
        businessName: brand?.businessName || null,
      });
    } else {
      await sendViaCloudApi(phone, message);
    }

    console.log(`[WhatsApp] "${input.tag}" enviada para ${maskPhone(phone)} via ${channel}.`);
    recordWhatsAppSend({ at: new Date().toISOString(), tag: input.tag, phone: maskPhone(phone), channel, ok: true });
    return { sent: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[WhatsApp] Falha ao enviar "${input.tag}" para ${maskPhone(phone)} via ${channel}: ${reason}`);
    recordWhatsAppSend({ at: new Date().toISOString(), tag: input.tag, phone: maskPhone(phone), channel, ok: false, reason });
    return { sent: false, reason };
  }
}

function formatWhatsAppPhone(value?: string | null) {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length < 10) return "";
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

// Mascara o número nos logs (privacidade): mantém DDI/DDD e os 2 últimos dígitos.
function maskPhone(phone: string) {
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}

async function sendViaBaileys(phone: string, message: string) {
  const socket = await getBaileysSocket();
  if (!getState().connected) {
    // Espera curta: cobre uma reconexão em andamento (ex.: processo recém-reiniciado
    // religando com as credenciais persistidas), mas NÃO segura o chamador por 30s
    // quando não há sessão. Sem conexão, falha rápido — o erro fica logado e o fluxo
    // do usuário (render da proposta, redirect de aceite/recusa) não trava.
    await waitForBaileysConnection(8_000);
  }
  if (!getState().connected) {
    throw new Error("WhatsApp não está conectado. Reconecte o número no painel admin.");
  }

  await socket.sendMessage(`${phone}@s.whatsapp.net`, { text: message });
}

async function getBaileysSocket() {
  const state = getState();
  if (!state.socketPromise) {
    state.socketPromise = createBaileysSocket().catch((error) => {
      // Se a criação falhou, libera a promise para uma nova tentativa futura.
      if (getState().socketPromise) getState().socketPromise = null;
      throw error;
    });
  }

  return state.socketPromise;
}

async function resetBaileysSession() {
  const state = getState();
  state.closing = true;
  const existing = state.socketInstance;
  if (existing) {
    // logout() invalida a sessão no lado do WhatsApp; se falhar (offline),
    // pelo menos derruba o socket local.
    try { await existing.logout(); } catch {}
    try { existing.end?.(undefined); } catch {}
    try { (existing.ws as any)?.close?.(); } catch {}
  }
  state.socketInstance = null;
  state.socketPromise = null;
  state.connected = false;
  state.qr = null;
  state.phone = null;
  state.error = null;
  state.reconnects = 0;

  // A remoção da pasta de credenciais NÃO pode falhar em silêncio: se ela
  // continua no disco, todo "Conectar" reabre a mesma sessão deslogada e o
  // painel fica preso no erro "Sessão encerrada". Em vez de engolir o erro,
  // propagamos uma mensagem clara para o admin.
  try {
    await clearBaileysSession();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Baileys] Falha ao remover a sessão:", baileysAuthDir, msg);
    state.error = `Não foi possível limpar a sessão do WhatsApp em "${baileysAuthDir}": ${msg}. Apague o conteúdo dessa pasta manualmente no servidor e tente novamente.`;
    state.closing = false;
    throw new Error(state.error);
  }

  state.closing = false;
}

async function clearBaileysSession() {
  let entries;
  try {
    entries = await readdir(baileysAuthDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }

  // O diretorio pode ser a raiz de um volume Docker. Preserve o ponto de
  // montagem e apague somente as credenciais persistidas dentro dele.
  await Promise.all(entries.map((entry) => rm(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ baileysAuthDir, entry), { force: true, recursive: true })));
}

// Espera até aparecer QR, conexão estabelecida ou erro — usado para já devolver
// algo útil na resposta de "Conectar".
async function waitForBaileysQrOrConnection(timeoutMs = 20_000) {
  const timeoutAt = Date.now() + timeoutMs;
  while (Date.now() < timeoutAt) {
    const state = getState();
    if (state.connected || state.qr || state.error) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

// Espera especificamente até a conexão abrir (para envio de mensagens).
async function waitForBaileysConnection(timeoutMs = 30_000) {
  const timeoutAt = Date.now() + timeoutMs;
  while (Date.now() < timeoutAt) {
    if (getState().connected) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function createBaileysSocket() {
  const baileys = await import("@whiskeysockets/baileys");
  const makeWASocket = baileys.makeWASocket ?? (baileys as unknown as { default: typeof baileys.makeWASocket }).default;

  const { state: authState, saveCreds } = await baileys.useMultiFileAuthState(baileysAuthDir);
  // Buscar a versão atual do WhatsApp Web é ESSENCIAL: sem ela o WhatsApp
  // costuma recusar a conexão (erro 405) e o QR nunca conecta.
  const { version } = await baileys.fetchLatestBaileysVersion();
  console.log("[Baileys] Iniciando socket — versão WA:", version.join("."), "authDir:", baileysAuthDir);

  const socket = makeWASocket({
    version,
    auth: authState,
    logger: silentLogger,
    browser: baileys.Browsers.ubuntu("Chrome"),
    qrTimeout: 60_000,
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 25_000,
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  const state = getState();
  state.socketInstance = socket;
  socket.ev.on("creds.update", saveCreds);
  socket.ev.on("connection.update", (update) => {
    const liveState = getState();
    // Ignora eventos de um socket que já foi substituído (ex.: o close atrasado
    // do socket antigo após um reset). Sem isso, o handler antigo sobrescreve o
    // estado do socket novo (mesmo globalThis), deixando a sessão órfã.
    if (liveState.socketInstance !== socket) return;

    const { connection, qr, lastDisconnect } = update;
    const errMsg = (lastDisconnect?.error as Error | undefined)?.message;
    console.log("[Baileys] connection.update:", connection, "qr:", !!qr, "error:", errMsg);

    if (qr) {
      liveState.qr = qr;
      liveState.error = null;
    }

    if (connection === "open") {
      liveState.connected = true;
      liveState.qr = null;
      liveState.phone = socket.user?.id || null;
      liveState.error = null;
      liveState.reconnects = 0;
      console.log("[Baileys] Conectado! Número:", liveState.phone);
      return;
    }

    if (connection === "close") {
      liveState.connected = false;
      liveState.socketInstance = null;
      liveState.socketPromise = null;

      // Reset/disconnect manual em andamento: não reconecta automaticamente.
      if (liveState.closing) return;

      const statusCode = getDisconnectStatusCode(lastDisconnect?.error);
      const DR = baileys.DisconnectReason;

      // Sessão encerrada de vez: precisa de novo QR, então limpa credenciais.
      if (statusCode === DR.loggedOut) {
        liveState.qr = null;
        liveState.phone = null;
        liveState.reconnects = 0;
        liveState.error = "Sessão encerrada pelo WhatsApp. Clique em Conectar para gerar um novo QR Code.";
        clearBaileysSession().catch(() => null);
        return;
      }

      // Conexão substituída por outro aparelho ou banida: não adianta reconectar.
      if (statusCode === DR.connectionReplaced || statusCode === DR.forbidden || statusCode === DR.multideviceMismatch) {
        liveState.qr = null;
        liveState.error = "Conexão do WhatsApp foi recusada ou substituída. Reconecte gerando um novo QR Code.";
        return;
      }

      // Demais casos (restartRequired = 515 logo após escanear o QR, timeout do
      // QR, queda de rede) são transitórios: recria o socket automaticamente.
      // restartRequired é o passo NORMAL após o pareamento — sem reconectar aqui
      // a sessão nunca chega em "open".
      if (liveState.reconnects >= MAX_BAILEYS_RECONNECTS) {
        liveState.error = errMsg
          ? `Não foi possível conectar ao WhatsApp: ${errMsg}. Tente novamente em alguns instantes.`
          : "Não foi possível conectar ao WhatsApp. Verifique a conexão do servidor e tente novamente.";
        liveState.reconnects = 0;
        return;
      }

      liveState.reconnects += 1;
      console.log("[Baileys] Reconectando automaticamente (tentativa", liveState.reconnects, ")", statusCode === DR.restartRequired ? "[restartRequired pós-QR]" : "");
      void getBaileysSocket().catch((error) => {
        getState().error = error instanceof Error ? error.message : String(error);
      });
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
