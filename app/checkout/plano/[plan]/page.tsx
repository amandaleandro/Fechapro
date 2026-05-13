import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PlanCheckoutClient } from "@/app/checkout/plano/[plan]/PlanCheckoutClient";
import { getSession } from "@/lib/session";
import { type PlanCode, plans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export default async function PlanCheckoutPage({ params }: { params: Promise<{ plan: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { plan: rawPlan } = await params;
  if (!isPlanCode(rawPlan)) notFound();
  const plan = plans[rawPlan];
  const subscription = await prisma.planSubscription.findUnique({ where: { userId: session.id } });
  const active = subscription?.plan === plan.code && subscription.status === "active" && subscription.provider === "asaas";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 text-slate-950 sm:px-6 sm:py-8">
      <section className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_0.75fr] lg:items-start">
        <article className="overflow-hidden rounded-lg bg-white shadow-xl shadow-slate-900/10">
          <div className="h-2 bg-green-600" />
          <div className="grid gap-5 p-5 sm:p-7">
            <Link className="text-sm font-black text-slate-500" href="/">
              Voltar para o painel
            </Link>
            <div>
              <p className="text-xs font-black uppercase text-blue-700">Checkout de assinatura</p>
              <h1 className="mt-2 max-w-2xl text-4xl font-black leading-tight">
                Confirme o plano {plan.name}.
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Revise os benefícios antes de abrir o pagamento no Asaas. A assinatura fica ativa quando o webhook confirmar a cobrança.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <CheckoutMetric label="Plano" value={plan.name} />
              <CheckoutMetric label={plan.maintenancePrice ? "Implantação" : "Valor mensal"} value={plan.price} />
              <CheckoutMetric label="Limite" value={`${plan.proposalLimit} propostas/mês`} />
            </div>

            <div className="rounded-lg border border-black/10 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase text-blue-700">Incluso no plano</p>
              <ul className="mt-3 grid gap-2 leading-7 text-slate-700">
                {plan.features.map((feature) => (
                  <li className="grid grid-cols-[auto_1fr] gap-2 font-bold" key={feature}>
                    <span className="mt-2 size-2 rounded-full bg-green-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <aside className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/10 lg:sticky lg:top-6">
          <div>
            <p className="text-xs font-black uppercase text-blue-700">{plan.maintenancePrice ? "Implantação" : "Total mensal"}</p>
            <strong className="mt-1 block text-4xl font-black">{plan.price}</strong>
            {plan.maintenancePrice ? (
              <p className="mt-2 rounded-lg bg-slate-100 p-3 text-sm font-black text-slate-700">
                {plan.maintenancePrice} para manutenção do site e acesso ao FechaPro.
              </p>
            ) : null}
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              {plan.maintenancePrice
                ? "Este checkout cobra a implantação inicial. A manutenção mensal é cobrada depois em valor reduzido."
                : "Cobrança recorrente mensal por link seguro do Asaas."}
            </p>
          </div>

          {active ? (
            <Link className="grid min-h-12 place-items-center rounded-lg border border-green-600 px-5 text-center font-black text-green-800" href="/">
              Plano atual
            </Link>
          ) : (
            <PlanCheckoutClient plan={plan.code} />
          )}
        </aside>
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
