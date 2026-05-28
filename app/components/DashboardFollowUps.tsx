"use client";

import React from "react";
import { Copy } from "lucide-react";

type ProposalShort = {
  id: string;
  clientName: string;
  serviceName: string;
  publicSlug?: string | null;
  updatedAt?: string;
  createdAt: string;
  status: string;
  validUntil?: string | null;
};

function daysSince(value?: string | null) {
  if (!value) return 0;
  const diff = Date.now() - new Date(value).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardFollowUps({ followUps, onNotice }: { followUps: ProposalShort[]; onNotice: (m: string | null) => void }) {
  if (!followUps.length) return null;
  return (
    <section className="grid gap-3 rounded-lg border border-amber-700/20 bg-amber-50 p-4 shadow-xl shadow-slate-900/10">
      <div className="">
        <p className="text-xs font-black uppercase text-amber-700">Follow-up</p>
        <h2 className="mt-1 text-lg font-black">Clientes quentes para retomar hoje</h2>
      </div>
      {followUps.map((proposal) => {
        const proposalUrl = proposal.publicSlug ? `${window.location.origin}/p/${proposal.publicSlug}` : "";
        const followUpMessages = [
          {
            label: "Enviar follow-up",
            text: `Oi, ${proposal.clientName}! Passando para saber se conseguiu olhar a proposta de ${proposal.serviceName}. Posso tirar alguma duvida? ${proposalUrl}`,
          },
          {
            label: "Chamar no WhatsApp",
            text: `Oi, ${proposal.clientName}! Vi que a proposta de ${proposal.serviceName} esta em aberto. Quer que eu explique algum ponto do escopo, prazo ou pagamento? ${proposalUrl}`,
          },
          {
            label: "Reforçar validade",
            text: `Oi, ${proposal.clientName}! Lembrando que a proposta de ${proposal.serviceName}${proposal.validUntil ? ` vale ate ${new Date(proposal.validUntil).toLocaleDateString("pt-BR")}` : " esta disponivel para aceite"}. Segue o link: ${proposalUrl}`,
          },
        ];
        return (
          <div className="grid gap-3 rounded-lg border border-amber-700/20 bg-white p-3 lg:grid-cols-[1fr_auto] lg:items-center" key={proposal.id}>
            <div>
              <strong>{proposal.clientName}</strong>
              <p className="text-sm font-bold leading-6 text-slate-600">Enviada ha {daysSince(proposal.updatedAt || proposal.createdAt)} dias - {proposal.status}.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {followUpMessages.map((message) => (
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 text-sm font-black text-white"
                  type="button"
                  key={message.label}
                  onClick={() => {
                    navigator.clipboard.writeText(message.text);
                    onNotice(`${message.label} copiado.`);
                  }}
                >
                  <Copy size={15} />
                  {message.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
