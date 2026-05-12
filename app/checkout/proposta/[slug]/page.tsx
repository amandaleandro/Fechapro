import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export default async function ProposalCheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    include: { user: { include: { brandProfile: true } } },
  });

  if (!proposal) notFound();

  const brand = proposal.user.brandProfile;
  const brandName = brand?.businessName || proposal.user.name;
  const brandColor = brand?.primaryColor || "#22C55E";
  const paid = proposal.paymentStatus === "paid";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 text-slate-950 sm:px-6 sm:py-8">
      <section className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_0.75fr] lg:items-start">
        <article className="overflow-hidden rounded-lg bg-white shadow-xl shadow-slate-900/10">
          <div className="h-2" style={{ background: brandColor }} />
          <div className="grid gap-5 p-5 sm:p-7">
            <a className="text-sm font-black text-slate-500" href={`/p/${proposal.publicSlug}`}>
              Voltar para proposta
            </a>
            <div>
              <p className="text-xs font-black uppercase text-blue-700">Checkout seguro</p>
              <h1 className="mt-2 max-w-2xl text-4xl font-black leading-tight">
                Revise o pagamento antes de continuar.
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Voce sera direcionado para o ambiente seguro do Asaas para finalizar por Pix, boleto ou cartao, conforme disponibilidade.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <CheckoutMetric label="Cliente" value={proposal.clientName} />
              <CheckoutMetric label="Servico" value={proposal.serviceName} />
              <CheckoutMetric label="Valor" value={money.format(proposal.price)} />
            </div>

            <div className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-4">
              <CheckoutLine label="Empresa" value={brandName} />
              <CheckoutLine label="Prazo" value={proposal.deadline || "A combinar"} />
              <CheckoutLine label="Condicao combinada" value={proposal.payment || "A combinar"} />
              <CheckoutLine label="Status" value={paid ? "Pagamento confirmado" : "Aguardando pagamento"} />
            </div>
          </div>
        </article>

        <aside className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/10 lg:sticky lg:top-6">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">Total</p>
            <strong className="mt-1 block text-4xl font-black">{money.format(proposal.price)}</strong>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              O link de pagamento sera gerado pelo Asaas e a proposta sera atualizada automaticamente quando o webhook confirmar.
            </p>
          </div>

          <div className="grid gap-2">
            {["Pix", "Cartao", "Boleto"].map((item) => (
              <div className="flex items-center justify-between rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-sm font-black" key={item}>
                <span>{item}</span>
                <span className="text-green-700">Disponivel</span>
              </div>
            ))}
          </div>

          {paid ? (
            <a className="grid min-h-12 place-items-center rounded-lg px-5 text-center font-black text-white" href={`/p/${proposal.publicSlug}`} style={{ background: brandColor }}>
              Ver proposta
            </a>
          ) : (
            <form action={`/api/public/proposals/${proposal.publicSlug}/checkout`} method="post">
              <button className="min-h-12 w-full rounded-lg px-5 font-black text-white" style={{ background: brandColor }} type="submit">
                Continuar para pagamento
              </button>
            </form>
          )}
          <p className="text-center text-xs font-bold leading-5 text-slate-500">
            O FechaPro nao armazena dados de cartao. A finalizacao acontece no Asaas.
          </p>
        </aside>
      </section>
    </main>
  );
}

function CheckoutMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <strong className="mt-1 block leading-6">{value}</strong>
    </div>
  );
}

function CheckoutLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-bold leading-6 text-slate-700">{value}</p>
    </div>
  );
}
