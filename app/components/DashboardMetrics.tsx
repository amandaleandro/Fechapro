"use client";

import React from "react";

type Props = {
  totalViews: number;
  whatsappClicks: number;
  sent: number;
  accepted: number;
  sentValue: number;
  openValue: number;
  acceptanceRate: number;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function DashboardMetrics({ totalViews, whatsappClicks, sent, accepted, sentValue, openValue, acceptanceRate }: Props) {
  return (
    <>
      <section className="grid gap-3 sm:grid-cols-4">
        <div className="">
          <div className="">
            <strong className="font-black">Clientes que abriram proposta</strong>
          </div>
          <div className="text-slate-700">{String(totalViews)}</div>
        </div>
        <div>
          <strong className="font-black">Cliques no WhatsApp</strong>
          <div className="text-slate-700">{String(whatsappClicks)}</div>
        </div>
        <div>
          <strong className="font-black">Propostas enviadas</strong>
          <div className="text-slate-700">{String(sent)}</div>
        </div>
        <div>
          <strong className="font-black">Propostas aceitas</strong>
          <div className="text-slate-700">{String(accepted)}</div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div>
          <strong className="font-black">Valor total enviado</strong>
          <div className="text-slate-700">{money.format(sentValue)}</div>
        </div>
        <div>
          <strong className="font-black">Valor aguardando resposta</strong>
          <div className="text-slate-700">{money.format(openValue)}</div>
        </div>
        <div>
          <strong className="font-black">Taxa de aceite</strong>
          <div className="text-slate-700">{acceptanceRate}%</div>
        </div>
      </section>
    </>
  );
}
