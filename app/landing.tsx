"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileCheck2,
  Images,
  Send,
  ShieldCheck,
  UserRound,
  Wrench,
  XCircle,
} from "lucide-react";
import { trackConversion } from "@/lib/conversion-client";
import { trackPixel } from "@/lib/meta-pixel";
import type { PlanCode } from "@/lib/plans";

type LandingPlan = {
  code: PlanCode;
  name: string;
  price: string;
  installment: string;
  description: string;
  cta: string;
  href: string;
  featured?: boolean;
  items: string[];
};

const plans: LandingPlan[] = [
  {
    code: "founder_start",
    name: "Plano Inicial",
    price: "R$ 397",
    installment: "ou 12x de R$ 39,90",
    description: "Para quem quer começar a mandar propostas profissionais.",
    cta: "Começar agora",
    href: "/checkout/cadastro/founder_start",
    items: [
      "Propostas com link",
      "PDF automático",
      "Aceite online",
      "Cadastro de serviços",
      "Personalização com sua marca",
    ],
  },
  {
    code: "founder_professional",
    name: "Plano Profissional",
    price: "R$ 997",
    installment: "ou 12x de R$ 99,70",
    description: "Para quem quer começar vendendo melhor com uma estrutura mais completa.",
    cta: "Quero minha estrutura pronta",
    href: "/checkout/cadastro/founder_professional",
    featured: true,
    items: [
      "Tudo do Inicial",
      "Portfólio/fotos",
      "Depoimentos",
      "Modelos prontos",
      "Ajuda para configurar primeiras propostas",
      "Página comercial simples",
    ],
  },
  {
    code: "founder",
    name: "Plano Completo",
    price: "R$ 1.997",
    installment: "ou 12x de R$ 199,70",
    description: "Para quem quer sair com tudo pronto.",
    cta: "Quero vender melhor",
    href: "/checkout/cadastro/founder",
    items: [
      "Tudo do Profissional",
      "Configuração feita com você",
      "Propostas iniciais criadas",
      "Copy de venda",
      "Materiais para divulgar",
      "Suporte mais próximo",
    ],
  },
];

const proposalItems = [
  { title: "Dados da empresa", icon: Building2 },
  { title: "Dados do cliente", icon: UserRound },
  { title: "Serviço e valor", icon: Wrench },
  { title: "Fotos do serviço", icon: Images },
  { title: "Garantia e condições", icon: ShieldCheck },
  { title: "Aceite online e PDF", icon: FileCheck2 },
];

const niches = [
  "Ar-condicionado",
  "Elétrica",
  "Manutenção",
  "Câmeras de segurança",
  "Energia solar",
  "Vidraçaria",
  "Marcenaria",
  "Reformas",
  "Pintura",
  "Estética automotiva",
  "Assistência técnica",
  "Serviços residenciais",
];

const commonQuestions = [
  [
    "Preciso saber mexer com tecnologia?",
    "Não. A ideia é deixar simples para você montar e enviar suas propostas pelo WhatsApp.",
  ],
  ["É mensalidade?", "Não. Você paga uma vez e usa sem mensalidade."],
  [
    "Serve para meu tipo de serviço?",
    "Se você vende pelo WhatsApp e precisa passar orçamento, serve.",
  ],
  [
    "Eu recebo pronto?",
    "No plano Completo, sim. No Profissional, você recebe ajuda para configurar.",
  ],
];

function trackPlanClick(plan: LandingPlan) {
  trackConversion({
    event: "primary_cta_clicked",
    plan: plan.code,
    campaign: "landing_servicos_whatsapp",
    source: "landing",
    context: "plan_card",
    metadata: { planName: plan.name, price: plan.price },
  });
  trackPixel("AddToCart", {
    value: Number(plan.price.replace(/[^\d]/g, "")) || undefined,
    currency: "BRL",
    content_ids: [plan.code],
    content_name: plan.name,
    content_type: "product",
  });
}

