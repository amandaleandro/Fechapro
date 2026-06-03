"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Ban, CheckCircle2, DollarSign, Eye, HelpCircle, ImageIcon, KeyRound, LayoutTemplate, MessageCircle, PauseCircle, RefreshCcw, RotateCcw, Search, Send, ShieldCheck, Trash2, Upload, UserCog, UserPlus, XCircle } from "lucide-react";
import { isUnlimitedProposalLimit, isUnlimitedArtLimit } from "@/lib/plans";

type PlanCode = "start" | "essential" | "professional" | "complete" | "pro" | "plus" | "premium" | "premium_site" | "founder_start" | "founder_essential" | "founder_professional" | "founder_complete_site" | "founder";

type AdminPlan = {
  code: PlanCode;
  name: string;
  proposalLimit: number;
  artLimit: number;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  brandProfile: {
    businessName: string;
    whatsapp: string | null;
  } | null;
  subscription: {
    plan: PlanCode;
    status: string;
    provider: string | null;
  };
  usage: {
    proposalsThisMonth: number;
    proposalLimit: number;
    proposalsUsedSinceSubscriptionStart?: number;
    accumulatedProposalLimit?: number;
    artsThisMonth: number;
    artLimit: number;
  };
  _count: {
    proposalAssets: number;
    marketingArtAssets: number;
    clientAssets: number;
  };
};

type AdminPayload = {
  plans: AdminPlan[];
  users: AdminUser[];
};

type MetricsPeriodKey = "daily" | "weekly" | "monthly" | "yearly";

type AdminMetrics = {
  periods: Record<
    MetricsPeriodKey,
    {
      accessCount: number;
      revenueCents: number;
      start: string;
      end: string;
    }
  >;
};

type AdminWhatsAppStatus = {
  authDir: string;
  configured: boolean;
  connected: boolean;
  phone: string | null;
  qr: string | null;
  qrImage: string | null;
  error: string | null;
};

type AdminMarketingArt = {
  id: string;
  title: string;
  format: string;
  objective: string;
  serviceName: string | null;
  audience: string | null;
  callToAction: string | null;
  caption: string | null;
  whatsappMessage: string | null;
  prompt: string;
  imageUrl: string;
  referenceImageUrl: string | null;
  source: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
    brandProfile: {
      businessName: string;
      whatsapp: string | null;
    } | null;
  };
};

type AdminSupportThread = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    brandProfile: {
      businessName: string;
      whatsapp: string | null;
    } | null;
  };
  messages: Array<{
    id: string;
    role: string;
    body: string;
    createdAt: string;
  }>;
};

const statuses = ["active", "trial", "blocked", "pending", "paused", "canceled"];

const statusLabels: Record<string, string> = {
  active: "Liberado sem pagamento",
  trial: "Teste liberado",
  blocked: "Bloqueado",
  pending: "Pendente",
  paused: "Pausado",
  canceled: "Cancelado",
};

