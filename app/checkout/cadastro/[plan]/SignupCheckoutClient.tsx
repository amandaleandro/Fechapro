"use client";

import { useState } from "react";
import { CreditCard, Mail, RotateCcw } from "lucide-react";
import { plans, type PlanCode } from "@/lib/plans";
import { trackPixel } from "@/lib/meta-pixel";

export function SignupCheckoutClient({ plan }: { plan: PlanCode }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Informe seu e-mail para iniciar o pagamento.");
      return;
    }
    setLoading(true);
    trackPixel(
      "InitiateCheckout",
      {
        value: (plans[plan]?.priceCents ?? 0) / 100 || undefined,
        currency: "BRL",
        content_ids: [plan],
        content_name: plans[plan]?.name,
        content_type: "product",
      },
      { email: cleanEmail },
    );
    try {
      const response = await fetch("/api/billing/signup-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, plan }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string; url?: string } | null;
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Não foi possível abrir o pagamento.");
      }
      window.location.href = data.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível abrir o pagamento.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3">
      {error ? <p className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</p> : null}
      <label className="grid gap-2 text-sm font-extrabold text-slate-700">
        E-mail para a assinatura
        <span className="flex min-h-11 items-center gap-3 rounded-lg border border-black/10 bg-slate-50 px-4">
          <Mail className="shrink-0 text-slate-500" size={16} />
          <input
            autoComplete="email"
            className="min-h-10 flex-1 bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="voce@email.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </span>
      </label>
      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 font-black text-white shadow-lg shadow-green-700/20 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-65"
        disabled={loading}
        type="button"
        onClick={startCheckout}
      >
        {loading ? <RotateCcw size={18} /> : <CreditCard size={18} />}
        {loading ? "Abrindo Mercado Pago..." : "Pagar pelo Mercado Pago"}
      </button>
    </div>
  );
}
