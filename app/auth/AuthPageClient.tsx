"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Lock, Mail, User } from "lucide-react";

type AuthMode = "login" | "signup";

export function AuthPageClient({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const isSignup = mode === "signup";
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

    if (isSignup && password.length < 8) {
      setAuthError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (isSignup && turnstileSiteKey && !turnstileToken) {
      setAuthError("Confirme a protecao anti-bot para criar a conta.");
      return;
    }

    setAuthLoading(true);
    try {
      await apiPost(mode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
        name: name.trim(),
        email: email.trim(),
        password,
        turnstileToken,
      });
      router.push("/");
      router.refresh();
    } catch (caught) {
      setAuthError(caught instanceof Error ? caught.message : "Nao foi possivel entrar agora.");
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      {isSignup && turnstileSiteKey ? (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      ) : null}
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="grid content-between gap-8 rounded-lg bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10 sm:min-h-[620px] sm:p-8">
          <a className="inline-flex items-center gap-2 font-black" href="/">
            <span className="grid h-12 w-40 place-items-center rounded-lg bg-white/95 px-3">
              <img alt="FechaPro" className="h-9 w-full object-contain" src="/brand/logofechapro.png" />
            </span>
          </a>

          <div>
            <p className="text-xs font-black uppercase text-green-300">{isSignup ? "Comece agora" : "Bem-vindo de volta"}</p>
            <h1 className="mt-3 max-w-[11ch] text-5xl font-black leading-none sm:text-7xl">
              {isSignup ? "Crie propostas que vendem." : "Acesse seu painel."}
            </h1>
            <p className="mt-5 max-w-lg leading-7 text-white/70">
              {isSignup
                ? "Cadastre-se para montar propostas com portfolio, PDF, status e botao de aceite."
                : "Entre para gerenciar clientes, servicos, portfolio, depoimentos e propostas."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["Link", "PDF", "Aceite"].map((item) => (
              <div className="grid min-h-20 place-items-end rounded-lg bg-white/10 p-3 text-sm font-black" key={item}>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 sm:p-6">
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <a className={`grid min-h-11 place-items-center rounded-md font-black ${!isSignup ? "bg-white shadow-sm" : "text-slate-500"}`} href="/login">
              Entrar
            </a>
            <a className={`grid min-h-11 place-items-center rounded-md font-black ${isSignup ? "bg-white shadow-sm" : "text-slate-500"}`} href="/cadastro">
              Criar conta
            </a>
          </div>

          <form className="grid gap-4" onSubmit={submitAuth}>
            <div>
              <p className="text-xs font-black uppercase text-blue-700">{isSignup ? "Cadastro" : "Login"}</p>
              <h2 className="text-2xl font-black leading-tight">{isSignup ? "Crie sua conta gratis" : "Entre no FechaPro"}</h2>
            </div>

            {authError ? (
              <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-900">
                {authError}
              </div>
            ) : null}

            {isSignup ? <AuthField icon={User} label="Nome" value={name} onChange={setName} /> : null}
            <AuthField icon={Mail} label="E-mail" type="email" value={email} onChange={setEmail} />
            <AuthField icon={Lock} label="Senha" type="password" value={password} onChange={setPassword} />

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

            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={authLoading} type="submit">
              <Lock size={18} />
              {authLoading ? "Aguarde..." : isSignup ? "Criar conta e entrar" : "Entrar no FechaPro"}
            </button>

            <p className="text-sm leading-6 text-slate-500">
              Acesse seu painel para criar propostas, organizar clientes e acompanhar aceites.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

function AuthField({
  icon: Icon,
  label,
  onChange,
  type = "text",
  value,
}: {
  icon: React.ElementType;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-extrabold text-slate-600">
      {label}
      <span className="flex min-h-12 items-center gap-3 rounded-lg border border-black/10 bg-slate-50 px-3 focus-within:outline focus-within:outline-3 focus-within:outline-green-700/20">
        <Icon className="shrink-0 text-slate-500" size={18} />
        <input className="min-h-11 flex-1 bg-transparent text-slate-900 outline-none" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
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

async function apiPost(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Nao foi possivel continuar."));
  }

  return response.json();
}

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string; message?: string };
    return data.error || data.message || fallback;
  } catch {
    return fallback;
  }
}