export default function AdminPage() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [arts, setArts] = useState<AdminMarketingArt[]>([]);
  const [supportThreads, setSupportThreads] = useState<AdminSupportThread[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<AdminWhatsAppStatus | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [connectingWhatsApp, setConnectingWhatsApp] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    plan: "start" as PlanCode,
    status: "active",
  });

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível carregar o painel."));
      setData((await response.json()) as AdminPayload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }

  async function loadArts() {
    try {
      const response = await fetch("/api/admin/marketing-arts", { cache: "no-store" });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível carregar os pedidos de arte."));
      setArts((await response.json()) as AdminMarketingArt[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os pedidos de arte.");
    }
  }

  async function loadMetrics() {
    try {
      const response = await fetch("/api/admin/metrics", { cache: "no-store" });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível carregar as métricas."));
      setMetrics((await response.json()) as AdminMetrics);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar as métricas.");
    }
  }

  async function loadWhatsAppStatus() {
    try {
      const response = await fetch("/api/admin/whatsapp", { cache: "no-store" });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível carregar o WhatsApp."));
      const status = (await response.json()) as AdminWhatsAppStatus;
      setWhatsappStatus(status);
      if (status.error) {
        setWhatsappError(status.error);
      } else {
        setWhatsappError(null);
      }
    } catch (caught) {
      setWhatsappError(caught instanceof Error ? caught.message : "Não foi possível carregar o WhatsApp.");
    }
  }

  async function loadSupportThreads() {
    try {
      const response = await fetch("/api/admin/support", { cache: "no-store" });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível carregar o suporte."));
      const payload = (await response.json()) as { threads: AdminSupportThread[] };
      setSupportThreads(payload.threads);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o suporte.");
    }
  }

  useEffect(() => {
    loadUsers();
    loadArts();
    loadMetrics();
    loadSupportThreads();
    loadWhatsAppStatus();
  }, []);

  useEffect(() => {
    if (!whatsappModalOpen || whatsappStatus?.connected) return;
    const interval = window.setInterval(() => {
      loadWhatsAppStatus();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [whatsappModalOpen, whatsappStatus?.connected]);

  // O backend renova o QR sozinho (recria o socket quando o QR expira) e o
  // polling de 3s acima já busca o QR novo, então não forçamos reset pelo
  // cliente — fazer isso poderia apagar uma sessão recém-escaneada.

  async function disconnectWhatsApp() {
    if (!window.confirm("Desconectar o número do WhatsApp? A sessão será encerrada e as notificações serão pausadas até reconectar.")) return;
    setConnectingWhatsApp(true);
    setWhatsappError(null);
    try {
      const response = await fetch("/api/admin/whatsapp", { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível desconectar o WhatsApp."));
      setWhatsappStatus((await response.json()) as AdminWhatsAppStatus);
      setNotice("WhatsApp desconectado.");
    } catch (caught) {
      setWhatsappError(caught instanceof Error ? caught.message : "Não foi possível desconectar o WhatsApp.");
    } finally {
      setConnectingWhatsApp(false);
    }
  }

  async function connectWhatsApp() {
    setConnectingWhatsApp(true);
    setWhatsappModalOpen(true);
    setWhatsappError(null);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetSession: !whatsappStatus?.connected }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível conectar o WhatsApp."));
      const status = (await response.json()) as AdminWhatsAppStatus;
      setWhatsappStatus(status);
      if (status.error) {
        setWhatsappError(status.error);
      } else {
        setNotice(status.connected ? "WhatsApp FechaPro conectado." : "Escaneie o QR Code para conectar o WhatsApp FechaPro.");
      }
    } catch (caught) {
      setWhatsappError(caught instanceof Error ? caught.message : "Não foi possível conectar o WhatsApp.");
    } finally {
      setConnectingWhatsApp(false);
    }
  }

  async function uploadArt(item: AdminMarketingArt, file: File, caption: string, whatsappMessage: string) {
    setSavingId(item.id);
    setNotice(null);
    setError(null);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const uploadResponse = await fetch("/api/uploads", { method: "POST", body: uploadData });
      if (!uploadResponse.ok) throw new Error(await readApiError(uploadResponse, "Não foi possível enviar a imagem."));
      const uploadResult = (await uploadResponse.json()) as { imageUrl: string };
      const response = await fetch(`/api/admin/marketing-arts/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, imageUrl: uploadResult.imageUrl, whatsappMessage }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível anexar a arte."));
      setNotice(`Arte de ${item.user.name} enviada para aprovação.`);
      await loadArts();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível anexar a arte.");
    } finally {
      setSavingId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return data?.users || [];
    return (data?.users || []).filter((user) =>
      [user.name, user.email, user.brandProfile?.businessName || ""].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [data, query]);

  async function updateSubscription(user: AdminUser, plan: PlanCode, status: string) {
    setSavingId(user.id);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, status }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível atualizar o plano."));
      setNotice(`Assinatura de ${user.name} atualizada.`);
      await loadUsers();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o plano.");
    } finally {
      setSavingId(null);
    }
  }

  async function createUser(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreatingUser(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível criar o usuário."));
      setNotice(`Usuário ${newUser.name} criado e liberado pelo admin.`);
      setNewUser({ email: "", name: "", password: "", plan: "start", status: "active" });
      await loadUsers();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar o usuário.");
    } finally {
      setCreatingUser(false);
    }
  }

  async function seedDemoProposals(replace: boolean) {
    setSeedingDemo(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/seed-demo-proposals${replace ? "?replace=1" : ""}`, { method: "POST" });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível criar as propostas demo."));
      const result = (await response.json()) as { created: number; photos?: number; services?: number };
      setNotice(`${result.created} propostas demo, ${result.services || 0} serviços e ${result.photos || 0} fotos de nicho criadas no perfil do admin.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar as propostas demo.");
    } finally {
      setSeedingDemo(false);
    }
  }

  async function clearDemoProposals() {
    setSeedingDemo(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/seed-demo-proposals", { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível remover as propostas demo."));
      const result = (await response.json()) as { deleted: number; photosDeleted?: number; servicesDeleted?: number };
      setNotice(`${result.deleted} propostas demo, ${result.servicesDeleted || 0} serviços e ${result.photosDeleted || 0} fotos de nicho removidas.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível remover as propostas demo.");
    } finally {
      setSeedingDemo(false);
    }
  }

  async function answerSupport(thread: AdminSupportThread, message: string) {
    setSavingId(thread.id);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: thread.id, message, status: "answered" }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "Não foi possível responder o suporte."));
      setNotice(`Resposta enviada para ${thread.user.name}.`);
      await loadSupportThreads();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível responder o suporte.");
    } finally {
      setSavingId(null);
    }
  }

  const totalUsers = data?.users.length || 0;
  const activeUsers = data?.users.filter((user) => ["active", "trial"].includes(user.subscription.status)).length || 0;
  const blockedUsers = data?.users.filter((user) => user.subscription.status === "blocked").length || 0;

  return (
    <main className="min-h-screen bg-[var(--ui-bg)] text-slate-950">
      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link className="mb-3 inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950" href="/">
              <ArrowLeft size={16} />
              Voltar ao painel
            </Link>
            <p className="text-xs font-black uppercase text-blue-700">Admin geral</p>
            <h1 className="mt-1 text-3xl font-black tracking-normal sm:text-4xl">Liberação manual de planos</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold text-slate-600">
              Use esta tela para liberar clientes sem pagamento confirmado, reativar assinaturas atrasadas ou bloquear acessos.
            </p>
          </div>
          <button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-4 font-black text-white" type="button" onClick={() => { loadUsers(); loadMetrics(); loadSupportThreads(); loadWhatsAppStatus(); }}>
            <RefreshCcw size={17} />
            Atualizar
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <AdminStat icon={UserCog} label="Usuários" value={String(totalUsers)} />
          <AdminStat icon={CheckCircle2} label="Liberados" value={String(activeUsers)} />
          <AdminStat icon={ShieldCheck} label="Bloqueados" value={String(blockedUsers)} />
        </section>

        <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-green-700">WhatsApp FechaPro</p>
              <h2 className="text-xl font-black sm:text-2xl">Número oficial de notificações</h2>
              <p className="mt-1 max-w-3xl text-sm font-bold text-slate-600">
                O admin geral conecta um único número remetente. As notificações de proposta são enviadas para o WhatsApp cadastrado na Marca do usuário dono da proposta.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black" type="button" onClick={loadWhatsAppStatus}>
                <RefreshCcw size={15} />
                Atualizar
              </button>
              {whatsappStatus?.connected || whatsappStatus?.qr ? (
                <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-700/30 bg-rose-50 px-3 text-sm font-black text-rose-700 disabled:opacity-60" disabled={connectingWhatsApp} type="button" onClick={disconnectWhatsApp}>
                  <XCircle size={15} />
                  Desconectar
                </button>
              ) : null}
              <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-black text-white disabled:opacity-60" disabled={connectingWhatsApp} type="button" onClick={connectWhatsApp}>
                <MessageCircle size={16} />
                {connectingWhatsApp ? "Conectando..." : whatsappStatus?.connected ? "Reconectar" : "Conectar número"}
              </button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                <p>Status: <span className={whatsappStatus?.connected ? "text-green-700" : "text-amber-700"}>{whatsappStatus?.connected ? "Conectado" : "Aguardando conexão"}</span></p>
                <p className="mt-2">Sessão: {whatsappStatus?.authDir || "Não configurada"}</p>
                {whatsappStatus?.phone ? <p className="mt-2">Número conectado: {whatsappStatus.phone}</p> : null}
              </div>
              {whatsappError && !whatsappStatus?.connected ? (
                <div className="rounded-lg border border-red-700/20 bg-red-50 p-3 text-sm font-bold text-red-900">{whatsappError}</div>
              ) : null}
            </div>
            {whatsappStatus?.qrImage ? (
              <button className="grid justify-items-center gap-2 rounded-lg border border-green-700/20 bg-green-50 p-3 text-left" type="button" onClick={() => setWhatsappModalOpen(true)}>
                <Image alt="QR Code para conectar WhatsApp FechaPro" className="rounded-lg bg-white p-2" height={128} src={whatsappStatus.qrImage} unoptimized width={128} />
                <p className="max-w-48 text-center text-xs font-black text-green-800">Abrir QR Code</p>
              </button>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-blue-700">Suporte ao usuário</p>
              <h2 className="text-xl font-black sm:text-2xl">Chat com clientes</h2>
              <p className="mt-1 text-sm font-bold text-slate-600">
                Responda as mensagens enviadas pela aba Suporte do painel do cliente.
              </p>
            </div>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black" type="button" onClick={loadSupportThreads}>
              <RefreshCcw size={15} />
              Atualizar suporte
            </button>
          </div>
          {supportThreads.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {supportThreads.map((thread) => (
                <AdminSupportCard key={thread.id} thread={thread} saving={savingId === thread.id} onAnswer={answerSupport} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Nenhuma conversa de suporte aberta ainda.
            </div>
          )}
        </section>

        <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-blue-700">Métricas gerais</p>
              <h2 className="text-xl font-black sm:text-2xl">Acessos e receita</h2>
              <p className="mt-1 text-sm font-bold text-slate-600">
                Acompanhamento diário, semanal, mensal e anual dos acessos registrados e pagamentos confirmados.
              </p>
            </div>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black" type="button" onClick={loadMetrics}>
              <RefreshCcw size={15} />
              Atualizar métricas
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(["daily", "weekly", "monthly", "yearly"] as MetricsPeriodKey[]).map((period) => (
              <MetricCard key={period} label={metricPeriodLabel(period)} period={metrics?.periods[period] || null} />
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-blue-700">Artes solicitadas</p>
              <h2 className="text-xl font-black sm:text-2xl">Upload do agente para aprovação</h2>
              <p className="mt-1 text-sm font-bold text-slate-600">
                Os pedidos feitos pelo cliente em Artes de divulgação aparecem aqui. Anexe a arte pronta para enviar ao cliente aprovar.
              </p>
            </div>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black" type="button" onClick={loadArts}>
              <RefreshCcw size={15} />
              Atualizar artes
            </button>
          </div>
          {arts.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {arts.map((item) => (
                <AdminArtCard key={item.id} item={item} saving={savingId === item.id} onUpload={uploadArt} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Nenhum pedido de arte ainda. Quando um cliente solicitar uma arte em Artes de divulgação, ela aparece aqui para upload.
            </div>
          )}
        </section>

        <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <form className="grid gap-4 rounded-lg border border-green-700/20 bg-green-50 p-4 sm:p-5" onSubmit={createUser}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-green-700">Criar usuário manual</p>
                <h2 className="text-xl font-black sm:text-2xl">Acesso sem pagamento</h2>
                <p className="mt-1 text-sm font-bold text-slate-600">
                  Cadastre nome, e-mail e senha para entregar o login ao cliente. O plano fica com provedor admin e não passa pelo checkout.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-green-700">
                <KeyRound size={14} />
                Login direto
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_1.2fr_1fr_1fr_1fr]">
              <AdminInput
                autoComplete="name"
                label="Nome"
                required
                value={newUser.name}
                onChange={(value) => setNewUser((current) => ({ ...current, name: value }))}
              />
              <AdminInput
                autoComplete="email"
                label="E-mail"
                required
                type="email"
                value={newUser.email}
                onChange={(value) => setNewUser((current) => ({ ...current, email: value }))}
              />
              <AdminInput
                autoComplete="new-password"
                label="Senha"
                minLength={8}
                required
                type="password"
                value={newUser.password}
                onChange={(value) => setNewUser((current) => ({ ...current, password: value }))}
              />
              <label className="grid gap-2 text-sm font-extrabold text-slate-600">
                Plano
                <select className="min-h-11 rounded-lg border border-black/10 bg-white px-3 font-bold outline-green-700" value={newUser.plan} onChange={(event) => setNewUser((current) => ({ ...current, plan: event.target.value as PlanCode }))}>
                  {(data?.plans || []).map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-extrabold text-slate-600">
                Status
                <select className="min-h-11 rounded-lg border border-black/10 bg-white px-3 font-bold outline-green-700" value={newUser.status} onChange={(event) => setNewUser((current) => ({ ...current, status: event.target.value }))}>
                  {statuses.map((item) => (
                    <option key={item} value={item}>
                      {statusLabels[item] || item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white disabled:opacity-60 sm:w-fit" disabled={creatingUser || !data?.plans.length} type="submit">
              <UserPlus size={17} />
              {creatingUser ? "Criando usuário..." : "Criar usuário liberado"}
            </button>
          </form>

          <div className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4">
            <Search className="text-slate-500" size={18} />
            <input className="min-h-10 flex-1 bg-transparent outline-none" placeholder="Buscar por nome, e-mail ou empresa" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>

          {error ? <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-900">{error}</div> : null}
          {notice ? <div className="rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold text-green-900">{notice}</div> : null}

          {loading ? (
            <div className="rounded-lg border border-black/10 p-5 text-sm font-bold text-slate-500">Carregando usuários...</div>
          ) : filteredUsers.length ? (
            <>
              <p className="text-xs font-bold text-slate-500">
                {filteredUsers.length} {filteredUsers.length === 1 ? "usuário" : "usuários"}
                {query ? " encontrado(s) na busca" : ""}
              </p>
              <div className="grid gap-3">
                {filteredUsers.map((user) => (
                  <AdminUserRow
                    key={user.id}
                    plans={data?.plans || []}
                    saving={savingId === user.id}
                    user={user}
                    onSave={updateSubscription}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">
              {query ? "Nenhum usuário encontrado para essa busca." : "Nenhum usuário cadastrado ainda."}
            </div>
          )}
        </section>
        <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-black uppercase text-purple-700">Propostas demonstração</p>
            <h2 className="text-xl font-black sm:text-2xl">Demo por nicho</h2>
            <p className="mt-1 text-sm font-bold text-slate-600">
              Cria propostas reais de demonstração no perfil do admin, com clientes fictícios, fotos de portfólio por nicho, PDF e link público para copiar e enviar como exemplo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-purple-700 px-4 text-sm font-black text-white disabled:opacity-60"
              disabled={seedingDemo}
              type="button"
              onClick={() => seedDemoProposals(false)}
            >
              <LayoutTemplate size={16} />
              {seedingDemo ? "Criando..." : "Criar propostas demo"}
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-purple-700 px-4 text-sm font-black text-white disabled:opacity-60"
              disabled={seedingDemo}
              type="button"
              onClick={() => seedDemoProposals(true)}
            >
              <RefreshCcw size={16} />
              {seedingDemo ? "Recriando..." : "Recriar (apaga e recria)"}
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-700/30 bg-rose-50 px-4 text-sm font-black text-rose-700 disabled:opacity-60"
              disabled={seedingDemo}
              type="button"
              onClick={clearDemoProposals}
            >
              <Trash2 size={16} />
              {seedingDemo ? "Removendo..." : "Remover todas as demos"}
            </button>
          </div>
        </section>
      </div>
      {whatsappModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
          <div className="grid max-h-[92vh] w-full max-w-lg gap-4 overflow-auto rounded-lg bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-green-700">WhatsApp FechaPro</p>
                <h2 className="text-2xl font-black">Conectar número oficial</h2>
                <p className="mt-1 text-sm font-bold text-slate-600">
                  Escaneie este QR Code com o WhatsApp que será usado pelo FechaPro para enviar notificações.
                </p>
              </div>
              <button className="rounded-lg border border-black/10 p-2 text-slate-600 hover:text-slate-950" type="button" onClick={() => setWhatsappModalOpen(false)} aria-label="Fechar modal">
                <XCircle size={20} />
              </button>
            </div>

            {whatsappStatus?.connected ? (
              <div className="rounded-lg border border-green-700/20 bg-green-50 p-4 text-sm font-black text-green-800">
                WhatsApp conectado com sucesso. As notificações já podem ser enviadas.
              </div>
            ) : whatsappError ? (
              <div className="rounded-lg border border-red-700/20 bg-red-50 p-4 text-sm font-black text-red-800">
                {whatsappError}
              </div>
            ) : whatsappStatus?.qrImage ? (
              <div className="grid justify-items-center gap-3 rounded-lg border border-green-700/20 bg-green-50 p-4">
                <Image alt="QR Code para conectar WhatsApp FechaPro" className="rounded-lg bg-white p-2" height={280} src={whatsappStatus.qrImage} unoptimized width={280} />
                <p className="text-center text-sm font-black text-green-800">
                  Abra o WhatsApp no celular oficial, toque em Aparelhos conectados e escaneie o QR Code.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-700/20 bg-amber-50 p-4 text-sm font-black text-amber-900">
                Gerando QR Code... aguarde alguns segundos. Ele é atualizado automaticamente enquanto esta janela estiver aberta.
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-black/10 px-3 text-sm font-black" type="button" onClick={loadWhatsAppStatus}>
                <RefreshCcw size={15} />
                Atualizar QR
              </button>
              <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-700/30 bg-rose-50 px-3 text-sm font-black text-rose-700 disabled:opacity-60" disabled={connectingWhatsApp} type="button" onClick={disconnectWhatsApp}>
                <XCircle size={15} />
                Desconectar
              </button>
              <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-black text-white disabled:opacity-60" disabled={connectingWhatsApp} type="button" onClick={connectWhatsApp}>
                <MessageCircle size={16} />
                {connectingWhatsApp ? "Conectando..." : "Conectar novamente"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function AdminUserRow({
  onSave,
  plans,
  saving,
  user,
}: {
  onSave: (user: AdminUser, plan: PlanCode, status: string) => void;
  plans: AdminPlan[];
  saving: boolean;
  user: AdminUser;
}) {
  const [plan, setPlan] = useState<PlanCode>(user.subscription.plan);
  const [status, setStatus] = useState(user.subscription.status);

  useEffect(() => {
    setPlan(user.subscription.plan);
    setStatus(user.subscription.status);
  }, [user.subscription.plan, user.subscription.status]);

  return (
    <article className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black">{user.name}</p>
          <p className="mt-0.5 truncate text-xs font-bold text-slate-500">{user.email}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{user.brandProfile?.businessName || "Empresa não configurada"}</p>
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${statusBadgeClass(user.subscription.status)}`}>
          {statusLabels[user.subscription.status] || user.subscription.status}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Uso do mês</p>
          <p className="mt-1">
            {isUnlimitedProposalLimit(user.usage.proposalLimit)
              ? `${user.usage.proposalsThisMonth} propostas · ilimitado`
              : `${user.usage.proposalsThisMonth}/${user.usage.proposalLimit} propostas`}
          </p>
          {!isUnlimitedProposalLimit(user.usage.proposalLimit) ? (
            <p className="text-xs font-bold text-slate-500">
              Acumulado: {user.usage.proposalsUsedSinceSubscriptionStart || 0}/{user.usage.accumulatedProposalLimit || user.usage.proposalLimit}
            </p>
          ) : null}
          <p className="mt-1">
            {isUnlimitedArtLimit(user.usage.artLimit)
              ? `${user.usage.artsThisMonth} artes · ilimitado`
              : `${user.usage.artsThisMonth}/${user.usage.artLimit} artes`}
          </p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">Totais</p>
          <p className="mt-1">{user._count.proposalAssets} propostas</p>
          <p>{user._count.clientAssets} clientes</p>
          <p>{user._count.marketingArtAssets} artes</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-400">
          Plano
          <select className="min-h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-slate-900" value={plan} onChange={(event) => setPlan(event.target.value as PlanCode)}>
            {plans.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-black uppercase tracking-wide text-slate-400">
          Status
          <select className="min-h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm font-bold text-slate-900" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item] || item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs font-bold text-slate-500">
        Salvar como liberado define o provedor como admin e libera o painel mesmo sem pagamento confirmado.
      </p>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
        <button className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-green-600 px-4 font-black text-white disabled:opacity-60" disabled={saving} type="button" onClick={() => onSave(user, plan, status)}>
          <CheckCircle2 size={15} />
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <QuickAction icon={Ban} label="Bloquear" disabled={saving} onClick={() => onSave(user, plan, "blocked")} />
          <QuickAction icon={RotateCcw} label="Reativar" disabled={saving} onClick={() => onSave(user, plan, "active")} />
          <QuickAction icon={PauseCircle} label="Pausar" disabled={saving} onClick={() => onSave(user, plan, "paused")} />
          <QuickAction icon={XCircle} label="Cancelar" disabled={saving} onClick={() => onSave(user, plan, "canceled")} />
        </div>
      </div>
    </article>
  );
}

function AdminArtCard({
  item,
  onUpload,
  saving,
}: {
  item: AdminMarketingArt;
  onUpload: (item: AdminMarketingArt, file: File, caption: string, whatsappMessage: string) => void;
  saving: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState(item.caption || "");
  const [whatsappMessage, setWhatsappMessage] = useState(item.whatsappMessage || "");

  useEffect(() => {
    setCaption(item.caption || "");
    setWhatsappMessage(item.whatsappMessage || "");
    setFile(null);
  }, [item.caption, item.id, item.whatsappMessage]);

  return (
    <article className="grid gap-4 rounded-lg border border-black/10 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black">{item.title}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {item.user.name} | {item.user.brandProfile?.businessName || item.user.email}
          </p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${adminArtStatusClass(item.source)}`}>
          {adminArtStatusLabel(item.source)}
        </span>
      </div>
      <div className="grid gap-2 rounded-lg bg-white p-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
        <p><span className="font-black">Formato:</span> {item.format.replace("_", " ")}</p>
        <p><span className="font-black">Serviço:</span> {item.serviceName || "Não informado"}</p>
        <p><span className="font-black">Pedido:</span> {item.objective}</p>
        {item.referenceImageUrl ? (
          <a className="inline-flex items-center gap-2 text-sm font-black text-blue-700" href={item.referenceImageUrl} target="_blank" rel="noreferrer">
            <ImageIcon size={15} />
            Ver referência enviada
          </a>
        ) : null}
      </div>
      {item.imageUrl ? (
        <a className="overflow-hidden rounded-lg border border-black/10 bg-white" href={item.imageUrl} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={item.title} className="max-h-56 w-full object-contain" src={item.imageUrl} />
        </a>
      ) : null}
      <label className="grid gap-2 text-sm font-extrabold text-slate-600">
        Arte pronta
        <input accept="image/*" className="min-h-11 rounded-lg border border-black/10 bg-white p-3" type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
      </label>
      <label className="grid gap-2 text-sm font-extrabold text-slate-600">
        Legenda
        <textarea className="min-h-24 rounded-lg border border-black/10 bg-white p-3 outline-green-700" value={caption} onChange={(event) => setCaption(event.target.value)} />
      </label>
      <label className="grid gap-2 text-sm font-extrabold text-slate-600">
        Mensagem WhatsApp
        <textarea className="min-h-20 rounded-lg border border-black/10 bg-white p-3 outline-green-700" value={whatsappMessage} onChange={(event) => setWhatsappMessage(event.target.value)} />
      </label>
      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white disabled:opacity-60" disabled={saving || !file} type="button" onClick={() => file && onUpload(item, file, caption, whatsappMessage)}>
        <Upload size={15} />
        {saving ? "Salvando..." : "Salvar arte e enviar para aprovação"}
      </button>
    </article>
  );
}

function AdminSupportCard({
  onAnswer,
  saving,
  thread,
}: {
  onAnswer: (thread: AdminSupportThread, message: string) => void;
  saving: boolean;
  thread: AdminSupportThread;
}) {
  const [message, setMessage] = useState("");
  const lastMessage = thread.messages[thread.messages.length - 1];

  return (
    <article className="grid gap-4 rounded-lg border border-black/10 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black">{thread.user.name}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {thread.user.brandProfile?.businessName || thread.user.email}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-black uppercase ${supportStatusClass(thread.status)}`}>
          <HelpCircle size={13} />
          {supportStatusLabel(thread.status)}
        </span>
      </div>

      <div className="grid max-h-80 gap-2 overflow-y-auto rounded-lg border border-black/10 bg-white p-3">
        {thread.messages.map((item) => (
          <div className={`max-w-[88%] rounded-lg p-3 ${item.role === "admin" ? "justify-self-end bg-green-600 text-white" : "justify-self-start bg-slate-100 text-slate-900"}`} key={item.id}>
            <p className="text-[11px] font-black uppercase opacity-75">{item.role === "admin" ? "Admin" : "Cliente"}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm font-bold leading-6">{item.body}</p>
            <p className="mt-2 text-[11px] font-bold opacity-70">{formatDateTime(item.createdAt)}</p>
          </div>
        ))}
      </div>

      {lastMessage ? (
        <p className="text-xs font-bold text-slate-500">
          Ultima mensagem em {formatDateTime(lastMessage.createdAt)}
        </p>
      ) : null}

      <textarea
        className="min-h-24 rounded-lg border border-black/10 bg-white p-3 text-sm font-bold outline-green-700"
        placeholder="Responder ao cliente"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white disabled:opacity-60"
        disabled={saving || !message.trim()}
        type="button"
        onClick={() => {
          onAnswer(thread, message);
          setMessage("");
        }}
      >
        <Send size={15} />
        {saving ? "Enviando..." : "Responder"}
      </button>
    </article>
  );
}

function supportStatusLabel(status: string) {
  if (status === "answered") return "Respondido";
  if (status === "closed") return "Encerrado";
  return "Aberto";
}

function supportStatusClass(status: string) {
  if (status === "answered") return "bg-green-50 text-green-700";
  if (status === "closed") return "bg-slate-200 text-slate-700";
  return "bg-amber-50 text-amber-700";
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function adminArtStatusLabel(source: string) {
  if (source === "approved") return "Aprovada";
  if (source === "uploaded") return "Aguardando aprovação";
  if (source === "requested") return "Solicitada";
  return source || "Em preparo";
}

function adminArtStatusClass(source: string) {
  if (source === "approved") return "bg-green-50 text-green-700";
  if (source === "uploaded") return "bg-blue-50 text-blue-700";
  if (source === "requested") return "bg-amber-50 text-amber-700";
  return "bg-[var(--ui-bg)] text-slate-600";
}

function QuickAction({
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  disabled: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-black/10 bg-white px-3 text-xs font-black leading-none text-slate-700 disabled:opacity-60" disabled={disabled} type="button" onClick={onClick}>
      <Icon className="shrink-0" size={14} />
      {label}
    </button>
  );
}

function AdminInput({
  autoComplete,
  label,
  minLength,
  onChange,
  required,
  type = "text",
  value,
}: {
  autoComplete?: string;
  label: string;
  minLength?: number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-600">
      {label}
      <input
        autoComplete={autoComplete}
        className="min-h-11 rounded-lg border border-black/10 bg-white px-3 font-bold outline-green-700"
        minLength={minLength}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function statusBadgeClass(status: string) {
  if (status === "active" || status === "trial") return "bg-green-100 text-green-800";
  if (status === "blocked" || status === "canceled") return "bg-rose-100 text-rose-800";
  if (status === "paused") return "bg-amber-100 text-amber-800";
  return "bg-slate-200 text-slate-700";
}

function AdminStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black uppercase text-slate-500">{label}</p>
        <Icon className="text-blue-700" size={20} />
      </div>
      <p className="mt-3 text-3xl font-black sm:text-4xl">{value}</p>
    </div>
  );
}

function MetricCard({ label, period }: { label: string; period: AdminMetrics["periods"][MetricsPeriodKey] | null }) {
  return (
    <article className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-black uppercase text-slate-500">{label}</p>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-black text-slate-600">
            <Eye size={16} />
            Acessos
          </span>
          <strong className="text-2xl font-black">{period ? period.accessCount.toLocaleString("pt-BR") : "--"}</strong>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-black text-slate-600">
            <DollarSign size={16} />
            Receita
          </span>
          <strong className="text-2xl font-black text-green-700">{period ? formatMoney(period.revenueCents) : "--"}</strong>
        </div>
      </div>
    </article>
  );
}

function metricPeriodLabel(period: MetricsPeriodKey) {
  const labels: Record<MetricsPeriodKey, string> = {
    daily: "Hoje",
    weekly: "Semana",
    monthly: "Mês",
    yearly: "Ano",
  };
  return labels[period];
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" }).format(cents / 100);
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error || data.message || fallback;
  } catch {
    return fallback;
  }
}
