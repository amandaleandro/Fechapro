import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
import { SignupCheckoutClient } from "@/app/checkout/cadastro/[plan]/SignupCheckoutClient";
import { plans, type PlanCode } from "@/lib/plans";

export default async function SignupCheckoutPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan: rawPlan } = await params;
  if (!isPlanCode(rawPlan)) notFound();
  const plan = plans[rawPlan];
  const recurringPrice = plan.maintenancePrice || plan.price;
  const hasSetup = Boolean(plan.maintenancePrice);

  return (
    <main className="min-h-screen bg-[var(--ui-bg)] px-4 py-4 text-slate-950 sm:px-6 sm:py-6">
      <section className="mx-auto grid w-full max-w-6xl gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 bg-white p-3 shadow-xl shadow-slate-900/10">
          <Link className="inline-flex min-h-11 items-center gap-3 rounded-lg px-2 font-black text-slate-900" href="/#planos">
            <span className="grid h-10 w-36 place-items-center rounded-lg bg-slate-950 px-3">
              <Image alt="FechaPro" className="h-7 w-full object-contain" src="/brand/logofechapro.png" width={144} height={36} />
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-green-800">
              <ShieldCheck size={14} />
              Acesso apos pagamento
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
              <Link className="inline-flex w-fit items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-900" href="/#planos">
                <ArrowLeft size={16} />
                Voltar aos planos
              </Link>
              <div>
                <p className="text-xs font-black uppercase text-blue-700">Primeiro pagamento</p>
                <h1 className="mt-2 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                  {hasSetup ? `Confirme a continuidade do plano ${plan.name}.` : `Pague o plano ${plan.name} para liberar seu cadastro.`}
                </h1>
                <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                  {hasSetup
                    ? "A implantacao e combinada com a equipe para deixar tudo pronto. Pelo Mercado Pago, voce autoriza a mensalidade de continuidade e acesso ao FechaPro."
                    : "Depois da confirmacao pelo Mercado Pago, voce volta para criar nome, e-mail e senha. Sem pagamento confirmado, o painel fica bloqueado."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <CheckoutMetric label="Plano" value={plan.name} />
                <CheckoutMetric label={hasSetup ? "Continuidade" : "Mensalidade recorrente"} value={recurringPrice} />
                <CheckoutMetric label="Limite" value={`${plan.proposalLimit} propostas/mes`} />
              </div>

              <div className="rounded-lg border border-black/10 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-blue-700">O que acontece depois</p>
                <ul className="mt-3 grid gap-2 leading-7 text-slate-700">
                  {(hasSetup
                    ? ["Implantacao alinhada com a equipe", "Mensalidade autorizada pelo Mercado Pago", "Conta criada ja com assinatura ativa"]
                    : ["Pagamento confirmado pelo Mercado Pago", "Cadastro liberado com o plano escolhido", "Conta criada ja com assinatura ativa"]
                  ).map((item) => (
                    <li className="grid grid-cols-[auto_1fr] gap-2 font-bold" key={item}>
                      <CheckCircle2 className="mt-1 text-green-600" size={18} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <aside className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/10 lg:sticky lg:top-6">
            <div>
              <p className="text-xs font-black uppercase text-blue-700">{hasSetup ? "Continuidade mensal" : "Assinatura mensal"}</p>
              <strong className="mt-1 block text-3xl font-black sm:text-4xl">{recurringPrice}</strong>
              {hasSetup ? <p className="mt-2 rounded-lg bg-[var(--ui-bg)] p-3 text-sm font-black text-slate-700">Implantacao completa: {plan.price}.</p> : null}
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                {hasSetup
                  ? "Este passo autoriza a mensalidade para manter o acesso depois da configuracao inicial."
                  : "O cadastro so sera liberado apos a autorizacao da assinatura recorrente."}
              </p>
            </div>
            <SignupCheckoutClient plan={plan.code} />
            <p className="text-center text-xs font-bold leading-5 text-slate-500">
              Finalizacao pelo Mercado Pago. O FechaPro nao armazena dados de cartao.
            </p>
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
