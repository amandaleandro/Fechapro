"use client";

import React from "react";
import { FileDown } from "lucide-react";

export default function ProposalPreview({
  brand,
  draft,
  portfolio,
  testimonials,
  SectionHeading,
  PreviewItem,
  onProposalPdf,
}: any) {
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function initials(value: string) {
    const words = value.trim().split(/\s+/).slice(0, 2);
    return words.map((word) => word[0]?.toUpperCase()).join("") || "FP";
  }

  const previewIncludedItems = (draft.included || []).length ? draft.included : ["Itens da proposta aparecem aqui."];

  const items = portfolio.length ? portfolio.slice(0, 3) : [
    { id: "1", title: "Portfólio", category: "Trabalhos", imageUrl: "" },
    { id: "2", title: "Depoimentos", category: "Prova social", imageUrl: "" },
    { id: "3", title: "Diferenciais", category: "Valor", imageUrl: "" },
  ];

  return (
    <aside id="proposal-preview" className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10 lg:sticky lg:top-32">
      <SectionHeading eyebrow="Veja como seu cliente vai receber" title={draft.clientName ? `Proposta para ${draft.clientName}` : "Prévia da proposta profissional"} />

      <div className="grid gap-4 overflow-hidden rounded-lg border border-black/10 bg-slate-50">
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${brand.primaryColor}, ${brand.accentColor})` }} />
        <div className="grid gap-4 p-4">
          <div className="flex items-center gap-3">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="h-12 w-12 rounded-lg object-cover" src={brand.logoUrl} />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-lg font-black text-white" style={{ background: brand.primaryColor }}>
                {initials(brand.businessName)}
              </div>
            )}
            <div>
              <strong>{brand.businessName}</strong>
              <span className="block text-sm font-bold text-slate-500">Proposta comercial</span>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <PreviewItem label="Serviço" value={draft.serviceName || "Preencha os dados"} />
            <PreviewItem label="Investimento" value={money.format(draft.price)} />
            <PreviewItem label="Prazo" value={draft.deadline || "-"} />
            <PreviewItem label="Pagamento" value={draft.payment || "A combinar"} />
            <PreviewItem label="Recebimento" value={(draft.checkoutMode || "mercadopago") === "pix" ? "PIX direto" : "Mercado Pago"} />
          </dl>

          <div>
            <h3 className="font-black">Inclui</h3>
            <ul className="mt-2 list-disc pl-5 text-slate-600">
              {previewIncludedItems.map((item: string, index: number) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {items.map((item: any, index: number) => (
              <div key={item.id} className="grid min-h-20 place-items-end rounded-lg p-3 text-sm font-black text-white" style={{ background: index === 0 ? "linear-gradient(135deg, #0F172A, #2563EB)" : index === 1 ? "linear-gradient(135deg, #22C55E, #86EFAC)" : "linear-gradient(135deg, #334155, #94A3B8)" }}>{item.title}</div>
            ))}
          </div>

          <blockquote className="border-l-4 pl-3 leading-7 text-slate-600" style={{ borderColor: brand.accentColor }}>
            "{testimonials[0]?.quote || "Excelente entrega, muito profissional e antes do prazo."}"
            <cite className="mt-1 block font-black not-italic text-slate-900">{testimonials[0]?.authorName || "Cliente verificado"}</cite>
          </blockquote>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/10 px-4 font-black" style={{ color: brand.secondaryColor }} type="button" onClick={() => onProposalPdf()}>
              <FileDown size={18} />
              Gerar PDF
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
