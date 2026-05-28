"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { businessSegments, proposalTemplateNiches } from "@/lib/proposal-templates";
import { isValidEmail } from "@/lib/validation";

type PaymentStatus = "checking" | "paid" | "pending" | "timeout";

export function ContaSetupClient({
  checkoutId,
  planName,
}: {
  checkoutId: string;
  planName: string;
}) {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("checking");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [niche, setNiche] = useState("");
  const [segment, setSegment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollCount = useRef(0);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    window.onFechaProTurnstile = setTurnstileToken;
    window.onFechaProTurnstileExpired = () => setTurnstileToken("");
    return () => {
      delete window.onFechaProTurnstile;
      delete window.onFechaProTurnstileExpired;
    };
  }, []);

  async function fetchStatus(): Promise<boolean> {
    try {
      const res = await fetch(`/api/billing/signup-checkout/${checkoutId}`);
      if (!res.ok) return false;
      const data = (await res.json()) as {
        status: string;
        email?: string | null;
        claimed: boolean;
      };
      if (data.status === "paid") {
        if (data.email) setEmail(data.email);
        setPaymentStatus("paid");
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Initial check on mount
  useEffect(() => {
    if (!checkoutId) {
      setPaymentStatus("timeout");
      return;
    }
    fetchStatus().then((paid) => {
      if (!paid) setPaymentStatus("pending");
    });
  }, [checkoutId]);

  // Poll while pending — intentionally omits deps to self-schedule
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (paymentStatus !== "pending") return;
    if (pollCount.current >= 15) {
      setPaymentStatus("timeout");
      return;
    }
    const timer = setTimeout(async () => {
      pollCount.current += 1;
      const paid = await fetchStatus();
      if (!paid) setPaymentStatus("pending");
    }, 2000);
    return () => clearTimeout(timer);
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (!name.trim()) { setFormError("Informe seu nome completo."); return; }
    if (!niche.trim()) { setFormError("Informe seu nicho ou área de atuação."); return; }
    if (!segment) { setFormError("Selecione seu segmento."); return; }
    if (!email.trim() || !isValidEmail(email.trim())) { setFormError("Informe um e-mail válido."); return; }
    if (password.length < 8) { setFormError("A senha precisa ter pelo menos 8 caracteres."); return; }
    if (password !== confirmPassword) { setFormError("As senhas não conferem."); return; }
    if (turnstileSiteKey && !turnstileToken) { setFormError("Confirme a proteção anti-bot."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkoutId,
          name: name.trim(),
          email: email.trim(),
          niche: niche.trim(),
          segment,
          password,
          turnstileToken,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "Não foi possível criar a conta.");
      }
      router.push("/");
      router.refresh();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--ui-bg)] px-4 py-6 text-slate-950 sm:py-10">
      {turnstileSiteKey ? (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      ) : null}

      <div className="mx-auto w-full max-w-lg">
        <Link className="mb-8 inline-block" href="/">
          <span className="grid h-9 w-32 place-items-center rounded-lg bg-slate-950 px-3">
            <Image
              alt="FechaPro"
              className="h-7 w-full object-contain"
              src="/brand/logofechapro.png"
              width={144}
              height={36}
            />
          </span>
        </Link>

        {(paymentStatus === "checking" || paymentStatus === "pending") && (
          <div className="flex flex-col items-center gap-5 py-20 text-center">
            <RotateCcw
              className={`${paymentStatus === "checking" ? "text-green-600" : "text-amber-500"} animate-spin`}
              size={44}
            />
            <div>
              <p className="text-lg font-black text-slate-800">
                {paymentStatus === "checking"
                  ? "Verificando pagamento..."
                  : "Aguardando confirmação do Mercado Pago..."}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Isso leva alguns segundos. Não feche esta página.
              </p>
            </div>
          </div>
        )}

        {paymentStatus === "timeout" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
            <p className="text-lg font-black text-amber-900">Pagamento em processamento</p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              O Mercado Pago ainda está confirmando. Assim que for aprovado, você receberá um
              e-mail com o link para criar sua conta.
            </p>
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 font-black text-white hover:bg-amber-700"
              type="button"
              onClick={() => {
                pollCount.current = 0;
                setPaymentStatus("pending");
              }}
            >
              <RotateCcw size={16} />
              Verificar novamente
            </button>
          </div>
        )}

        {paymentStatus === "paid" && (
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xl shadow-slate-900/10 sm:p-8">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-800">
              <CheckCircle2 size={13} />
              Pagamento confirmado · Plano {planName}
            </div>

            <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
              Crie sua conta e acesse o painel.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Use o mesmo e-mail do pagamento. Acesso liberado na hora.
            </p>

            {formError ? (
              <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-800">
                {formError}
              </div>
            ) : null}

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <Field
                autoComplete="name"
                icon={User}
                label="Nome completo"
                placeholder="Seu nome"
                value={name}
                onChange={setName}
              />

              <Field
                icon={Sparkles}
                label="Nicho ou área de atuação"
                list="niche-list"
                placeholder="Ex: Designer, Nutricionista, Eletricista"
                value={niche}
                onChange={setNiche}
              />
              <datalist id="niche-list">
                {proposalTemplateNiches.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>

              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                Segmento
                <span className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 transition focus-within:border-green-600 focus-within:bg-white focus-within:outline focus-within:outline-3 focus-within:outline-green-700/20">
                  <User className="shrink-0 text-slate-500" size={16} />
                  <select
                    className="min-h-10 flex-1 bg-transparent text-slate-900 outline-none"
                    required
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {businessSegments.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </span>
              </label>

              <Field
                autoComplete="email"
                icon={Mail}
                label="E-mail"
                placeholder="voce@email.com"
                type="email"
                value={email}
                onChange={setEmail}
              />

              <Field
                autoComplete="new-password"
                hint="Mínimo 8 caracteres"
                icon={Lock}
                label="Senha"
                placeholder="Crie sua senha"
                type="password"
                value={password}
                onChange={setPassword}
              />

              <Field
                autoComplete="new-password"
                icon={Lock}
                label="Confirmar senha"
                placeholder="Repita a senha"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />

              {turnstileSiteKey ? (
                <div
                  className="cf-turnstile"
                  data-sitekey={turnstileSiteKey}
                  data-callback="onFechaProTurnstile"
                  data-expired-callback="onFechaProTurnstileExpired"
                />
              ) : null}

              <button
                className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 font-black text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <RotateCcw className="animate-spin" size={18} />
                ) : (
                  <ArrowRight size={18} />
                )}
                {loading ? "Criando conta..." : "Criar conta e acessar o painel"}
              </button>
            </form>

            <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-400">
              <ShieldCheck size={14} />
              Acesso imediato após criar a conta
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({
  autoComplete,
  hint,
  icon: Icon,
  label,
  list,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  autoComplete?: string;
  hint?: string;
  icon: React.ElementType;
  label: string;
  list?: string;
  onChange: (v: string) => void;
  placeholder?: string;
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
        <input
          autoComplete={autoComplete}
          className="min-h-10 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
          list={list}
          placeholder={placeholder}
          required
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
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
