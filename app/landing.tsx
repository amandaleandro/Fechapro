"use client";

import { useEffect } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Calculator,
  CheckCircle2,
  Clock3,
  Eye,
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
    name: "Plano Começar",
    price: "R$ 397",
    installment: "ou 12x de R$ 39,90",
    description: "Para parar de perder cliente depois de enviar orçamento pelo WhatsApp.",
    cta: "Quero vender com controle",
    href: "/checkout/cadastro/founder_start",
    items: [
      "Propostas com link",
      "Rastreamento de visualização",
      "Calculadora de custo",
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
    description: "Para quem quer recuperar vendas perdidas com rastreio, prova visual e follow-up.",
    cta: "Quero vender com mais controle",
    href: "/checkout/cadastro/founder_professional",
    featured: true,
    items: [
      "Tudo do Inicial",
      "Portfólio/fotos",
      "Depoimentos",
      "Modelos prontos",
      "Mensagens de follow-up",
      "Ajuda para configurar primeiras propostas",
      "Página comercial simples",
    ],
  },
  {
    code: "founder",
    name: "Plano Estrutura Pronta",
    price: "R$ 1.997",
    installment: "ou 12x de R$ 199,70",
    description: "Para quem quer uma estrutura pronta para perder menos orçamento e vender mais.",
    cta: "Quero minha estrutura pronta",
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
  { title: "Cliente e serviço organizados", icon: UserRound },
  { title: "Custo, margem e preço sugerido", icon: Calculator },
  { title: "Visualizações e cliques rastreados", icon: Eye },
  { title: "Fotos, portfólio e depoimentos", icon: Images },
  { title: "Garantia, prazo e condições", icon: ShieldCheck },
  { title: "Aceite online, pagamento e PDF", icon: FileCheck2 },
];

