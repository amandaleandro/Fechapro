"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { ArrowRight, Check, CreditCard, FileText, Link2, Lock, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import { isValidEmail } from "@/lib/validation";

type AuthMode = "login" | "signup";

export function AuthPageClient({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const isSignup = mode === "signup";
  const checkoutId = isSignup ? searchParams.get("checkout") || "" : "";
  const plan = isSignup ? searchParams.get("plan") || "" : "";
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    window.onFechaProTurnstile = setTurnstileToken;
    window.onFechaProTurnstileExpired = () => setTurnstileToken("");

    return () => {
      delete window.onFechaProTurnstile;
      delete window.onFechaProTurnstileExpired;
    };
  }, []);

  async function submitAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);

    if (isSignup && !name.trim()) {
      setAuthError("Informe seu nome para criar a conta.");
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
        name: name.trim(),
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

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      {isSignup && turnstileSiteKey ? (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      ) : null}
      <div className="mx-auto grid min-h-screen w-full max-w-5xl gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="relative isolate grid min-h-[380px] overflow-hidden rounded-lg border border-slate-200/10 bg-[#102033] p-5 text-white shadow-xl shadow-slate-900/10 sm:min-h-[480px] sm:p-7 lg:min-h-[540px]">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(145deg,rgba(20,83,45,0.45),rgba(15,23,42,0.2)_42%,rgba(30,64,175,0.16))]" />
          <div className="absolute inset-x-8 bottom-0 -z-10 h-48 rounded-t-[100%] bg-emerald-400/[0.08] blur-3xl" />

          <Link className="inline-flex w-fit items-center gap-2 font-black" href="/">
            <span className="grid h-12 w-40 place-items-center rounded-lg bg-white px-3 shadow-sm shadow-black/10">
              <Image alt="FechaPro" className="h-9 w-full object-contain" src="/brand/logofechapro.png" width={144} height={36} />
            </span>
          </Link>

          <div className="self-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-100 shadow-sm">
              <Sparkles size={14} />
              {isSignup ? "Comece agora" : "Bem-vindo de volta"}
            </div>
            <h1 className="max-w-[12ch] text-3xl font-extrabold leading-tight tracking-normal sm:max-w-[11ch] sm:text-5xl">
              {isSignup ? "Crie propostas que vendem." : "Acesse seu painel."}
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-slate-200/85 sm:text-lg">
              {isSignup
                ? "Cadastre-se para montar propostas com portfólio, PDF, status e botão de aceite."
                : "Entre para gerenciar clientes, serviços, portfólio, depoimentos e propostas."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center sm:text-left">
            {[
              { icon: Link2, label: "Link" },
              { icon: FileText, label: "PDF" },
              { icon: ShieldCheck, label: "Aceite" },
            ].map(({ icon: Icon, label }) => (
              <div className="grid min-h-16 content-between rounded-lg border border-white/10 bg-white/[0.06] p-3 text-sm font-bold shadow-sm backdrop-blur" key={label}>
                <Icon className="text-emerald-200" size={21} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/8 sm:p-5">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <a className={`grid min-h-10 place-items-center rounded-md text-sm font-bold transition hover:text-slate-950 ${!isSignup ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-500"}`} href="/login">
              Entrar
            </a>
            <a className={`grid min-h-10 place-items-center rounded-md text-sm font-bold transition hover:text-slate-950 ${isSignup ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200" : "text-slate-500"}`} href="/cadastro">
              Criar conta
            </a>
          </div>

          {isSignup && !checkoutId ? (
            <div className="grid gap-5">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Plano obrigatorio</p>
                <h2 className="text-2xl font-extrabold leading-tight text-slate-900">Escolha um plano para criar sua conta</h2>
                <p className="max-w-xl text-sm leading-6 text-slate-500">
                  O acesso ao FechaPro e liberado somente depois da confirmacao do pagamento pelo Mercado Pago.
                </p>
              </div>
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 font-bold text-white shadow-sm shadow-emerald-700/10 transition hover:bg-emerald-700" href="/#planos">
                <CreditCard size={18} />
                Escolher plano
              </Link>
              <div className="rounded-lg border border-emerald-600/15 bg-emerald-50/70 p-3 text-sm font-semibold leading-6 text-emerald-950">
                Depois do pagamento, voce volta para esta tela para finalizar nome, e-mail e senha.
              </div>
            </div>
          ) : (
          <form className="grid gap-5" onSubmit={submitAuth}>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{isSignup ? "Cadastro" : "Login"}</p>
              <h2 className="text-2xl font-extrabold leading-tight">{isSignup ? "Crie sua conta e escolha seu plano" : "Entre no FechaPro"}</h2>
              <p className="max-w-xl text-sm leading-6 text-slate-500">
                {isSignup ? `Pagamento ${plan ? `do plano ${plan}` : "do plano"} confirmado? Finalize seu cadastro para liberar o painel.` : "Continue de onde parou e acompanhe suas propostas."}
              </p>
            </div>

            {authError ? (
              <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-900">
                {authError}
              </div>
            ) : null}

            <div className="grid gap-4">
              {isSignup ? <AuthField autoComplete="name" icon={User} label="Nome" maxLength={80} placeholder="Seu nome completo" required value={name} onChange={setName} /> : null}
              <AuthField autoComplete="email" icon={Mail} label="E-mail" placeholder="voce@email.com" required type="email" value={email} onChange={setEmail} />
              <AuthField autoComplete={isSignup ? "new-password" : "current-password"} icon={Lock} label="Senha" hint={isSignup ? "Mínimo de 8 caracteres." : undefined} minLength={isSignup ? 8 : undefined} placeholder="Sua senha" required type="password" value={password} onChange={setPassword} />
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
              <div className="text-right">
                <a href="/esqueci-senha" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
                  Esqueci minha senha
                </a>
              </div>
            ) : null}

            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 font-bold text-white shadow-sm shadow-emerald-700/10 transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-3 focus-visible:outline-emerald-700/25 disabled:cursor-not-allowed disabled:opacity-60" disabled={authLoading} type="submit">
              {authLoading ? <Lock size={18} /> : <ArrowRight size={18} />}
              {authLoading ? "Aguarde..." : isSignup ? "Criar conta e entrar" : "Entrar no FechaPro"}
            </button>

            <div className="grid gap-2 border-t border-slate-100 pt-1 text-sm leading-6 text-slate-500 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <Check className="text-emerald-600" size={16} />
                Propostas em PDF e link
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="text-emerald-600" size={16} />
                Aceite com status
              </span>
            </div>
          </form>
          )}
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
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-700">
      <span className="flex items-center justify-between gap-3">
        {label}
        {hint ? <span className="text-xs font-bold text-slate-400">{hint}</span> : null}
      </span>
      <span className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 transition focus-within:border-green-600 focus-within:bg-white focus-within:outline focus-within:outline-3 focus-within:outline-green-700/20">
        <Icon className="shrink-0 text-slate-500" size={16} />
        <input className="min-h-10 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400" autoComplete={autoComplete} maxLength={maxLength} minLength={minLength} placeholder={placeholder} required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
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
    headers: {
      "Content-Type": "application/json",
    },
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
