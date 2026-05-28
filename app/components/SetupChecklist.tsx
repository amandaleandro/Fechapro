"use client";

import React from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";

export default function SetupChecklist({ setupChecklist, setupProgress }: { setupChecklist: { done: boolean; label: string }[]; setupProgress: number }) {
  return (
    <section className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-blue-700">Configuração</p>
          <h2 className="mt-1 text-lg font-black">Sua estrutura comercial</h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">{setupProgress}/{setupChecklist.length} pronto</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {setupChecklist.map((item) => (
          <div className={`grid grid-cols-[auto_1fr] items-center gap-2 rounded-lg border p-3 text-sm font-black ${item.done ? "border-green-700/20 bg-green-50 text-green-800" : "border-black/10 bg-slate-50 text-slate-600"}`} key={item.label}>
            {item.done ? <CheckCircle2 size={16} /> : <HelpCircle size={16} />}
            {item.label}
          </div>
        ))}
      </div>
      <p className="text-sm font-bold leading-6 text-slate-500">Quanto mais completa sua estrutura, mais confiança sua proposta transmite ao cliente.</p>
    </section>
  );
}
