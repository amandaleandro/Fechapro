"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  Images,
  MessageCircle,
  Plus,
  Quote,
  Send,
  ShieldCheck,
  Star,
  TrendingUp,
  UserRound,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import { trackConversion } from "@/lib/conversion-client";
import { trackPixel } from "@/lib/meta-pixel";
import type { PlanCode } from "@/lib/plans";

type LandingPlan = {
  code: PlanCode;
  name: string;
  price: string;
  installment: string;
  bestFor: string;
  highlight: string;
  description: string;
  cta: string;
  href: string;
  featured?: boolean;
  inheritsLabel?: string;
  items: string[];
};

const plans: LandingPlan[] = [
  {
    code: "founder_start",
    name: "Começar",
    price: "R$ 397",
    installment: "ou 12x de R$ 39,90",
    bestFor: "Autônomo que quer parar de perder cliente depois do orçamento no WhatsApp.",
    highlight: "Sua ferramenta para fechar mais",
    description: "Tudo que você precisa para enviar proposta profissional e acompanhar.",
    cta: "Quero começar",
    href: "/checkout/cadastro/founder_start",
    items: [
      "Proposta com link rastreável",
      "Aviso quando o cliente abre e clica",
      "Calculadora de custo, taxa e margem",
      "PDF automático da proposta",
      "Aceite online do cliente",
      "Catálogo dos seus serviços",
      "Sua marca na proposta",
    ],
  },
  {
    code: "founder_professional",
    name: "Profissional",
    price: "R$ 997",
    installment: "ou 12x de R$ 99,70",
    bestFor: "Quem tem volume e quer recuperar a venda antes de ela esfriar.",
    highlight: "+ Prova visual e follow-up automático",
    description: "Para quem quer parar de mandar orçamento simples e vender com proposta de verdade.",
    cta: "Quero vender com mais controle",
    href: "/checkout/cadastro/founder_professional",
    featured: true,
    inheritsLabel: "Tudo do Começar, e mais:",
    items: [
      "Portfólio e fotos dos serviços",
      "Depoimentos de clientes",
      "Modelos de proposta prontos",
      "Follow-up automático por mensagem",
      "Sua página comercial própria",
      "Ajuda para montar as primeiras propostas",
    ],
  },
  {
    code: "founder",
    name: "Estrutura Pronta",
    price: "R$ 1.997",
    installment: "ou 12x de R$ 199,70",
    bestFor: "Quem quer a estrutura pronta sem precisar montar nada sozinho.",
    highlight: "+ Configuração feita com você",
    description: "A gente configura junto com você e já deixa as primeiras propostas prontas.",
    cta: "Quero minha estrutura pronta",
    href: "/checkout/cadastro/founder",
    inheritsLabel: "Tudo do Profissional, e mais:",
    items: [
      "Configuração feita junto com você",
      "Propostas iniciais criadas para você",
      "Copy de venda pronta",
      "Materiais de divulgação",
      "Suporte mais próximo",
    ],
  },
];

const heroStats = [
  { value: "3 grátis", label: "Propostas para testar" },
  { value: "1x", label: "Pagamento único" },
  { value: "R$ 0", label: "De mensalidade" },
  { value: "12+", label: "Nichos atendidos" },
];

const heroFeatures = [
  { icon: Eye, title: "Veja quando abriu", sub: "Follow-up sem chute" },
  { icon: Calculator, title: "Calcule antes", sub: "Custo, taxa e margem" },
  { icon: FileCheck2, title: "Conduza a decisão", sub: "Aceite, PDF e pagamento" },
];