function ProposalMockup() {
  return (
    <article className="mx-auto w-full max-w-md rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-950/10 sm:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-4">
        <div>
          <p className="text-xs font-black uppercase text-green-700">Proposta profissional</p>
          <h2 className="mt-1 text-xl font-black leading-tight text-slate-950">
            Proposta de instalação de ar-condicionado
          </h2>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-green-50 text-green-700">
          <Wrench size={22} />
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        {[
          ["Cliente", "João Pereira"],
          ["Serviço", "Instalação split 12.000 BTUs"],
          ["Inclui", "instalação, suporte, garantia e materiais básicos"],
        ].map(([label, value]) => (
          <div className="rounded-lg bg-slate-50 p-3" key={label}>
            <dt className="text-xs font-black uppercase text-slate-500">{label}</dt>
            <dd className="mt-1 font-bold leading-5 text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Antes", "Instalação", "Teste final"].map((label) => (
          <div className="grid aspect-[4/3] place-items-center rounded-lg bg-green-50 text-center text-xs font-black text-green-800" key={label}>
            {label}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-slate-950 p-4 text-white">
        <p className="text-xs font-black uppercase text-white/55">Valor</p>
        <strong className="mt-1 block text-3xl">R$ 850</strong>
        <p className="mt-1 text-xs font-bold text-white/55">Garantia e condições explicadas no link</p>
      </div>

      <button className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 font-black text-white" type="button">
        <Send size={18} />
        Aceitar proposta no WhatsApp
      </button>
    </article>
  );
}

export function LandingMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg bg-white/12 p-3 text-center">
      <strong className="block text-lg font-black">{value}</strong>
      <span className="text-xs font-bold text-white/70">{label}</span>
    </article>
  );
}

export function AuthScreen() {
  useEffect(() => {
    trackConversion({
      event: "landing_viewed",
      campaign: "landing_servicos_whatsapp",
      source: "landing",
      context: "auth_screen",
    });
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FechaPro",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://fechapro.com.br",
    description:
      "Plataforma para prestadores de serviço criarem propostas profissionais com link, PDF, aceite online e envio pelo WhatsApp.",
    offers: plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.replace("R$ ", "").replace(".", ""),
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="fp-landing min-h-screen bg-[#faf8f3] text-[#111827]">
        <header className="sticky top-0 z-40 border-b border-black/10 bg-[#faf8f3]/92 px-4 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 py-3">
            <a href="#top" className="shrink-0">
              <Image
                alt="FechaPro"
                src="/brand/logofechapro.png"
                width={130}
                height={36}
                className="h-8 w-auto"
                priority
              />
            </a>
            <nav className="hidden items-center gap-6 text-sm font-bold text-slate-700 md:flex">
              <a href="#dor">Problema</a>
              <a href="#como-funciona">Como funciona</a>
              <a href="#planos">Planos</a>
            </nav>
            <div className="flex items-center gap-2">
              <a className="inline-flex rounded-lg px-3 py-2 text-sm font-black text-slate-700 sm:px-4" href="/login">
                Entrar
              </a>
              <a className="rounded-lg bg-green-700 px-4 py-2 text-sm font-black text-white" href="#planos">
                Criar proposta
              </a>
            </div>
          </div>
        </header>

        <section id="top" className="px-4 py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
                Pare de mandar só preço no WhatsApp.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                Transforme seu orçamento em uma proposta profissional com fotos, garantia, pagamento e aceite online, para parar de perder cliente que só compara preço.
              </p>
              <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-slate-800">
                Mostre valor antes do preço e aumente suas chances de fechar pelo WhatsApp.
              </p>
              <div className="mt-5 inline-flex rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 text-sm font-black leading-6 text-green-900">
                Feito para quem vende serviço de R$300 a R$10.000 pelo WhatsApp.
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-green-700 px-6 text-base font-black text-white hover:bg-green-800"
                  href="#planos"
                  onClick={() =>
                    trackConversion({
                      event: "primary_cta_clicked",
                      campaign: "landing_servicos_whatsapp",
                      source: "landing",
                      context: "hero_primary",
                    })
                  }
                >
                  Quero criar minha proposta
                </a>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-black/10 bg-white px-6 text-base font-black text-slate-800 hover:bg-slate-50"
                  href="#exemplo"
                >
                  Ver exemplo
                </a>
              </div>
              <p className="mt-5 text-sm font-black text-green-800">Pague uma vez. Use sem mensalidade.</p>
            </div>
            <div id="exemplo">
              <ProposalMockup />
            </div>
          </div>
        </section>

        <section id="dor" className="bg-white px-4 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <h2 className="text-3xl font-black leading-tight sm:text-5xl">
              O cliente pede orçamento, você manda o valor e ele some?
            </h2>
            <div className="grid gap-4 text-lg leading-8 text-slate-700">
              <p className="rounded-lg bg-green-50 p-4 text-xl font-black leading-8 text-green-900">
                Seu cliente não está sumindo porque achou caro. Ele está sumindo porque não entendeu o valor.
              </p>
              <p>
                Isso acontece porque, quando você envia só o preço, o cliente não entende tudo que está incluso no seu serviço.
              </p>
              <p>Ele compara você com qualquer outro orçamento mais barato.</p>
              <p className="font-bold text-slate-900">
                Com o FechaPro, você mostra o serviço completo, passa mais confiança e ajuda o cliente a decidir com mais segurança.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Seu orçamento precisa vender o serviço, não só mostrar o preço.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <article className="rounded-lg border border-rose-700/15 bg-white p-6">
                <div className="flex items-center gap-3">
                  <XCircle className="text-rose-700" size={26} />
                  <h3 className="text-2xl font-black">Antes: orçamento comum no WhatsApp</h3>
                </div>
                <ul className="mt-6 grid gap-3">
                  {["Mensagem solta", "Cliente vê só o preço", "Parece informal", "Difícil explicar garantia", "Cliente some"].map((item) => (
                    <li className="flex gap-2 font-bold text-slate-700" key={item}>
                      <XCircle className="mt-0.5 shrink-0 text-rose-700" size={17} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-lg border border-green-700/20 bg-green-50 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-green-700" size={26} />
                  <h3 className="text-2xl font-black">Depois: proposta com FechaPro</h3>
                </div>
                <ul className="mt-6 grid gap-3">
                  {["Link profissional", "Serviço bem explicado", "Fotos e portfólio", "Garantia e condições", "Aceite online"].map((item) => (
                    <li className="flex gap-2 font-bold text-slate-800" key={item}>
                      <CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={17} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="bg-[#111827] px-4 py-16 text-white">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-black leading-tight sm:text-5xl">Como funciona</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {[
                ["Cadastre sua marca", "Coloque logo, nome e dados da empresa."],
                ["Monte seus serviços", "Adicione descrição, valores, fotos e condições."],
                ["Envie o link da proposta", "O cliente recebe tudo organizado pelo WhatsApp."],
                ["Receba o aceite", "O cliente pode aceitar a proposta direto pelo link."],
              ].map(([title, text], index) => (
                <article className="rounded-lg border border-white/10 bg-white/5 p-5" key={title}>
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-green-500 text-sm font-black text-slate-950">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/65">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Tudo que o cliente precisa para confiar antes de fechar.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {proposalItems.map(({ title, icon: Icon }) => (
                <article className="rounded-lg border border-black/10 bg-slate-50 p-5" key={title}>
                  <Icon className="text-green-700" size={25} />
                  <h3 className="mt-4 text-lg font-black">{title}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-black leading-tight sm:text-5xl">
              Feito para quem vende serviço pelo WhatsApp
            </h2>
            <div className="mt-8 flex flex-wrap gap-2">
              {niches.map((niche) => (
                <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black text-slate-700" key={niche}>
                  {niche}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="bg-white px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase text-green-700">Planos</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                Escolha como quer começar.
              </h2>
              <p className="mt-4 rounded-lg bg-green-50 p-4 text-xl font-black leading-8 text-green-900">
                Se uma proposta melhor te ajudar a fechar apenas 1 serviço a mais, o FechaPro já se paga.
              </p>
              <p className="mt-4 text-lg font-bold leading-8 text-slate-700">
                Pagamento único, sem mensalidade. Você compra o acesso e começa a enviar propostas profissionais.
              </p>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  className={`relative flex flex-col rounded-lg border p-6 ${
                    plan.featured
                      ? "border-green-700 bg-slate-950 text-white shadow-xl"
                      : "border-black/10 bg-white"
                  }`}
                  key={plan.code}
                >
                  {plan.featured ? (
                    <span className="absolute right-5 top-5 rounded-full bg-green-500 px-3 py-1 text-xs font-black text-slate-950">
                      Melhor custo-benefício
                    </span>
                  ) : null}
                  <h3 className="pr-28 text-2xl font-black">{plan.name}</h3>
                  <p className={`mt-3 text-sm font-bold leading-6 ${plan.featured ? "text-white/65" : "text-slate-600"}`}>
                    {plan.description}
                  </p>
                  <div className="mt-6">
                    <strong className="block text-4xl font-black">{plan.price}</strong>
                    <span className={`mt-1 block text-sm font-bold ${plan.featured ? "text-white/55" : "text-slate-500"}`}>
                      {plan.installment}
                    </span>
                    <span
                      className={`mt-4 inline-flex rounded-lg px-3 py-2 text-sm font-black ${
                        plan.featured ? "bg-white/10 text-green-200" : "bg-green-50 text-green-800"
                      }`}
                    >
                      Pagamento único, sem mensalidade
                    </span>
                  </div>
                  <ul className="mt-6 grid flex-1 gap-3">
                    {plan.items.map((item) => (
                      <li className="flex gap-2 text-sm font-bold" key={item}>
                        <CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={16} />
                        <span className={plan.featured ? "text-white/85" : "text-slate-700"}>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    className={`mt-7 inline-flex min-h-12 items-center justify-center rounded-lg px-4 text-center font-black ${
                      plan.featured
                        ? "bg-green-500 text-slate-950 hover:bg-green-400"
                        : "bg-green-700 text-white hover:bg-green-800"
                    }`}
                    href={plan.href}
                    onClick={() => trackPlanClick(plan)}
                  >
                    {plan.cta}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <p className="text-xs font-black uppercase text-green-700">Dúvidas comuns</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                O que normalmente trava a decisão.
              </h2>
            </div>
            <div className="grid gap-3">
              {commonQuestions.map(([question, answer]) => (
                <article className="rounded-lg border border-black/10 bg-white p-5" key={question}>
                  <h3 className="font-black text-slate-950">{question}</h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-green-900 px-4 py-16 text-center text-white">
          <div className="mx-auto max-w-3xl">
            <BadgeCheck className="mx-auto text-green-200" size={34} />
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
              Pare de ser comparado só pelo preço.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/75">
              Envie uma proposta que mostra serviço, valor, fotos, garantia e aceite online em um único link.
            </p>
            <a className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-8 font-black text-green-900" href="#planos">
              Quero criar minha proposta
            </a>
          </div>
        </section>

        <footer className="flex flex-col gap-4 bg-[#111827] px-4 py-8 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <Image
            alt="FechaPro"
            src="/brand/logofechapro.png"
            width={110}
            height={30}
            className="h-7 w-auto brightness-0 invert"
          />
          <div className="flex flex-wrap gap-5">
            <a href="/privacidade">Política de Privacidade</a>
            <a href="/termos">Termos de Uso</a>
            <a href="/interesse">Suporte</a>
          </div>
          <span>© 2026 FechaPro. Todos os direitos reservados.</span>
        </footer>
      </main>
    </>
  );
}
