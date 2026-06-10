"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { ArrowRight, Check, Chrome, CreditCard, FileText, Link2, Lock, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { isValidEmail } from "@/lib/validation";
import { businessSegments, proposalTemplateNiches } from "@/lib/proposal-templates";

type AuthMode = "login" | "signup";

const PANEL_FEATURES = [
  { icon: Link2, text: "Proposta em link profissional e PDF" },
  { icon: ShieldCheck, text: "Aceite digital com status em tempo real" },
  { icon: FileText, text: "Templates por nicho e segmento" },
  { icon: CreditCard, text: "Cobrança integrada via PIX e cartão" },
];

export function AuthPageClient({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [niche, setNiche] = useState("");
  const [segment, setSegment] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const isSignup = mode === "signup";
  const checkoutId = isSignup ? searchParams.get("checkout") || "" : "";
  const plan = isSignup ? searchParams.get("plan") || "" : "";
  const oauthError = !isSignup ? searchParams.get("oauth") || "" : "";
  const isFreeSignup = isSignup && plan === "free";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const googleLoginEnabled = !isSignup && Boolean(process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED);

  useEffect(() => {
    window.onFechaProTurnstile = setTurnstileToken;
    window.onFechaProTurnstileExpired = () => setTurnstileToken("");
    return () => {
      delete window.onFechaProTurnstile;
      delete window.onFechaProTurnstileExpired;
    };
  }, []);

  useEffect(() => {
    if (isSignup && !checkoutId && !isFreeSignup) {
      router.replace("/#planos");
    }
  }, [isSignup, checkoutId, isFreeSignup, router]);

  useEffect(() => {
    if (oauthError) {
      setAuthError(getOAuthErrorMessage(oauthError));
    }
  }, [oauthError]);

  async function submitAuth(event: { preventDefault(): void }) {
    event.preventDefault();
    setAuthError(null);

    if (isSignup && !name.trim()) {
      setAuthError("Informe seu nome para criar a conta.");
      return;
    }

    if (isSignup && (!niche.trim() || !segment)) {
      setAuthError("Informe seu nicho e segmento para mostrar os templates certos.");
      return;
    }

    if (!email.trim() || !password) {
      setAuthError("Informe e-mail e senha para continuar.");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setAuthError("Informe um e-mail válido.");
      return;
    }

    if (isSignup && password.length < 8) {
      setAuthError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (isSignup && turnstileSiteKey && !turnstileToken) {
      setAuthError("Confirme a proteção anti-bot para criar a conta.");
      return;
    }

    setAuthLoading(true);
    try {
      const result = await apiPost<{ isAdmin?: boolean }>(mode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
        checkoutId,
        plan: isFreeSignup ? "free" : plan,
        name: name.trim(),
        niche: niche.trim(),
        segment,
        email: email.trim(),
        password,
        turnstileToken,
      });
      router.push(!isSignup && result.isAdmin ? "/admin" : "/");
      router.refresh();
    } catch (caught) {
      setAuthError(caught instanceof Error ? caught.message : "Não foi possível entrar agora.");
    } finally {
      setAuthLoading(false);
    }
  }

  if (isSignup && !checkoutId && !isFreeSignup) return null;

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--ui-bg)] text-slate-950">
      {isSignup && turnstileSiteKey ? (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      ) : null}
      <div className="mx-auto grid min-h-screen w-full max-w-5xl gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">

        {/* Left panel */}
        <section className="relative isolate grid min-h-[380px] overflow-hidden rounded-xl border border-white/5 bg-[#0d1f2d] p-6 text-white shadow-2xl shadow-slate-900/20 sm:min-h-[480px] sm:p-8 lg:min-h-[580px]">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(16,185,129,0.18),transparent),linear-gradient(160deg,transparent,rgba(30,64,175,0.12))]" />

          <Link className="inline-flex w-fit" href="/">
            <span className="grid h-12 w-40 place-items-center rounded-lg bg-white px-3 shadow-sm shadow-black/10">
              <Image alt="FechaPro" className="h-9 w-full object-contain" src="/brand/logofechapro.png" width={144} height={36} />
            </span>
          </Link>

          <div className="self-center space-y-7">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
                <Sparkles size={12} />
                {isSignup ? "Cadastro" : "Acesso"}
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl">
                {isSignup ? (
                  <>Configure seu<br className="hidden sm:block" /> painel.</>
                ) : (
                  <>Entre no<br className="hidden sm:block" /> painel.</>
                )}
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-300/75 sm:text-lg">
                {isSignup
                  ? "Finalize o cadastro e comece a enviar propostas profissionais hoje."
                  : "Gerencie clientes, propostas e fechamentos em um só lugar."}
              </p>
            </div>

            <ul className="grid gap-3">
              {PANEL_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-slate-200/70">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/20">
                    <Icon className="text-emerald-400" size={13} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-emerald-500/50 via-emerald-400/30 to-transparent" />
        </section>

        {/* Right panel */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/8 sm:p-6">
          {isSignup ? (
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-[var(--ui-bg)] p-1">
              <a
                className="grid min-h-10 place-items-center rounded-md text-sm font-bold text-slate-500 transition hover:text-slate-950"
                href="/login"
              >
                Entrar
              </a>
              <span className="grid min-h-10 place-items-center rounded-md bg-white text-sm font-bold text-slate-950 shadow-sm ring-1 ring-slate-200">
                Criar conta
              </span>
            </div>
          ) : null}

          <form className="grid gap-5" onSubmit={submitAuth}>
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {isSignup ? "Cadastro" : "Login"}
              </p>
              <h2 className="text-2xl font-extrabold leading-tight text-slate-900">
                {isSignup ? "Finalize sua conta" : "Bem-vindo de volta"}
              </h2>
              <p className="text-sm leading-6 text-slate-500">
                {isSignup
                  ? `Pagamento${plan ? ` do plano ${plan}` : ""} confirmado. Complete os dados abaixo.`
                  : "Entre para continuar acompanhando suas propostas."}
              </p>
            </div>

            {authError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                {authError}
              </div>
            ) : null}

            {googleLoginEnabled ? (
              <a
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 font-bold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-slate-400/25"
                href="/api/auth/google"
              >
                <Chrome size={17} />
                Entrar com Google
              </a>
            ) : null}

            {googleLoginEnabled ? (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-300">
                <span className="h-px bg-slate-100" />
                ou
                <span className="h-px bg-slate-100" />
              </div>
            ) : null}

            <div className="grid gap-4">
              {isSignup ? <AuthField autoComplete="name" icon={User} label="Nome completo" maxLength={80} placeholder="Seu nome completo" required value={name} onChange={setName} /> : null}
              {isSignup ? <AuthField icon={Sparkles} label="Nicho" list="signup-template-niches" maxLength={80} placeholder="Ex: Contabilidade, Design, Marketing…" required value={niche} onChange={setNiche} /> : null}
              {isSignup ? <AuthSelect icon={User} label="Segmento" required value={segment} onChange={setSegment} /> : null}
              {isSignup ? (
                <datalist id="signup-template-niches">
                  {proposalTemplateNiches.map((option) => <option key={option} value={option} />)}
                </datalist>
              ) : null}
              <AuthField autoComplete="email" icon={Mail} label="E-mail" placeholder="voce@email.com" required type="email" value={email} onChange={setEmail} />
              <AuthField
                autoComplete={isSignup ? "new-password" : "current-password"}
                icon={Lock}
                label="Senha"
                hint={isSignup ? "Mínimo 8 caracteres" : undefined}
                minLength={isSignup ? 8 : undefined}
                placeholder="Sua senha"
                required
                type="password"
                value={password}
                onChange={setPassword}
              />
            </div>

            {isSignup && turnstileSiteKey ? (
              <div
                className="cf-turnstile"
                data-sitekey={turnstileSiteKey}
                data-callback="onFechaProTurnstile"
                data-expired-callback="onFechaProTurnstileExpired"
              />
            ) : null}

            {!isSignup ? (
              <div className="flex justify-end">
                <a href="/esqueci-senha" className="text-sm text-slate-400 underline-offset-2 transition hover:text-slate-700 hover:underline">
                  Esqueci minha senha
                </a>
              </div>
            ) : null}

            <button
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-green-600 px-5 font-bold text-white shadow-md shadow-green-700/20 transition hover:bg-green-700 focus-visible:outline focus-visible:outline-3 focus-visible:outline-green-700/25 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={authLoading}
              type="submit"
            >
              {authLoading ? <Lock size={16} /> : <ArrowRight size={16} />}
              {authLoading ? "Aguarde..." : isSignup ? "Criar conta e entrar" : "Entrar no FechaPro"}
            </button>

            <div className="grid gap-2 border-t border-slate-100 pt-3 text-sm leading-6 text-slate-500 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <Check className="text-green-600" size={14} />
                Propostas em PDF e link
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="text-green-600" size={14} />
                Aceite com status
              </span>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function AuthField({
  autoComplete,
  icon: Icon,
  label,
  hint,
  maxLength,
  minLength,
  list,
  onChange,
  placeholder,
  required = false,
  type = "text",
  value,
}: {
  autoComplete?: string;
  icon: React.ElementType;
  label: string;
  hint?: string;
  maxLength?: number;
  minLength?: number;
  list?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span className="flex items-center justify-between gap-3">
        {label}
        {hint ? <span className="text-xs font-medium text-slate-400">{hint}</span> : null}
      </span>
      <span className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 transition focus-within:border-green-500 focus-within:bg-white focus-within:outline focus-within:outline-3 focus-within:outline-green-600/15">
        <Icon className="shrink-0 text-slate-400" size={15} />
        <input
          className="min-h-10 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
          autoComplete={autoComplete}
          list={list}
          maxLength={maxLength}
          minLength={minLength}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
    </label>
  );
}

function AuthSelect({
  icon: Icon,
  label,
  onChange,
  required = false,
  value,
}: {
  icon: React.ElementType;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <span className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 transition focus-within:border-green-500 focus-within:bg-white focus-within:outline focus-within:outline-3 focus-within:outline-green-600/15">
        <Icon className="shrink-0 text-slate-400" size={15} />
        <select
          className="min-h-10 flex-1 bg-transparent text-slate-900 outline-none"
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Selecione</option>
          {businessSegments.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </span>
    </label>
  );
}

declare global {
  interface Window {
    onFechaProTurnstile?: (token: string) => void;
    onFechaProTurnstileExpired?: () => void;
  }
}

async function apiPost<T = unknown>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Não foi possível continuar."));
  }

  return response.json() as Promise<T>;
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error || data.message || fallback;
  } catch {
    return fallback;
  }
}

function getOAuthErrorMessage(error: string) {
  const messages: Record<string, string> = {
    account_not_found: "Nao encontramos uma conta FechaPro com esse e-mail do Google.",
    email_not_verified: "O e-mail da sua conta Google precisa estar verificado.",
    google_failed: "Nao foi possivel concluir o login com Google agora.",
    google_not_configured: "Login com Google ainda nao configurado neste ambiente.",
    invalid_state: "Sessao de login expirada. Tente entrar com Google novamente.",
  };

  return messages[error] || "Nao foi possivel concluir o login com Google agora.";
}