const proofCards = [
  {
    icon: MessageCircle,
    title: "O cliente recebe um link",
    text: "Em vez de uma mensagem solta, ele abre uma proposta com escopo, prazo, valor, fotos e aceite.",
  },
  {
    icon: Eye,
    title: "Você vê a visualização",
    text: "O painel registra abertura, visualizações e cliques no WhatsApp para tirar o follow-up do chute.",
  },
  {
    icon: TrendingUp,
    title: "Você sabe o que cobrar",
    text: "A calculadora considera material, mão de obra, taxas e margem antes de você enviar.",
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
    title: "Pare de perder venda pelo silêncio do cliente",
    text: "Você sabe quando a proposta foi aberta, quantas vezes foi vista e quando vale a pena chamar antes do cliente esfriar.",
    icon: Eye,
  },
  {
    title: "Pare de perder dinheiro cobrando errado",
    text: "Some material, mão de obra e margem antes de enviar para não fechar serviço que dá prejuízo.",
    icon: Calculator,
  },
  {
    title: "Pare de virar só mais um preço",
    text: "Mostre escopo, fotos, prazo, aceite e pagamento para o cliente entender o valor antes de comparar você por preço.",
    icon: FileCheck2,
  },
];

const howItWorks = [
  ["Calcule antes de cobrar", "Some materiais, mão de obra, taxas e margem para nunca mais chutar o preço."],
  ["Monte a proposta", "Adicione escopo, fotos, prazo, condições e forma de pagamento em minutos."],
  ["Envie o link pelo WhatsApp", "O cliente recebe tudo organizado e bonito direto no celular."],
  ["Acompanhe e faça follow-up", "Veja visualizações, cliques, aceite e pagamento para agir na hora certa."],
];

// ⚠️ EXEMPLOS / PLACEHOLDER - depoimentos ilustrativos.
// Substitua por depoimentos REAIS de clientes do FechaPro antes de publicar.
// Publicar depoimento fabricado como real é publicidade enganosa (CDC art. 37 / CONAR).
const testimonials = [
  {
    quote:
      "Antes eu mandava o orçamento e ficava no escuro. Agora vejo a hora que o cliente abre e chamo na hora certa. Parei de perder serviço por demora.",
    name: "Rafael Menezes",
    role: "Instalação de ar-condicionado",
    city: "Campinas, SP",
    initials: "RM",
  },
  {
    quote:
      "A proposta com foto, prazo e aceite fez o cliente parar de me comparar só pelo preço. Fechei duas reformas que antes teriam ido pro mais barato.",
    name: "Daniela Souza",
    role: "Reformas e pintura",
    city: "Goiânia, GO",
    initials: "DS",
  },
  {
    quote:
      "A calculadora me mostrou que eu estava cobrando barato demais. Ajustei a margem e o follow-up automático trouxe cliente que tinha sumido.",
    name: "Tiago Albuquerque",
    role: "Energia solar",
    city: "Fortaleza, CE",
    initials: "TA",
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
    "Serve para o meu tipo de serviço?",
    "Se você vende serviço pelo WhatsApp, precisa explicar valor e costuma enviar orçamento antes de fechar, o FechaPro foi feito para esse cenário.",
  ],
  [
    "E se eu não vender?",
    "O FechaPro não promete milagre. Ele melhora a forma como você apresenta, acompanha e faz follow-up das propostas, que são três pontos onde muita venda é perdida.",
  ],
  [
    "Eu recebo pronto?",
    "No plano Estrutura Pronta, sim. No Profissional, você recebe ajuda para configurar as primeiras propostas.",
  ],
];

// estilo inline para o delay de cada reveal (escalonamento estilo Apple)
function delay(ms: number) {
  return { "--reveal-delay": `${ms}ms` } as React.CSSProperties;
}

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
    <article className="fp-glass-card mx-auto w-full max-w-md rounded-3xl border border-black/10 bg-white p-4 shadow-2xl shadow-slate-950/15 sm:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-green-700">Proposta rastreável</p>
          <h2 className="mt-1 text-xl font-black leading-tight text-slate-950">
            Proposta de instalação de ar-condicionado
          </h2>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-50 text-green-700">
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
          <div className="rounded-2xl bg-slate-50 p-3" key={label}>
            <dt className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 font-bold leading-5 text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Antes", "Instalação", "Teste final"].map((label) => (
          <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-green-50 text-center text-xs font-black text-green-800" key={label}>
            {label}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-800">
          <Eye className="mx-auto mb-1" size={18} />
          3 views
        </div>
        <div className="rounded-2xl bg-green-50 p-3 text-green-800">
          <Calculator className="mx-auto mb-1" size={18} />
          30% margem
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Clock3 className="mx-auto mb-1" size={18} />
          Follow-up
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs font-black uppercase tracking-wide text-white/55">Preço sugerido</p>
        <strong className="mt-1 block text-3xl">R$ 559</strong>
        <p className="mt-1 text-xs font-bold text-white/55">Material, mão de obra, taxas e margem considerados</p>
      </div>

      <button className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 font-black text-white" type="button">
        <Send size={18} />
        Aceitar proposta no WhatsApp
      </button>
    </article>
  );
}

