"use client";

import { useState } from "react";
import { CheckCircle2, LockKeyhole, RotateCcw } from "lucide-react";
import { type PlanCode } from "@/lib/plans";

export function PlanCheckoutClient({ plan }: { plan: PlanCode }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function continuePayment() {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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
      {error ? (
        <p className="rounded-lg border border-rose-700/20 bg-rose-50 p-3 text-sm font-bold text-rose-800">
          {error}
        </p>
      ) : null}
      <button
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 font-black text-white shadow-lg shadow-green-700/20 transition hover:bg-green-700 focus-visible:outline focus-visible:outline-3 focus-visible:outline-green-700/25 disabled:cursor-not-allowed disabled:opacity-65"
        disabled={loading}
        type="button"
        onClick={continuePayment}
      >
        {loading ? <RotateCcw size={18} /> : <LockKeyhole size={18} />}
        {loading ? "Abrindo Mercado Pago..." : "Pagar pelo Mercado Pago"}
      </button>
      <div className="grid gap-2 text-sm font-bold leading-6 text-slate-600">
        {["Pagamento protegido pelo Mercado Pago", "Plano ativado após confirmação", "Sem armazenamento de cartão no FechaPro"].map((item) => (
          <span className="inline-flex items-center gap-2" key={item}>
            <CheckCircle2 className="text-green-600" size={16} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
