"use client";

import React, { useEffect, useState } from "react";
import { Send, FileDown, Sparkles, Settings } from "lucide-react";

export default function ProposalForm(props: any) {
  const {
    draft,
    services,
    clients,
    proposalTemplates,
    onDraftChange,
    onProposalSave,
    onSeed,
    onProposalPdf,
    onNotice,
    SectionHeading,
    SelectField,
    TextField,
    TextAreaField,
    quickIncludedSuggestions,
    quickExampleProposal,
  } = props;

  const [includedText, setIncludedText] = useState(() => draft.included.join("\n"));
  const [showAdvancedProposalOptions, setShowAdvancedProposalOptions] = useState(false);

  useEffect(() => {
    const nextIncludedText = draft.included.join("\n");
    setIncludedText((current: string) => (current === nextIncludedText ? current : nextIncludedText));
  }, [draft.included]);

  function chooseService(serviceName: string) {
    const service = services.find((item: any) => item.name === serviceName);
    if (!service) {
      onDraftChange("serviceName", serviceName);
      return;
    }
    onDraftChange("serviceName", service.name);
    onDraftChange("price", service.price);
    onDraftChange("deadline", service.deadline || "");
    onDraftChange("included", service.includes);
  }

  function selectedServiceNames() {
    return services
      .filter((service: any) => draft.serviceName.split(" + ").includes(service.name) || draft.serviceName === service.name)
      .map((service: any) => service.name);
  }

  function chooseMultipleServices(serviceNames: string[]) {
    const selectedServices = services.filter((service: any) => serviceNames.includes(service.name));
    if (!selectedServices.length) {
      onDraftChange("serviceName", "");
      onDraftChange("price", 0);
      onDraftChange("deadline", "");
      onDraftChange("included", []);
      return;
    }

    if (selectedServices.length === 1) {
      chooseService(selectedServices[0].name);
      return;
    }

    onDraftChange("serviceName", selectedServices.map((service: any) => service.name).join(" + "));
    onDraftChange("price", selectedServices.reduce((sum: number, service: any) => sum + service.price, 0));
    onDraftChange("deadline", "Conforme serviços selecionados");
    onDraftChange(
      "included",
      selectedServices.flatMap((service: any) => [
        `${service.name} - ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.price)}`,
        ...service.includes.map((item: string) => `${service.name}: ${item}`),
      ]),
    );
  }

  function addIncludedSuggestion(item: string) {
    const currentItems = draft.included.map((it: string) => it.trim()).filter(Boolean);
    if (currentItems.some((current: string) => current.toLowerCase() === item.toLowerCase())) return;
    onDraftChange("included", [...currentItems, item]);
  }

  function useQuickExample() {
    onDraftChange("templateId", quickExampleProposal.templateId);
    onDraftChange("clientName", quickExampleProposal.clientName);
    onDraftChange("clientEmail", quickExampleProposal.clientEmail);
    onDraftChange("serviceName", quickExampleProposal.serviceName);
    onDraftChange("price", quickExampleProposal.price);
    onDraftChange("deadline", quickExampleProposal.deadline);
    onDraftChange("validUntil", quickExampleProposal.validUntil);
    onDraftChange("payment", quickExampleProposal.payment);
    onDraftChange("documentType", quickExampleProposal.documentType);
    onDraftChange("segment", quickExampleProposal.segment);
    onDraftChange("checkoutMode", quickExampleProposal.checkoutMode);
    onDraftChange("included", quickExampleProposal.included);
    onDraftChange("notes", quickExampleProposal.notes);
    onNotice("Exemplo preenchido. Ajuste os dados e salve a proposta.");
    setTimeout(() => document.getElementById("proposal-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  return (
    <form
      id="proposal-form"
      className="grid gap-4 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/10"
      onSubmit={(event) => {
        event.preventDefault();
        onProposalSave();
      }}
    >
      <div className="grid gap-3">
        <SectionHeading eyebrow={draft.id ? "Editar proposta" : "Proposta rapida"} title={draft.id ? "Ajuste os dados da proposta" : "Crie sua proposta rápida"} />
        <div className="grid gap-2 rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold leading-6 text-green-900">
          <span className="font-black">Preencha cliente, serviço, valor, prazo e itens inclusos.</span>
          <span>Depois envie o link pelo WhatsApp ou baixe em PDF.</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Cliente" value={draft.clientName} placeholder="Selecione ou digite" required onChange={(v: string) => {
          onDraftChange("clientName", v);
          const client = clients.find((c: any) => c.name === v);
          if (client?.email) onDraftChange("clientEmail", client.email);
        }} options={clients.map((c: any) => c.name)} />
        <SelectField label="Serviço" value={draft.serviceName} placeholder="Selecione ou digite" required onChange={chooseService} options={services.map((s: any) => s.name)} />
        <TextField label="Valor" min={1} placeholder="1200" required step="1" type="number" value={draft.price || ""} onChange={(value: string) => onDraftChange("price", Number(value || 0))} />
        <TextField label="Prazo" maxLength={80} placeholder="7 dias úteis" required value={draft.deadline} onChange={(value: string) => onDraftChange("deadline", value)} />
      </div>

      <TextAreaField label="O que esta incluso" maxLength={1200} placeholder={"Ex:\nBriefing inicial\nExecucao do servico\nAjustes combinados\nEntrega final"} value={includedText} onChange={(value: string) => { setIncludedText(value); onDraftChange("included", value.split("\n")); }} />

      <div className="grid gap-2">
        <span className="text-xs font-black uppercase text-slate-500">Adicionar rapido</span>
        <div className="flex flex-wrap gap-2">
          {quickIncludedSuggestions.map((item: string) => (
            <button className="min-h-9 rounded-full border border-black/10 bg-slate-50 px-3 text-xs font-black text-slate-700" key={item} type="button" onClick={() => addIncludedSuggestion(item)}>
              + {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-black/10 bg-slate-50 px-4 text-sm font-black text-slate-800" type="button" onClick={() => setShowAdvancedProposalOptions((c) => !c)}>
          <Settings size={16} />
          {showAdvancedProposalOptions ? "Ocultar opcoes avancadas" : "Mostrar opcoes avancadas"}
        </button>
        <span className="text-xs font-bold text-slate-500">Template, validade, pagamento, e-mail, recebimento e visual.</span>
      </div>

      {showAdvancedProposalOptions ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Validade" type="date" value={draft.validUntil} onChange={(value: string) => onDraftChange("validUntil", value)} />
            <TextField label="Pagamento" maxLength={120} placeholder="50% entrada e 50% entrega" value={draft.payment} onChange={(value: string) => onDraftChange("payment", value)} />
          </div>

          {/* services list omitted when empty */}
          {services.length ? (
            <div className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Serviços cadastrados na proposta</h3>
                  <p className="text-xs font-bold leading-5 text-slate-500">Marque mais de um serviço para somar valores e montar os itens automaticamente.</p>
                </div>
                {selectedServiceNames().length > 1 ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">{selectedServiceNames().length} serviços</span>
                ) : null}
              </div>
              <div className="grid gap-2">
                {services.map((service: any) => {
                  const checked = selectedServiceNames().includes(service.name);
                  return (
                    <label className={`grid min-h-14 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3 text-sm font-bold text-slate-700 ${checked ? "border-green-600 bg-green-50 shadow-sm" : "border-black/10 bg-white"}`} key={service.id}>
                      <input className="h-4 w-4 shrink-0 accent-green-700" type="checkbox" checked={checked} onChange={(event) => {
                        const current = selectedServiceNames();
                        chooseMultipleServices(event.target.checked ? Array.from(new Set([...current, service.name])) : current.filter((name: string) => name !== service.name));
                      }} />
                      <span className="min-w-0">
                        <span className="block font-black leading-5 text-slate-900">{service.name}</span>
                        {service.includes.length ? <span className="mt-0.5 line-clamp-2 block text-xs leading-4 text-slate-500">{service.includes.slice(0, 3).join(", ")}</span> : null}
                      </span>
                      <span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(service.price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          <TextField label="E-mail do cliente" placeholder="cliente@email.com" type="email" autoComplete="email" value={draft.clientEmail ?? ""} onChange={(value: string) => onDraftChange("clientEmail", value)} />

          <TextAreaField label="Observações" maxLength={800} placeholder="A proposta inclui até 2 rodadas de ajustes." rows={3} value={draft.notes} onChange={(value: string) => onDraftChange("notes", value)} />
        </>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <button className="min-h-11 rounded-lg bg-green-600 px-4 font-black text-white" type="submit"><Send size={16} /> {draft.id ? "Atualizar proposta" : "Salvar proposta"}</button>
        <button className="min-h-11 rounded-lg border border-black/10 px-4 font-black" type="button" onClick={() => onProposalSave("draft")}>Salvar rascunho</button>
        <button className="min-h-11 rounded-lg border border-black/10 px-4 font-black" type="button" onClick={useQuickExample}><Sparkles size={16} /> Preencher exemplo</button>
      </div>
    </form>
  );
}