export function LandingMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-black/5 bg-white p-5 text-center shadow-sm">
      <strong className="block text-3xl font-black text-slate-950">{value}</strong>
      <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
    </article>
  );
}

export function AuthScreen() {
  const rootRef = useRef<HTMLElement>(null);
  const heroSentinel = useRef<HTMLDivElement>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    trackConversion({
      event: "landing_viewed",
      campaign: "landing_servicos_whatsapp",
      source: "landing",
      context: "auth_screen",
    });
  }, []);

  // Reveal no scroll (estilo Apple) - sem dependência, só IntersectionObserver.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));

    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    // marca como pronto e revela o que já está visível sem flash
    root.classList.add("reveal-ready");
    const vh = window.innerHeight;
    els.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.9) {
        el.classList.add("is-in");
      } else {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Mostra o CTA fixo no mobile depois que o hero sai da tela.
  useEffect(() => {
    const sentinel = heroSentinel.current;
    if (!sentinel || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { rootMargin: "-40% 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
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
      <main ref={rootRef} className="fp-landing min-h-screen bg-[#faf8f3] text-[#111827]">
        {/* Barra de oferta */}
        <div className="fp-announce flex items-center justify-center gap-2 px-4 py-2 text-center text-xs font-black text-white sm:text-sm">
          <Clock3 size={15} className="shrink-0" />
          <span>Oferta de fundador: pagamento único, sem mensalidade. Vai até 30/06.</span>
        </div>

        <header className="sticky top-0 z-40 border-b border-black/10 bg-[#faf8f3]/85 px-4 backdrop-blur-xl">
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
            <nav className="hidden items-center gap-7 text-sm font-bold text-slate-700 md:flex">
              <a className="fp-navlink" href="#dor">Problema</a>
              <a className="fp-navlink" href="#controle">Controle</a>
              <a className="fp-navlink" href="#como-funciona">Como funciona</a>
              <a className="fp-navlink" href="#planos">Planos</a>
            </nav>
            <div className="flex items-center gap-2">
              <a className="hidden rounded-full px-3 py-2 text-sm font-black text-slate-700 transition hover:text-slate-950 sm:inline-flex sm:px-4" href="/login">
                Entrar
              </a>
              <a className="fp-cta-pulse rounded-full bg-green-700 px-4 py-2 text-sm font-black text-white transition hover:bg-green-800" href="/cadastro?plan=free">
                Criar 3 propostas grátis
              </a>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section id="top" className="fp-hero relative overflow-hidden px-4 py-16 sm:py-24">
          <div className="fp-hero-aura" aria-hidden />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <span className="fp-intro inline-flex items-center gap-2 rounded-full border border-green-700/20 bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-green-800 shadow-sm" style={delay(0)}>
                <Zap size={13} /> Para quem vende serviço pelo WhatsApp
              </span>
              <h1 className="fp-intro fp-balance mt-5 max-w-3xl text-[2.6rem] font-black leading-[1.04] tracking-tight sm:text-6xl" style={delay(80)}>
                Pare de mandar orçamento que o cliente <span className="fp-grad-text">lê e ignora</span>.
              </h1>
              <p className="fp-intro mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl" style={delay(160)}>
                Transforme seu orçamento do WhatsApp em uma proposta profissional rastreável: você mostra valor antes do preço e sabe a hora certa de chamar de volta.
              </p>
              <p className="fp-intro mt-4 max-w-2xl text-lg font-bold leading-8 text-slate-900" style={delay(220)}>
                O cliente entende o que está comprando antes de comparar você só pelo preço.
              </p>
              <div className="fp-intro mt-7 flex flex-col gap-3 sm:flex-row" style={delay(300)}>
                <a
                  className="fp-cta-primary group inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-green-700 px-7 py-3.5 text-base font-black text-white shadow-lg shadow-green-900/20 transition hover:bg-green-800"
                  href="/cadastro?plan=free"
                  onClick={() =>
                    trackConversion({
                      event: "primary_cta_clicked",
                      campaign: "landing_servicos_whatsapp",
                      source: "landing",
                      context: "hero_primary",
                      variant: "close_more_proposals",
                    })
                  }
                >
                  Criar 3 propostas grátis
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  className="inline-flex min-h-13 items-center justify-center rounded-full border border-black/10 bg-white px-7 py-3.5 text-base font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  href="#exemplo"
                >
                  Ver proposta de exemplo
                </a>
              </div>
              <p className="fp-intro mt-5 text-sm font-bold text-slate-600" style={delay(360)}>
                Sem cartão para testar · Pague uma vez · Sem mensalidade até 30/06
              </p>
              <div className="fp-intro mt-9 grid max-w-2xl gap-3 sm:grid-cols-3" style={delay(420)}>
                {heroFeatures.map(({ icon: Icon, title, sub }) => (
                  <article className="fp-lift rounded-2xl border border-black/5 bg-white p-4 shadow-sm" key={title}>
                    <Icon className="text-green-700" size={20} />
                    <strong className="mt-2 block text-sm font-black text-slate-950">{title}</strong>
                    <span className="mt-1 block text-xs font-bold leading-5 text-slate-500">{sub}</span>
                  </article>
                ))}
              </div>
            </div>
            <div id="exemplo" className="fp-intro" style={delay(240)}>
              <div className="fp-float">
                <ProposalMockup />
              </div>
            </div>
          </div>
          <div ref={heroSentinel} className="absolute bottom-0 h-px w-full" aria-hidden />
        </section>

        {/* STATS */}
        <section className="px-4 pb-4">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4" data-reveal>
            {heroStats.map((stat, i) => (
              <div data-reveal style={delay(i * 80)} key={stat.label}>
                <LandingMetric value={stat.value} label={stat.label} />
              </div>
            ))}
          </div>
        </section>

        {/* DOR */}
        <section id="dor" className="bg-white px-4 py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <h2 className="fp-balance text-3xl font-black leading-tight tracking-tight sm:text-5xl" data-reveal>
              Você manda o orçamento. O cliente visualiza. Some. E você fica no escuro.
            </h2>
            <div className="grid gap-4 text-lg leading-8 text-slate-700">
              <p className="rounded-2xl bg-green-50 p-5 text-xl font-black leading-8 text-green-900" data-reveal>
                O problema nem sempre é o preço. Muitas vezes, é que sua proposta chegou parecendo só mais uma mensagem com valores.
              </p>
              <p data-reveal style={delay(80)}>
                Quando o cliente recebe apenas preço, ele compara você com qualquer outro orçamento. Quando recebe uma proposta profissional, ele entende o escopo, os diferenciais, o prazo e o próximo passo.
              </p>
              <p data-reveal style={delay(160)}>Sem rastreio, você não sabe se deve chamar, esperar ou desistir. Sem cálculo, também não sabe se aquele valor cobre material, tempo, deslocamento, taxas e margem.</p>
              <p className="font-bold text-slate-900" data-reveal style={delay(240)}>
                O FechaPro transforma seu orçamento comum em uma proposta rastreável, com custo calculado e sinais claros para você agir antes de perder o cliente.
              </p>
            </div>
          </div>
        </section>

        {/* CONTROLE */}
        <section id="controle" className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="fp-balance max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-5xl" data-reveal>
              O FechaPro resolve os três pontos onde mais venda é perdida.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {salesPillars.map(({ title, text, icon: Icon }, i) => (
                <article className="fp-lift rounded-3xl border border-black/5 bg-white p-7 shadow-sm" key={title} data-reveal style={delay(i * 100)}>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 text-green-700">
                    <Icon size={26} />
                  </span>
                  <h3 className="mt-5 text-xl font-black leading-7">{title}</h3>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ANTES x DEPOIS */}
        <section className="bg-white px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="fp-balance max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl" data-reveal>
              Antes você perdia cliente sem saber por quê. Agora você acompanha sinais reais.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              <article className="rounded-3xl border border-rose-700/15 bg-white p-7 shadow-sm" data-reveal>
                <div className="flex items-center gap-3">
                  <XCircle className="text-rose-600" size={26} />
                  <h3 className="text-2xl font-black">Antes: orçamento solto no WhatsApp</h3>
                </div>
                <ul className="mt-6 grid gap-3">
                  {["Mensagem solta", "Você não sabe se o cliente abriu", "Preço calculado no chute", "Follow-up tarde demais", "Cliente some e a venda esfria"].map((item) => (
                    <li className="flex gap-2 font-bold text-slate-600" key={item}>
                      <XCircle className="mt-0.5 shrink-0 text-rose-500" size={17} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="fp-lift rounded-3xl border border-green-700/20 bg-green-50 p-7 shadow-sm" data-reveal style={delay(120)}>
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

        {/* COMO FUNCIONA (seção escura - ritmo Apple) */}
        <section id="como-funciona" className="fp-dark relative overflow-hidden px-4 py-20 text-white sm:py-28">
          <div className="fp-dark-aura" aria-hidden />
          <div className="relative mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-green-400" data-reveal>Em 4 passos</p>
            <h2 className="fp-balance mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl" data-reveal>
              Do orçamento ao aceite, sem complicação.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-4">
              {howItWorks.map(([title, text], index) => (
                <article className="fp-step rounded-3xl border border-white/10 bg-white/5 p-6" key={title} data-reveal style={delay(index * 100)}>
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-green-500 text-sm font-black text-slate-950">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/65">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PROVA DE CONTROLE */}
        <section className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl" data-reveal>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Prova de controle</p>
              <h2 className="fp-balance mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                Veja o que muda quando o orçamento vira proposta rastreável.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {proofCards.map(({ icon: Icon, title, text }, i) => (
                <article className="fp-lift rounded-3xl border border-black/5 bg-white p-7 shadow-sm" key={title} data-reveal style={delay(i * 100)}>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 text-green-700">
                    <Icon size={24} />
                  </span>
                  <h3 className="mt-5 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ENTREGA */}
        <section className="bg-white px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="fp-balance max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl" data-reveal>
              O que o FechaPro entrega para você perder menos orçamento.
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {proposalItems.map(({ title, icon: Icon }, i) => (
                <article className="fp-lift flex items-center gap-4 rounded-2xl border border-black/5 bg-slate-50 p-5" key={title} data-reveal style={delay((i % 3) * 80)}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-green-700 shadow-sm">
                    <Icon size={22} />
                  </span>
                  <h3 className="text-base font-black leading-snug">{title}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* NICHOS */}
        <section className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="fp-balance text-3xl font-black leading-tight tracking-tight sm:text-5xl" data-reveal>
              Feito para quem vende serviço pelo WhatsApp
            </h2>
            <p className="mt-4 max-w-3xl text-lg font-bold leading-8 text-slate-700" data-reveal style={delay(80)}>
              Ideal para quem vende serviços acima de R$300 e precisa explicar valor antes de cobrar preço.
            </p>
            <p className="mt-4 max-w-3xl rounded-2xl bg-green-50 p-5 text-xl font-black leading-8 text-green-900" data-reveal style={delay(140)}>
              O FechaPro transforma orçamento comum em proposta profissional que ajuda o cliente a confiar, entender e decidir.
            </p>
            <div className="mt-8 flex flex-wrap gap-2" data-reveal style={delay(200)}>
              {niches.map((niche) => (
                <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-green-700/30 hover:text-green-800" key={niche}>
                  {niche}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* DEPOIMENTOS - ⚠️ exemplos ilustrativos, trocar por reais antes de publicar */}
        <section className="px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl" data-reveal>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Quem usa</p>
              <h2 className="fp-balance mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                Prestadores de segmentos diferentes, o mesmo resultado: mais controle.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <figure
                  className="fp-lift relative flex flex-col rounded-3xl border border-black/5 bg-white p-7 shadow-sm"
                  key={t.name}
                  data-reveal
                  style={delay(i * 100)}
                >
                  <Quote className="text-green-700/30" size={34} />
                  <div className="mt-3 flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={16} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-base font-bold leading-7 text-slate-800">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-black/5 pt-5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-green-700 text-sm font-black text-white">
                      {t.initials}
                    </span>
                    <span>
                      <strong className="block text-sm font-black text-slate-950">{t.name}</strong>
                      <span className="block text-xs font-bold text-slate-500">
                        {t.role} · {t.city}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* PLANOS */}
        <section id="planos" className="bg-white px-4 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl" data-reveal>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Planos</p>
              <h2 className="fp-balance mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                Escolha como quer começar.
              </h2>
              <p className="mt-5 rounded-2xl bg-green-50 p-5 text-xl font-black leading-8 text-green-900">
                Uma venda recuperada já pode pagar o investimento inteiro.
              </p>
              <p className="mt-4 text-lg font-bold leading-8 text-slate-700">
                Crie 3 propostas grátis para testar. Depois, a condição atual é pagamento único e sem mensalidade para compras até 30/06.
              </p>
            </div>

            {/* guia rápido de diferença entre planos */}
            <div className="mt-10 grid gap-3 sm:grid-cols-3" data-reveal>
              {[
                ["Começar", "A ferramenta para enviar e acompanhar."],
                ["Profissional", "+ Prova visual e follow-up automático."],
                ["Estrutura Pronta", "+ A gente monta junto com você."],
              ].map(([k, v], i) => (
                <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-slate-50 p-4" key={k} style={delay(i * 70)}>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-700 text-xs font-black text-white">{i + 1}</span>
                  <p className="text-sm font-bold leading-5 text-slate-700"><strong className="text-slate-950">{k}:</strong> {v}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 grid items-start gap-5 lg:grid-cols-3">
              {plans.map((plan, i) => (
                <article
                  className={`fp-plan relative flex flex-col rounded-3xl border p-7 ${
                    plan.featured
                      ? "fp-plan-featured border-green-600 bg-slate-950 text-white shadow-2xl lg:-mt-3 lg:mb-3"
                      : "fp-lift border-black/5 bg-white shadow-sm"
                  }`}
                  key={plan.code}
                  data-reveal
                  style={delay(i * 100)}
                >
                  {plan.featured ? (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-4 py-1 text-xs font-black uppercase tracking-wide text-slate-950 shadow-lg">
                      Mais escolhido
                    </span>
                  ) : null}

                  <h3 className="text-2xl font-black">{plan.name}</h3>
                  <p className={`mt-2 text-sm font-bold leading-5 ${plan.featured ? "text-white/60" : "text-slate-500"}`}>
                    {plan.bestFor}
                  </p>

                  <span
                    className={`mt-5 inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-black ${
                      plan.featured ? "bg-green-500/15 text-green-300" : "bg-green-50 text-green-800"
                    }`}
                  >
                    {plan.highlight}
                  </span>

                  <div className="mt-5">
                    <strong className="block text-4xl font-black tracking-tight">{plan.price}</strong>
                    <span className={`mt-1 block text-sm font-bold ${plan.featured ? "text-white/55" : "text-slate-500"}`}>
                      {plan.installment} · pagamento único
                    </span>
                  </div>

                  <a
                    className={`mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-4 text-center font-black transition ${
                      plan.featured
                        ? "bg-green-500 text-slate-950 hover:bg-green-400"
                        : "bg-green-700 text-white hover:bg-green-800"
                    }`}
                    href={plan.href}
                    onClick={() => trackPlanClick(plan)}
                  >
                    {plan.cta}
                    <ArrowRight size={17} />
                  </a>

                  <div className={`my-6 h-px w-full ${plan.featured ? "bg-white/12" : "bg-black/8"}`} />

                  {plan.inheritsLabel ? (
                    <p className={`mb-3 text-sm font-black ${plan.featured ? "text-green-300" : "text-green-800"}`}>
                      {plan.inheritsLabel}
                    </p>
                  ) : (
                    <p className={`mb-3 text-sm font-black ${plan.featured ? "text-green-300" : "text-green-800"}`}>
                      Você recebe:
                    </p>
                  )}
                  <ul className="grid flex-1 gap-3">
                    {plan.items.map((item) => (
                      <li className="flex gap-2 text-sm font-bold" key={item}>
                        <CheckCircle2 className={`mt-0.5 shrink-0 ${plan.featured ? "text-green-400" : "text-green-600"}`} size={16} />
                        <span className={plan.featured ? "text-white/85" : "text-slate-700"}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* GARANTIA / risco zero */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-5xl" data-reveal>
            <div className="fp-lift grid gap-6 rounded-3xl border border-black/5 bg-white p-8 shadow-sm sm:grid-cols-[auto_1fr] sm:items-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-green-50 text-green-700">
                <ShieldCheck size={32} />
              </span>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Teste sem risco antes de pagar</h3>
                <p className="mt-2 text-base font-bold leading-7 text-slate-600">
                  Você cria 3 propostas grátis para sentir o produto antes de decidir. Sem cartão, sem mensalidade. Se fizer sentido, você paga uma única vez na condição de fundador.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div data-reveal>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Dúvidas comuns</p>
              <h2 className="fp-balance mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                O que normalmente trava a decisão.
              </h2>
            </div>
            <div className="grid gap-3">
              {commonQuestions.map(([question, answer], i) => (
                <details className="fp-faq group rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition open:shadow-md" key={question} data-reveal style={delay(i * 60)}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-slate-950">
                    {question}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-green-50 text-green-700 transition-transform group-open:rotate-45">
                      <Plus size={16} />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-600">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="fp-cta-final relative overflow-hidden px-4 py-24 text-center text-white">
          <div className="fp-dark-aura" aria-hidden />
          <div className="relative mx-auto max-w-3xl" data-reveal>
            <BadgeCheck className="mx-auto text-green-300" size={38} />
            <h2 className="fp-balance mt-5 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              Pare de mandar orçamento que o cliente ignora.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/75">
              Envie uma proposta rastreável, calcule seus custos e faça o follow-up antes do cliente esfriar.
            </p>
            <a
              className="fp-cta-primary group mt-9 inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-9 py-3.5 text-base font-black text-green-900 shadow-xl transition hover:-translate-y-0.5"
              href="/cadastro?plan=free"
            >
              Criar 3 propostas grátis
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <p className="mt-4 text-sm font-bold text-white/55">Sem cartão · Pague uma vez · Sem mensalidade até 30/06</p>
          </div>
        </section>

        <footer className="flex flex-col gap-4 bg-[#111827] px-4 py-9 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <Image
            alt="FechaPro"
            src="/brand/logofechapro.png"
            width={110}
            height={30}
            className="h-7 w-auto brightness-0 invert"
          />
          <div className="flex flex-wrap gap-5">
            <a className="transition hover:text-white" href="/privacidade">Política de Privacidade</a>
            <a className="transition hover:text-white" href="/termos">Termos de Uso</a>
            <a className="transition hover:text-white" href="/interesse">Suporte</a>
          </div>
          <span>© 2026 FechaPro. Todos os direitos reservados.</span>
        </footer>
      </main>

      {/* CTA fixo no mobile */}
      <div
        className={`fp-sticky-cta fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-[#faf8f3]/90 p-3 backdrop-blur-xl lg:hidden ${
          showStickyCta ? "fp-sticky-cta--on" : ""
        }`}
      >
        <a
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-green-700 px-5 font-black text-white shadow-lg"
          href="/cadastro?plan=free"
          onClick={() =>
            trackConversion({
              event: "primary_cta_clicked",
              campaign: "landing_servicos_whatsapp",
              source: "landing",
              context: "sticky_mobile",
            })
          }
        >
          Criar 3 propostas grátis
          <ArrowRight size={18} />
        </a>
      </div>
    </>
  );
}