const salesPillars = [
  {
    title: "Parar de perder venda por silêncio do cliente",
    text: "Você sabe quando a proposta foi aberta, quantas visualizações teve e quando vale chamar antes que o cliente esfrie.",
    icon: Eye,
  },
  {
    title: "Parar de perder dinheiro cobrando errado",
    text: "Some material, mão de obra e margem antes de enviar para não fechar serviço que dá prejuízo.",
    icon: Calculator,
  },
  {
    title: "Parar de virar só mais um preço",
    text: "Mostre escopo, fotos, prazo, aceite, pagamento e PDF para o cliente entender valor antes de comparar preço.",
    icon: FileCheck2,
  },
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
    "Não. A ideia é justamente você montar e enviar propostas pelo WhatsApp sem depender de designer, site ou ferramenta complicada.",
  ],
  ["É mensalidade?", "Não. A condição atual é pagamento único e uso sem mensalidade para compras até 30/06."],
  [
    "Serve para meu tipo de serviço?",
    "Se você vende serviço pelo WhatsApp, precisa explicar valor e costuma enviar orçamento antes de fechar, o FechaPro foi feito para esse cenário.",
  ],
  [
    "E se eu não vender?",
    "O FechaPro não promete milagre. Ele melhora a forma como você apresenta, acompanha e faz follow-up das propostas — três pontos onde muita venda é perdida.",
  ],
  [
    "Eu recebo pronto?",
    "No plano Estrutura Pronta, sim. No Profissional, você recebe ajuda para configurar.",
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
          <p className="text-xs font-black uppercase text-green-700">Proposta rastreável</p>
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
          ["Custo calculado", "material + mão de obra + margem"],
          ["Status", "visualizada há 8 min"],
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

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
        <div className="rounded-lg bg-blue-50 p-3 text-blue-800">
          <Eye className="mx-auto mb-1" size={18} />
          3 views
        </div>
        <div className="rounded-lg bg-green-50 p-3 text-green-800">
          <Calculator className="mx-auto mb-1" size={18} />
          30% margem
        </div>
        <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
          <Clock3 className="mx-auto mb-1" size={18} />
          Follow-up
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-slate-950 p-4 text-white">
        <p className="text-xs font-black uppercase text-white/55">Preço sugerido</p>
        <strong className="mt-1 block text-3xl">R$ 559</strong>
        <p className="mt-1 text-xs font-bold text-white/55">Material, mão de obra, taxas e margem considerados</p>
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
      "Plataforma para prestadores de serviço perderem menos vendas no WhatsApp com proposta rastreável, calculadora de custos, aceite online e follow-up.",
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
              <a href="#controle">Controle</a>
              <a href="#como-funciona">Como funciona</a>
              <a href="#planos">Planos</a>
            </nav>
            <div className="flex items-center gap-2">
              <a className="inline-flex rounded-lg px-3 py-2 text-sm font-black text-slate-700 sm:px-4" href="/login">
                Entrar
              </a>
              <a className="rounded-lg bg-green-700 px-4 py-2 text-sm font-black text-white" href="/cadastro?plan=free">
                Criar 3 orçamentos grátis
              </a>
            </div>
          </div>
        </header>

        <section id="top" className="px-4 py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
                Pare de perder cliente depois de mandar orçamento no WhatsApp
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
                O FechaPro resolve o ponto cego que faz muita venda escapar: você envia uma proposta por link, sabe quando o cliente visualizou, calcula se o preço dá lucro e faz o follow-up na hora certa.
              </p>
              <p className="mt-4 max-w-2xl text-lg font-bold leading-8 text-slate-800">
                Menos cliente perdido. Menos preço no chute. Mais controle para fechar pelo WhatsApp.
              </p>
              <div className="mt-5 inline-flex rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 text-sm font-black leading-6 text-green-900">
                Feito para prestadores que vendem serviço de R$300 a R$10.000 pelo WhatsApp.
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-green-700 px-6 text-base font-black text-white hover:bg-green-800"
                  href="/cadastro?plan=free"
                  onClick={() =>
                    trackConversion({
                      event: "primary_cta_clicked",
                      campaign: "landing_servicos_whatsapp",
                      source: "landing",
                      context: "hero_primary",
                    })
                  }
                >
                  Criar 3 orçamentos grátis
                </a>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-black/10 bg-white px-6 text-base font-black text-slate-800 hover:bg-slate-50"
                  href="#exemplo"
                >
                  Ver exemplo de proposta
                </a>
              </div>
              <div className="mt-5 grid gap-2 text-sm font-black text-green-800">
                <p>Crie 3 orçamentos grátis para testar.</p>
                <p>Pague uma vez. Use sem mensalidade até 30/06.</p>
              </div>
            </div>
            <div id="exemplo">
              <ProposalMockup />
            </div>
          </div>
        </section>

        <section id="dor" className="bg-white px-4 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <h2 className="text-3xl font-black leading-tight sm:text-5xl">
              Você manda o orçamento. O cliente some. E você fica no escuro.
            </h2>
            <div className="grid gap-4 text-lg leading-8 text-slate-700">
              <p className="rounded-lg bg-green-50 p-4 text-xl font-black leading-8 text-green-900">
                Cada orçamento sem resposta pode ser uma venda escapando. E, sem controle, você nem sabe se perdeu por preço, por demora no follow-up ou porque o cliente nem entendeu a proposta.
              </p>
              <p>
                Sem rastreio, você não sabe se deve chamar, esperar ou desistir. Sem cálculo, você também não sabe se aquele valor cobre material, tempo, deslocamento, taxas e margem.
              </p>
              <p>Aí o follow-up vira adivinhação e o preço vira aposta.</p>
              <p className="font-bold text-slate-900">
                O FechaPro resolve isso transformando seu orçamento em uma proposta rastreável, com custo calculado e sinais claros para você agir antes de perder o cliente.
              </p>
            </div>
          </div>
        </section>

        <section id="controle" className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="max-w-4xl text-3xl font-black leading-tight sm:text-5xl">
              O FechaPro resolve os três pontos onde muita venda é perdida.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {salesPillars.map(({ title, text, icon: Icon }) => (
                <article className="rounded-lg border border-black/10 bg-white p-6" key={title}>
                  <Icon className="text-green-700" size={28} />
                  <h3 className="mt-4 text-xl font-black leading-7">{title}</h3>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Antes você perdia cliente sem saber por quê. Agora você acompanha sinais reais.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <article className="rounded-lg border border-rose-700/15 bg-white p-6">
                <div className="flex items-center gap-3">
                  <XCircle className="text-rose-700" size={26} />
                  <h3 className="text-2xl font-black">Antes: orçamento solto no WhatsApp</h3>
                </div>
                <ul className="mt-6 grid gap-3">
                  {["Mensagem solta", "Você não sabe se o cliente abriu", "Preço calculado no chute", "Follow-up tarde demais", "Cliente some e a venda esfria"].map((item) => (
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
                  <h3 className="text-2xl font-black">Depois: controle com FechaPro</h3>
                </div>
                <ul className="mt-6 grid gap-3">
                  {["Link profissional rastreável", "Visualizações e cliques registrados", "Custo e margem antes do preço", "Follow-up antes do cliente esfriar", "Aceite e pagamento online"].map((item) => (
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
                ["Calcule antes de cobrar", "Some materiais, mão de obra, taxas e margem."],
                ["Monte a proposta", "Adicione escopo, fotos, prazo, condições e pagamento."],
                ["Envie o link pelo WhatsApp", "O cliente recebe tudo organizado no celular."],
                ["Acompanhe e faça follow-up", "Veja visualizações, cliques, aceite e pagamento para não perder venda por falta de ação."],
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

        <section className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase text-green-700">Prova de controle</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                Veja o que muda quando o orçamento vira proposta rastreável.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["O cliente recebe um link", "Em vez de uma mensagem solta, ele abre uma proposta com escopo, prazo, valor, fotos e aceite."],
                ["Você vê a visualização", "O painel registra abertura, visualizações e cliques no WhatsApp para tirar o follow-up do chute."],
                ["Você sabe o que cobrar", "A calculadora ajuda a considerar material, mão de obra, taxas e margem antes de enviar."],
              ].map(([title, text]) => (
                <article className="rounded-lg border border-black/10 bg-white p-6" key={title}>
                  <CheckCircle2 className="text-green-700" size={26} />
                  <h3 className="mt-4 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              O que o FechaPro entrega para você perder menos orçamento.
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
            <p className="mt-4 max-w-3xl text-lg font-bold leading-8 text-slate-700">
              Ideal para quem vende serviços acima de R$300 e precisa explicar valor antes de cobrar preço.
            </p>
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
                Uma venda recuperada já pode pagar o investimento inteiro.
              </p>
              <p className="mt-4 rounded-lg border border-black/10 bg-white p-4 text-base font-black leading-7 text-slate-800">
                Se você perde 1 cliente por mês porque mandou orçamento simples no WhatsApp e não acompanhou na hora certa, continuar no escuro também tem custo.
              </p>
              <p className="mt-4 text-lg font-bold leading-8 text-slate-700">
                Você pode criar 3 orçamentos grátis para testar. Depois, a condição atual é pagamento único e sem mensalidade para compras até 30/06.
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
                      Mais escolhido
                    </span>
                  ) : null}
                  <h3 className="pr-28 text-2xl font-black">{plan.name}</h3>
                  {plan.featured ? (
                    <p className="mt-3 rounded-lg bg-white/10 p-3 text-sm font-black leading-6 text-green-100">
                      Para quem quer parar de mandar orçamento simples e começar a vender com proposta profissional.
                    </p>
                  ) : null}
                  <p className={`mt-3 text-sm font-bold leading-6 ${plan.featured ? "text-white/65" : "text-slate-600"}`}>
                    {plan.description}
                  </p>
                  <div className="mt-6">
                    <strong className="block text-4xl font-black">{plan.price}</strong>
                    <span className={`mt-1 block text-sm font-bold ${plan.featured ? "text-white/55" : "text-slate-500"}`}>
                      {plan.installment}
                    </span>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-lg px-3 py-2 text-sm font-black ${
                          plan.featured ? "bg-white/10 text-green-200" : "bg-green-50 text-green-800"
                        }`}
                      >
                        3 orçamentos grátis
                      </span>
                      <span
                        className={`inline-flex rounded-lg px-3 py-2 text-sm font-black ${
                          plan.featured ? "bg-white/10 text-green-200" : "bg-green-50 text-green-800"
                        }`}
                      >
                        Sem mensalidade até 30/06
                      </span>
                    </div>
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
              Pare de perder venda no escuro.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/75">
              O FechaPro resolve o acompanhamento depois do orçamento: rastreio, custo calculado, aceite, pagamento e sinais para fazer follow-up antes do cliente esfriar.
            </p>
            <a className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-8 font-black text-green-900" href="/cadastro?plan=free">
              Criar 3 orçamentos grátis
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
