import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { PlanCheckoutClient } from "@/app/checkout/plano/[plan]/PlanCheckoutClient";
import { formatProposalLimit, type PlanCode, plans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { canUsePaidFeatures } from "@/lib/billing-access";

export default async function PlanCheckoutPage({ params }: { params: Promise<{ plan: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { plan: rawPlan } = await params;
  if (!isPlanCode(rawPlan)) notFound();
  const plan = plans[rawPlan];
  if (!plan.public) notFound();
  const oneTime = plan.billingMode === "one_time";
  const recurringPrice = plan.maintenancePrice || plan.price;
  const hasSetup = Boolean(plan.maintenancePrice);
  const subscription = await prisma.planSubscription.findUnique({ where: { userId: session.id } });
  const active = Boolean(subscription?.plan === plan.code && canUsePaidFeatures(subscription));

  return (
    <main className="min-h-screen bg-[var(--ui-bg)] px-4 py-4 text-slate-950 sm:px-6 sm:py-6">
      <section className="mx-auto grid w-full max-w-6xl gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-xl shadow-slate-900/10">
          <Link className="inline-flex min-h-11 items-center gap-3 rounded-lg px-2 font-black text-slate-900" href="/">
            <Image alt="FechaPro" className="h-8 w-32 object-contain" src="/brand/logofechapro.png" width={144} height={36} />
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-green-800">
              <ShieldCheck size={14} />
              Checkout seguro
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-blue-800">
              <CreditCard size={14} />
              Mercado Pago
            </span>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr] lg:items-start">
          <article className="overflow-hidden rounded-lg bg-white shadow-xl shadow-slate-900/10">
            <div className="h-2 bg-green-600" />
            <div className="grid gap-5 p-5 sm:p-7">
              <Link className="inline-flex w-fit items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-900" href="/">
                <ArrowLeft size={16} />
                Voltar para o painel
              </Link>
              <div>
                <p className="text-xs font-black uppercase text-blue-700">{oneTime ? "Plano FechaPro" : "Assinatura FechaPro"}</p>
                <h1 className="mt-2 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                  {oneTime ? `Confirme o plano ${plan.name} e libere seu painel.` : hasSetup ? `Confirme o plano ${plan.name}.` : `Confirme o plano ${plan.name} e libere seu painel.`}
                </h1>
                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                  {hasSetup
                    ? "A Estrutura Comercial Completa reúne sistema por 12 meses, mini site, implantação assistida, materiais comerciais, diagnóstico do Instagram, ajuste simples da logo e treinamento."
                    : "Revise o resumo antes de seguir para o Mercado Pago. Assim que o pagamento for confirmado, o FechaPro atualiza sua assinatura."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <CheckoutMetric label="Plano" value={plan.name} />
                <CheckoutMetric label={oneTime ? "Pagamento único" : hasSetup ? "Pagamento facilitado" : "Mensalidade recorrente"} value={recurringPrice} />
                <CheckoutMetric label="Limite" value={`${formatProposalLimit(plan.proposalLimit)}/mês`} />
              </div>

              <div className="rounded-lg border border-black/10 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-blue-700">Incluso no plano</p>
                <ul className="mt-3 grid gap-2 leading-7 text-slate-700">
                  {plan.features.map((feature) => (
                    <li className="grid grid-cols-[auto_1fr] gap-2 font-bold" key={feature}>
                      <CheckCircle2 className="mt-1 text-green-600" size={18} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {plan.serviceEntitlements?.length ? (
                <div className="rounded-lg border border-green-700/20 bg-green-50 p-4">
                  <p className="text-xs font-black uppercase text-green-700">Entregas da equipe</p>
                  <ul className="mt-3 grid gap-2 leading-7 text-green-900">
                    {plan.serviceEntitlements.map((item) => (
                      <li className="grid grid-cols-[auto_1fr] gap-2 font-bold" key={item}>
                        <CheckCircle2 className="mt-1 text-green-700" size={18} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid gap-3 rounded-lg border border-green-700/20 bg-green-50 p-4 sm:grid-cols-3">
                <TrustItem title="Pagamento externo" text="Cartao e Pix ficam no ambiente Mercado Pago." />
                <TrustItem title="Acesso ao plano" text="O plano muda para ativo após confirmação." />
                <TrustItem title="Controle no painel" text="Uso, limites e créditos aparecem em Planos." />
              </div>
            </div>
          </article>

          <aside className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/10 lg:sticky lg:top-6">
            <div>
              <p className="text-xs font-black uppercase text-blue-700">{oneTime ? "Pagamento único" : hasSetup ? "Pacote completo anual" : "Assinatura mensal"}</p>
              <strong className="mt-1 block text-3xl font-black sm:text-4xl">{recurringPrice}</strong>
              {hasSetup ? (
                <p className="mt-2 rounded-lg bg-[var(--ui-bg)] p-3 text-sm font-black text-slate-700">
                  Investimento anual: {plan.price}. Equivalente a menos de R$ 5 por dia.
                </p>
              ) : null}
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                {oneTime
                  ? "Pagamento único em ambiente seguro do Mercado Pago."
                  : hasSetup
                  ? "Este pacote foi pensado para você sair com uma estrutura pronta para vender melhor, não apenas com acesso ao sistema."
                  : "Assinatura mensal em ambiente seguro do Mercado Pago."}
              </p>
            </div>

            <div className="grid gap-2 rounded-lg border border-black/10 bg-slate-50 p-3 text-sm font-bold text-slate-700">
              <CheckoutLine label="Ambiente" value="Mercado Pago" />
              <CheckoutLine label="Cartão" value="Não armazenado" />
              <CheckoutLine label="Status" value={active ? "Plano ativo" : "Aguardando pagamento/liberação"} />
            </div>

            {active ? (
              <Link className="grid min-h-12 place-items-center rounded-lg border border-green-600 px-5 text-center font-black text-green-800" href="/">
                Plano atual
              </Link>
            ) : (
              <PlanCheckoutClient plan={plan.code} />
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

function isPlanCode(value: string): value is PlanCode {
  return value in plans;
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-black uppercase text-slate-500">{label}</span>
      <span className="text-right font-black">{value}</span>
    </div>
  );
}

function TrustItem({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-black text-green-900">{title}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-green-900/75">{text}</p>
    </div>
  );
}
