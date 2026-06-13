"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";

const reasons = [
  "Ainda estou testando",
  "Nao usei o suficiente",
  "Preciso de outro plano",
  "Tive problema tecnico",
  "Outro motivo",
];

export default function CancelamentoPage() {
  const [reason, setReason] = useState(reasons[0]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function cancelSubscription() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || "Nao foi possivel cancelar agora.");
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Nao foi possivel cancelar agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <section className="mx-auto grid max-w-2xl gap-5 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/10">
        <Link className="inline-flex items-center gap-2 text-sm font-black text-green-800" href="/?view=plans">
          <ArrowLeft size={16} />
          Voltar para planos
        </Link>

        {done ? (
          <div className="grid gap-3">
            <CheckCircle2 className="text-green-700" size={34} />
            <h1 className="text-3xl font-black">Assinatura cancelada</h1>
            <p className="leading-7 text-slate-600">
              Seu acesso pago foi marcado como cancelado. Voce pode escolher um novo plano quando quiser voltar a enviar propostas pelo FechaPro.
            </p>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-green-700 px-4 font-black text-white" href="/?view=plans">
              Ver planos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase text-green-800">Cancelamento</p>
                <h1 className="text-3xl font-black">Cancelar assinatura do FechaPro</h1>
                <p className="mt-2 leading-7 text-slate-600">
                  Ao cancelar, recursos pagos como propostas, PDF, aceite, rastreamento e pagamento no link podem ficar indisponiveis.
                </p>
              </div>
            </div>

            <label className="grid gap-2 text-sm font-black text-slate-700">
              Motivo do cancelamento
              <select className="min-h-12 rounded-lg border border-black/10 bg-white px-3 outline-green-700" value={reason} onChange={(event) => setReason(event.target.value)}>
                {reasons.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Link className="inline-flex min-h-12 items-center justify-center rounded-lg bg-green-700 px-4 font-black text-white" href="/?view=plans">
                Manter assinatura
              </Link>
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 font-black text-rose-700 disabled:opacity-60" disabled={loading} type="button" onClick={cancelSubscription}>
                <XCircle size={18} />
                {loading ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
