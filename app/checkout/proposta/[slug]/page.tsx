import { ArrowLeft, Copy, CreditCard, MessageCircle, QrCode, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { createPixPayload } from "@/lib/pix";
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
  const wantsPix = proposal.checkoutMode === "pix";
  const signal30 = Math.max(100, Math.round(proposal.price * 0.3));
  const signal50 = Math.max(100, Math.round(proposal.price * 0.5));
  const pixPayload = wantsPix && brand?.pixKey
    ? createPixPayload({
        amountCents: proposal.price,
        merchantName: brandName,
        pixKey: brand.pixKey,
        txid: proposal.publicSlug,
      })
    : null;
  const pixQrUrl = pixPayload ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixPayload)}` : null;

  return (
    <main className="min-h-screen bg-[var(--ui-bg)] px-4 py-4 text-slate-950 sm:px-6 sm:py-6">
      <section className="mx-auto grid w-full max-w-6xl gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-xl shadow-slate-900/10">
          <a className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-black text-slate-600 hover:text-slate-950" href={`/p/${proposal.publicSlug}`}>
            <ArrowLeft size={16} />
            Voltar para proposta
          </a>
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-green-800">
              <ShieldCheck size={14} />
              {wantsPix ? "PIX direto" : "Mercado Pago"}
            </span>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr] lg:items-start">
          <article className="overflow-hidden rounded-lg bg-white shadow-xl shadow-slate-900/10">
            <div className="h-2" style={{ background: brandColor }} />
            <div className="grid gap-5 p-5 sm:p-7">
              <div>
                <p className="text-xs font-black uppercase text-blue-700">Pagamento da proposta</p>
                <h1 className="mt-2 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                  Confirme o investimento antes de seguir.
                </h1>
                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                  {wantsPix
                    ? `Escaneie o QR Code ou copie o código PIX para pagar diretamente para ${brandName}.`
                    : "Escolha uma forma de pagamento no Mercado Pago para concluir em ambiente seguro."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <CheckoutMetric label="Cliente" value={proposal.clientName} />
                <CheckoutMetric label="Servico" value={proposal.serviceName} />
                <CheckoutMetric label="Valor total" value={money.format(proposal.price)} />
              </div>

              <div className="grid gap-3 rounded-lg border border-black/10 bg-slate-50 p-4">
                <CheckoutLine label="Empresa" value={brandName} />
                <CheckoutLine label="Prazo" value={proposal.deadline || "A combinar"} />
                <CheckoutLine label="Condicao combinada" value={proposal.payment || "A combinar"} />
                <CheckoutLine label="Status" value={paid ? "Pagamento confirmado" : "Aguardando pagamento"} />
              </div>

              <div className="grid gap-3 rounded-lg border border-green-700/20 bg-green-50 p-4 sm:grid-cols-3">
                {wantsPix ? (
                  <>
                    <TrustItem icon={QrCode} title="QR Code PIX" text="O pagamento vai direto para a chave configurada pelo profissional." />
                    <TrustItem icon={Copy} title="Copia e cola" text="Use o código PIX no app do banco quando preferir." />
                    <TrustItem icon={MessageCircle} title="Comprovante" text="Depois do pagamento, combine o envio do comprovante com o profissional." />
                  </>
                ) : (
                  <>
                    <TrustItem icon={ShieldCheck} title="Ambiente seguro" text="Dados de cartão não passam pelo FechaPro." />
                    <TrustItem icon={CreditCard} title="Pix, boleto ou cartão" text="Opções conforme disponibilidade do Mercado Pago." />
                    <TrustItem icon={MessageCircle} title="Fluxo comercial" text="A proposta continua aberta para aceite e contato." />
                  </>
                )}
              </div>
            </div>
          </article>

          <aside className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/10 lg:sticky lg:top-6">
            <div>
              <p className="text-xs font-black uppercase text-blue-700">{wantsPix ? "Pague com PIX" : "Escolha como pagar"}</p>
              <strong className="mt-1 block text-3xl font-black sm:text-4xl">{money.format(proposal.price)}</strong>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                {wantsPix ? `Use o PIX abaixo para pagar o valor da proposta diretamente para ${brandName}.` : "Selecione uma opção. O link será gerado na hora e a confirmação atualiza a proposta."}
              </p>
            </div>

            {!wantsPix ? (
              <div className="grid gap-2 rounded-lg border border-black/10 bg-slate-50 p-3">
                {["Pix", "Cartao", "Boleto"].map((item) => (
                  <div className="flex items-center justify-between gap-3 text-sm font-black" key={item}>
                    <span>{item}</span>
                    <span className="text-green-700">Disponível</span>
                  </div>
                ))}
              </div>
            ) : null}

            {paid ? (
              <a className="grid min-h-12 place-items-center rounded-lg px-5 text-center font-black text-white" href={`/p/${proposal.publicSlug}`} style={{ background: brandColor }}>
                Ver proposta
              </a>
            ) : (
              <div className="grid gap-2">
                {wantsPix && pixPayload && pixQrUrl ? (
                  <div className="grid gap-3 rounded-lg border border-green-700/20 bg-green-50 p-3">
                    <div className="grid justify-items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="QR Code PIX" className="size-44 rounded-lg border border-green-700/20 bg-white p-2" src={pixQrUrl} />
                      <p className="text-center text-sm font-black text-green-900">PIX direto para {brandName}</p>
                    </div>
                    <textarea className="min-h-24 resize-none rounded-lg border border-green-700/20 bg-white p-3 text-xs font-bold text-slate-700" readOnly value={pixPayload} />
                  </div>
                ) : wantsPix ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                    O profissional ainda não cadastrou uma chave PIX. Volte para a proposta e combine o pagamento pelo contato informado.
                  </div>
                ) : null}
                {!wantsPix ? (
                  <>
                    <PaymentForm amount={money.format(signal30)} brandColor={brandColor} mode="signal_30" slug={proposal.publicSlug} title="Pagar 30% para reservar" />
                    <PaymentForm amount={money.format(signal50)} brandColor={brandColor} mode="signal_50" slug={proposal.publicSlug} title="Pagar 50% de entrada" />
                    <PaymentForm amount={money.format(proposal.price)} brandColor={brandColor} mode="full" primary slug={proposal.publicSlug} title="Pagar valor total" />
                  </>
                ) : null}
              </div>
            )}
            <p className="text-center text-xs font-bold leading-5 text-slate-500">
              {wantsPix ? "O FechaPro apenas mostra a chave PIX configurada. A confirmação do pagamento deve ser combinada com o profissional." : "Finalização pelo Mercado Pago. O FechaPro não armazena dados de cartão."}
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

function PaymentForm({
  amount,
  brandColor,
  mode,
  primary = false,
  slug,
  title,
}: {
  amount: string;
  brandColor: string;
  mode: string;
  primary?: boolean;
  slug: string;
  title: string;
}) {
  return (
    <form action={`/api/public/proposals/${slug}/checkout`} method="post">
      <input name="paymentMode" type="hidden" value={mode} />
      <button
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-4 text-left font-black transition hover:brightness-95 ${
          primary ? "text-white" : "border border-black/10 bg-white text-slate-800"
        }`}
        style={primary ? { background: brandColor } : undefined}
        type="submit"
      >
        <span>{title}</span>
        <span className={primary ? "text-white/90" : "text-green-700"}>{amount}</span>
      </button>
    </form>
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

function TrustItem({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <div className="grid gap-2">
      <Icon className="text-green-700" size={20} />
      <p className="text-sm font-black text-green-900">{title}</p>
      <p className="text-sm font-bold leading-6 text-green-900/75">{text}</p>
    </div>
  );
}
