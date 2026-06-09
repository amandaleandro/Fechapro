"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Eye,
  FileDown,
  FileText,
  Layers3,
  Megaphone,
  MessageSquareQuote,
  Palette,
  Plus,
  QrCode,
} from "lucide-react";

export function LandingMetric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg bg-white/12 p-3 text-center">
      <strong className="block text-lg font-black">{value}</strong>
      <span className="text-xs font-bold text-white/70">{label}</span>
    </article>
  );
}

type FounderPlan = {
  code: string;
  name: string;
  monthlyPrice: string;
  annualMonthly: string;
  price: string;
  vagas: number;
  savings: string;
  paybackMonths: number;
  description: string;
  for: string;
  items: string[];
  href: string;
  featured: boolean;
};

// Parâmetros da oferta de lançamento — ajuste aqui e reflete em toda a landing.
const OFERTA = {
  encerra: "08/06", // último dia da Cota Fundador
  mensalidadeInicio: "09/06", // dia em que os preços mensais entram em vigor
  vagasTotais: 50,
};

export function AuthScreen() {
  const [openFaq, setOpenFaq] = useState(0);

  const founderPlans: FounderPlan[] = [
    {
      code: "founder_start",
      name: "Start",
      monthlyPrice: "R$ 97/mês",
      annualMonthly: "R$ 1.164/ano",
      price: "R$ 497",
      vagas: 20,
      savings: "R$ 667",
      paybackMonths: 6,
      for: "Designer iniciante, social media, autônomo que quer parar de mandar preço solto.",
      description:
        "Proposta com link, PDF, aceite online e pagamento integrado. Tudo que você precisa para profissionalizar o orçamento sem complicação.",
      items: [
        "50 propostas por mês",
        "Link profissional com PDF",
        "Aceite online",
        "PIX e Mercado Pago integrados",
        "Cadastro de marca e clientes",
        "5 artes de divulgação de boas-vindas",
        "Acesso vitalício — sem mensalidade",
      ],
      href: "/checkout/cadastro/founder_start",
      featured: false,
    },
    {
      code: "founder_professional",
      name: "Profissional",
      monthlyPrice: "R$ 197/mês",
      annualMonthly: "R$ 2.364/ano",
      price: "R$ 997",
      vagas: 15,
      savings: "R$ 1.367",
      paybackMonths: 6,
      for: "Designer estabelecido, nutricionista, coach, fotógrafo — profissional com ticket acima de R$ 500.",
      description:
        "Portfólio e depoimentos direto na proposta. Você sabe exatamente quando o cliente abriu, clicou e está pronto para fechar.",
      items: [
        "200 propostas por mês",
        "Tudo do Start",
        "Portfólio dentro da proposta",
        "Depoimentos de clientes",
        "Rastreamento avançado de visualizações",
        "15 artes de divulgação de boas-vindas",
        "Acesso vitalício — sem mensalidade",
      ],
      href: "/checkout/cadastro/founder_professional",
      featured: true,
    },
    {
      code: "founder_complete_site",
      name: "Pro Site",
      monthlyPrice: "R$ 297/mês",
      annualMonthly: "R$ 3.564/ano",
      price: "R$ 1.497",
      vagas: 10,
      savings: "R$ 2.067",
      paybackMonths: 6,
      for: "Agência pequena, consultor com ticket alto, profissional de saúde que quer presença online própria.",
      description:
        "Mini site profissional com domínio próprio + proposta + pagamento no mesmo lugar. Um endereço seu, sem depender do Instagram.",
      items: [
        "Tudo do Profissional",
        "Mini site profissional",
        "Domínio próprio incluído",
        "200 propostas por mês",
        "20 artes de divulgação de boas-vindas",
        "Acesso vitalício — sem mensalidade",
      ],
      href: "/checkout/cadastro/founder_complete_site",
      featured: false,
    },
    {
      code: "founder",
      name: "Estrutura Completa",
      monthlyPrice: "R$ 497/mês",
      annualMonthly: "R$ 5.964/ano",
      price: "R$ 1.997",
      vagas: 5,
      savings: "R$ 3.967",
      paybackMonths: 5,
      for: "Profissional com ticket alto, agência, consultor que quer sair com tudo estruturado sem perder tempo.",
      description:
        "Você entra com tudo pronto. Implantação assistida, diagnóstico do Instagram e primeira proposta criada junto com nossa equipe.",
      items: [
        "Propostas ilimitadas",
        "Mini site profissional",
        "Implantação assistida pela equipe",
        "Diagnóstico do Instagram",
        "Primeira proposta criada com você",
        "Treinamento completo de uso",
        "Acesso vitalício — sem mensalidade",
      ],
      href: "/checkout/cadastro/founder",
      featured: false,
    },
  ];

  const features = [
    {
      label: "Proposta",
      title: "O cliente abre o link e já entende tudo",
      text: "Marca, portfólio, escopo, prazo e valor numa página só. Ele não precisa te perguntar nada antes de decidir.",
      icon: FileText,
    },
    {
      label: "Rastreamento",
      title: "Você sabe exatamente o que aconteceu",
      text: "Abriu? Clicou? Aceitou? Cada passo fica registrado. Você para de mandar 'oi, viu minha proposta?' no escuro.",
      icon: Eye,
    },
    {
      label: "Pagamento",
      title: "PIX e Mercado Pago dentro da proposta",
      text: "O cliente aceita e já paga no mesmo link. Sem você precisar mandar chave PIX depois, nem conferir comprovante.",
      icon: CreditCard,
    },
    {
      label: "Identidade visual",
      title: "Sua logo em cada proposta enviada",
      text: "Logo, cor, WhatsApp e bio comercial aparecem em tudo. O cliente percebe que é uma empresa — não uma mensagem solta.",
      icon: Palette,
    },
    {
      label: "Templates",
      title: "22 modelos por nicho, prontos pra usar",
      text: "Design, saúde, eventos, reformas, marketing, beleza. Você não começa do zero — só ajusta o que é seu.",
      icon: Layers3,
    },
    {
      label: "Artes de divulgação",
      title: "Material pronto pra postar no Instagram",
      text: "Créditos de arte inclusos no plano. Você divulga seus serviços, aparece mais, e volta pro FechaPro quando o cliente entra em contato.",
      icon: Megaphone,
    },
  ];

  const problems = [
    {
      title: "Você manda o preço e o cliente some",
      text: "Não sabe se leu, se comparou com outro, se vai voltar. Fica esperando sem saber o que fazer.",
      icon: MessageSquareQuote,
    },
    {
      title: "Planilha, print ou mensagem solta",
      text: "Sem logo, sem escopo escrito, sem nada além do número. É difícil justificar valor assim.",
      icon: FileDown,
    },
    {
      title: "Aceite no WhatsApp, PIX separado",
      text: "O cliente fala 'ok' numa mensagem e você ainda precisa mandar a chave PIX depois. Parece amador.",
      icon: QrCode,
    },
    {
      title: "Follow-up sempre no timing errado",
      text: "Você manda mensagem sem saber se ele nem abriu ainda. Ou fica esperando e perde para outro.",
      icon: Bell,
    },
  ];

  const steps = [
    {
      title: "Configura a marca uma vez",
      text: "Logo, cor, WhatsApp e PIX. Em 30 minutos está pronto e não mexe mais.",
    },
    {
      title: "Cria a proposta",
      text: "Escolhe o template, preenche o serviço, valor e prazo. Menos de 5 minutos.",
    },
    {
      title: "Manda o link no WhatsApp",
      text: "Um link. O cliente abre no celular — sem baixar nada, sem cadastrar nada.",
    },
    {
      title: "Acompanha no painel",
      text: "Você vê se abriu, quando clicou, se aceitou e quando pagou.",
    },
  ];

  const testimonials = [
    {
      name: "Ana Clara R.",
      role: "Designer — São Paulo",
      quote:
        "Antes eu ficava mandando áudio explicando o que estava incluso. Agora o cliente já viu o portfólio, escopo e prazo antes de falar qualquer coisa. Fechei 3 projetos em 2 semanas.",
    },
    {
      name: "Rafael M.",
      role: "Consultor de marketing — BH",
      quote:
        "Vi no painel que ele tinha aberto e não respondido. Esperei 20 minutos e perguntei se tinha ficado alguma dúvida. Fechou na hora — R$ 4.800 que eu perderia esperando no escuro.",
    },
    {
      name: "Juliana F.",
      role: "Nutricionista — Curitiba",
      quote:
        "Meu orçamento virou um plano de cuidado com etapas e objetivos. A pergunta do paciente deixou de ser 'quanto custa?' e virou 'quando a gente começa?'.",
    },
  ];

  const faqs = [
    [
      "Preciso instalar algum app?",
      "Não. O FechaPro funciona pelo navegador, no celular ou computador. Seu cliente também acessa pelo link, sem cadastro obrigatório.",
    ],
    [
      "Uma proposta fechada já paga o plano?",
      "Para a maioria dos profissionais, sim. Se o seu ticket médio é R$ 500 e você fecha 1 proposta a mais por causa do FechaPro, o plano Start se pagou em 24 horas. No plano Profissional, 2 projetos a mais já cobrem o investimento inteiro.",
    ],
    [
      "Funciona para o meu nicho?",
      "O FechaPro tem templates prontos para 22 nichos: design, saúde, eventos, reformas, marketing digital, beleza, consultoria, educação, gastronomia e outros. Se o seu nicho não está na lista, você cria do zero em minutos.",
    ],
    [
      "Quanto tempo leva para configurar?",
      "A maioria dos profissionais configura a marca e envia a primeira proposta em menos de 40 minutos. Planos com implantação têm configuração assistida pela nossa equipe.",
    ],
    [
      "O pagamento pelo link é seguro?",
      "Sim. O checkout usa Mercado Pago certificado ou PIX direto configurado por você. O FechaPro não processa nem armazena dados de cartão.",
    ],
    [
      "Posso cancelar o plano mensal?",
      "Sim, sem multa. A Cota Fundador é vitalícia — você paga uma vez e usa para sempre, sem preocupação com cancelamento.",
    ],
    [
      "O que acontece depois que eu compro?",
      "Você recebe acesso por e-mail. Start e Profissional em até 24h úteis. Pro Site e Estrutura Completa recebem formulário de briefing e nossa equipe agenda a configuração inicial em até 5 dias úteis.",
    ],
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "FechaPro",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://fechapro.com.br",
        description:
          "Propostas profissionais com link, PDF, aceite online, pagamento integrado, rastreamento e artes de divulgação para prestadores de serviço.",
        offers: founderPlans.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          price: plan.price.replace("R$ ", "").replace(".", ""),
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="fp-landing min-h-screen bg-[#faf8f3] text-[#0d1409]">

        {/* Urgency bar */}
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 bg-[#f2c84b] px-4 py-2 text-center text-xs font-black leading-snug text-[#5c3a00] sm:text-sm">
          <span>
            🔒 <strong>Cota Fundador</strong> — vitalício a partir de R$ 497 · {OFERTA.vagasTotais} vagas · encerra {OFERTA.encerra}
          </span>
          <a href="#fundador" className="underline decoration-2 underline-offset-2 hover:text-[#3d2700]">
            Garantir minha vaga →
          </a>
        </div>

        {/* Sticky nav */}
        <header className="sticky top-[32px] z-40 border-b border-black/10 bg-[#f5f2ec]/90 px-4 backdrop-blur sm:top-[36px]">
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
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#como-funciona">Como funciona</a>
              <a href="#fundador">Planos</a>
              <a href="#faq">FAQ</a>
            </nav>
            <div className="flex items-center gap-2">
              <a
                className="inline-flex rounded-lg px-3 py-2 text-sm font-black text-slate-700 sm:px-4"
                href="/login"
              >
                Entrar
              </a>
              <a
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-black text-white"
                href="#fundador"
              >
                Começar
              </a>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section id="top" className="relative overflow-hidden px-4 py-20 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_35%,rgba(34,160,96,0.18),transparent_55%),linear-gradient(rgba(212,207,197,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(212,207,197,0.45)_1px,transparent_1px)] bg-[length:auto,60px_60px,60px_60px]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                {["Sem app pra instalar", "Funciona no celular", "Cliente não precisa de conta"].map((tag) => (
                  <span
                    className="rounded-full border border-green-700/20 bg-green-50 px-3 py-1 text-xs font-black text-green-800"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
                Pare de mandar preço solto.{" "}
                <span className="text-green-700">Comece a fechar com proposta.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                Proposta profissional com link, aceite online e PIX no mesmo lugar. Você manda no WhatsApp
                e vê a hora exata que o cliente abriu — pra cobrar no momento certo, não no escuro.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-green-700 px-6 font-black text-white shadow-lg shadow-green-900/15"
                  href="#fundador"
                >
                  Ver planos e vagas →
                </a>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-black/10 px-6 font-black text-slate-700"
                  href="#como-funciona"
                >
                  Como funciona
                </a>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ["Link + PDF", "Proposta com link para abrir no celular e PDF para guardar e comparar"],
                  ["PIX + Mercado Pago", "Aceite e pagamento no mesmo link — sem precisar de outro sistema"],
                  ["Rastreamento em tempo real", "Você vê quando abriu, clicou, aceitou e pagou"],
                ].map(([title, desc]) => (
                  <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm" key={title}>
                    <strong className="block text-base font-black text-green-800">{title}</strong>
                    <span className="mt-2 block text-sm leading-6 text-slate-600">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fe + Mock-up */}
            <div className="flex flex-col items-center">
              <Image
                alt="Fe — FechaPro"
                src="/landing/fe-sozinha.png"
                width={260}
                height={390}
                className="-mb-6 h-auto w-48 sm:w-56 lg:w-64 relative z-10 drop-shadow-xl"
                priority
              />
            <div className="w-full rounded-lg border border-black/10 bg-white p-4 shadow-2xl shadow-green-950/10 relative z-0">
              <div className="rounded-lg bg-slate-950 p-4 text-white">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <strong>Proposta Comercial</strong>
                  <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-black text-slate-950">
                    Visualizada agora
                  </span>
                </div>
                <div className="mt-5 grid gap-4 rounded-lg bg-white p-5 text-slate-950">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-lg bg-green-700 text-lg font-black text-white">
                      LS
                    </span>
                    <div>
                      <p className="text-xs font-black uppercase text-green-700">Lumina Studio</p>
                      <h2 className="text-2xl font-black">Identidade visual completa</h2>
                    </div>
                  </div>
                  <div className="grid gap-3 rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-black text-slate-900">
                      Logo, paleta, tipografia, manual e 2 rodadas de ajuste.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <span className="rounded-lg bg-green-50 p-3 text-sm font-black text-green-800">R$ 1.800</span>
                      <span className="rounded-lg bg-blue-50 p-3 text-sm font-black text-blue-800">10 dias úteis</span>
                      <span className="rounded-lg bg-amber-50 p-3 text-sm font-black text-amber-800">50% + 50%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-20 rounded-lg bg-gradient-to-br from-emerald-600 to-slate-950" />
                    <div className="h-20 rounded-lg bg-gradient-to-br from-blue-700 to-emerald-500" />
                    <div className="h-20 rounded-lg bg-gradient-to-br from-slate-200 to-white ring-1 ring-black/10" />
                  </div>
                  <button
                    className="min-h-12 rounded-lg bg-green-700 font-black text-white"
                    type="button"
                  >
                    Aceitar proposta
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </section>

        {/* Before / After */}
        <section className="px-4 py-16">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
            <article className="rounded-lg border border-rose-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase text-rose-700">Hoje — Preço solto no WhatsApp</p>
              <div className="mt-5 rounded-lg bg-[#e9f7ef] p-4 text-slate-900">
                <p className="max-w-sm rounded-lg bg-white px-4 py-3 text-sm font-bold shadow-sm">
                  Fica R$ 850. Faço em 5 dias.
                </p>
              </div>
              <h2 className="mt-6 text-2xl font-black">O cliente compara só preço.</h2>
              <p className="mt-2 leading-7 text-slate-600">
                Sem escopo, sem prova, sem condição de pagamento. Você vira mais um número e a conversa
                termina em desconto ou silêncio.
              </p>
            </article>
            <article className="rounded-lg border border-green-700 bg-slate-950 p-6 text-white shadow-xl shadow-green-950/20">
              <p className="text-xs font-black uppercase text-green-300">Com FechaPro — Proposta profissional</p>
              <div className="mt-5 rounded-lg bg-white p-4 text-slate-950">
                <div className="flex items-center justify-between gap-3">
                  <strong>Instalação elétrica residencial</strong>
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-800">
                    Link aberto
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700">
                  <span>Escopo: revisão, instalação e teste de segurança</span>
                  <span>Prazo: 5 dias úteis</span>
                  <span>Pagamento: PIX ou Mercado Pago</span>
                  <span>PDF + aceite online</span>
                </div>
              </div>
              <h2 className="mt-6 text-2xl font-black">O cliente entende valor antes de perguntar desconto.</h2>
              <p className="mt-2 leading-7 text-white/70">
                Marca, fotos, itens inclusos, prazo e pagamento — tudo antes do follow-up. A proposta vende sozinha.
              </p>
            </article>
          </div>
        </section>

        {/* Problems */}
        <section className="bg-[#0d1409] px-4 py-16 text-white">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase text-rose-400">O que acontece hoje</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Manda o preço no WhatsApp. O cliente não responde mais.
            </h2>
            <div className="mt-10 grid gap-3 md:grid-cols-4">
              {problems.map((item) => (
                <article
                  className="rounded-lg border border-white/10 bg-white/5 p-5"
                  key={item.title}
                >
                  <item.icon className="text-green-300" size={24} />
                  <h3 className="mt-4 font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/65">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="funcionalidades" className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase text-green-700">O que o FechaPro faz</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Seis recursos que mudam como você envia orçamento.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article
                  className="rounded-lg border border-black/10 bg-white p-6 shadow-sm"
                  key={feature.title}
                >
                  <feature.icon className="text-green-700" size={26} />
                  <p className="mt-5 text-xs font-black uppercase text-green-700">{feature.label}</p>
                  <h3 className="mt-2 text-xl font-black">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="bg-[#0d1409] px-4 py-20 text-white">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase text-green-300">Como funciona</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Você configura uma vez e manda proposta em menos de 5 minutos.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              {steps.map((step, index) => (
                <article
                  className="rounded-lg border border-white/10 bg-white/5 p-5"
                  key={step.title}
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-lg font-black text-green-800">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 font-black">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/65">{step.text}</p>
                </article>
              ))}
            </div>
            <div className="mt-10 grid gap-6 rounded-lg border border-white/10 bg-white/5 p-6 lg:grid-cols-2 lg:items-center">
              <div>
                <h3 className="text-2xl font-black">Você para de adivinhar. Começa a acompanhar.</h3>
                <p className="mt-3 leading-7 text-white/70">
                  Cada movimentação entra no histórico da proposta. Follow-up com contexto, na hora certa.
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  "Proposta visualizada — há 3 minutos",
                  "Cliente clicou no WhatsApp",
                  "Proposta aceita ✓",
                  "Pagamento confirmado ✓",
                ].map((item) => (
                  <div
                    className="rounded-lg border border-white/10 bg-[#1c2616] p-4 font-bold"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase text-green-700">Quem já usa</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              O que mudou pra quem saiu do WhatsApp e foi pro link.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {testimonials.map(({ name, role, quote }) => (
                <article
                  className="rounded-lg border border-black/10 bg-white p-6 shadow-sm"
                  key={name}
                >
                  <p className="text-[#b88d13]">★★★★★</p>
                  <p className="mt-4 text-sm italic leading-7 text-slate-700">&quot;{quote}&quot;</p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-green-700 font-black text-white">
                      {name[0]}
                    </span>
                    <p>
                      <strong className="block text-sm">{name}</strong>
                      <span className="text-xs font-bold text-slate-500">{role}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing — monthly anchor + founder offer */}
        <section id="fundador" className="bg-[#f5f2ec] px-4 py-20">
          <div className="mx-auto max-w-7xl">

            {/* Monthly price anchor */}
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 sm:p-8">
              <p className="text-xs font-black uppercase text-amber-700">
                Atenção — Preços mensais a partir de {OFERTA.mensalidadeInicio}
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                A partir de junho, o FechaPro passa a ter mensalidade.
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-700">
                Quem entrar como <strong>Fundador até {OFERTA.encerra}</strong> paga uma vez e nunca mais paga nada.
                Os valores abaixo são a referência de quanto você economiza.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {founderPlans.map((plan) => (
                  <div
                    className="rounded-lg border border-amber-200 bg-white p-4 text-center"
                    key={plan.code}
                  >
                    <p className="text-xs font-black uppercase text-slate-500">{plan.name}</p>
                    <p className="mt-2 text-xl font-black text-slate-400 line-through">
                      {plan.monthlyPrice}
                    </p>
                    <p className="mt-1 text-xs font-bold text-amber-700">{plan.annualMonthly} no 1º ano</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Founder offer headline */}
            <div className="mt-14 text-center">
              <p className="text-xs font-black uppercase text-green-700">Cota Fundador · Até {OFERTA.encerra}</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                Pague uma vez. Use para sempre.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Acesso vitalício ao FechaPro. Sem mensalidade, sem renovação, sem surpresa no cartão.
              </p>
            </div>

            {/* 4 founder plan cards */}
            <div className="mt-10 grid gap-6 lg:grid-cols-4">
              {founderPlans.map((plan) => (
                <article
                  key={plan.code}
                  className={`relative flex flex-col rounded-2xl border-2 p-6 ${
                    plan.featured
                      ? "border-green-700 bg-slate-950 text-white shadow-2xl shadow-green-950/20"
                      : "border-black/10 bg-white text-[#0d1409] shadow-sm"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-green-700 px-5 py-1.5 text-xs font-black text-white">
                      Mais escolhido
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-black ${
                        plan.featured ? "bg-rose-900/60 text-rose-300" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {plan.vagas} vagas · Encerra {OFERTA.encerra}
                    </span>
                  </div>

                  <p
                    className={`mt-4 text-xs font-black uppercase ${
                      plan.featured ? "text-green-300" : "text-slate-500"
                    }`}
                  >
                    {plan.name}
                  </p>

                  <p
                    className={`mt-1 text-sm font-bold line-through ${
                      plan.featured ? "text-white/35" : "text-slate-400"
                    }`}
                  >
                    {plan.monthlyPrice} a partir de {OFERTA.mensalidadeInicio}
                  </p>

                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <strong className="text-4xl font-black">{plan.price}</strong>
                    <span
                      className={`text-sm font-bold ${
                        plan.featured ? "text-white/55" : "text-slate-500"
                      }`}
                    >
                      uma vez
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-xs font-black ${
                      plan.featured ? "text-green-300" : "text-green-700"
                    }`}
                  >
                    Economize {plan.savings} no 1º ano · se paga em {plan.paybackMonths} meses
                  </p>

                  <p
                    className={`mt-3 text-xs font-bold leading-5 ${
                      plan.featured ? "text-white/55" : "text-slate-500"
                    }`}
                  >
                    Para quem: {plan.for}
                  </p>

                  <p
                    className={`mt-3 text-sm leading-6 ${
                      plan.featured ? "text-white/75" : "text-slate-600"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <ul className="mt-5 flex-1 grid gap-2">
                    {plan.items.map((item) => (
                      <li className="flex gap-2 text-sm font-bold" key={item}>
                        <CheckCircle2
                          className={`mt-0.5 shrink-0 ${
                            plan.featured ? "text-green-400" : "text-green-700"
                          }`}
                          size={15}
                        />
                        <span className={plan.featured ? "text-white/85" : "text-slate-700"}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <a
                    className={`mt-6 grid min-h-12 place-items-center rounded-xl px-4 text-center font-black shadow-md ${
                      plan.featured
                        ? "bg-green-500 text-slate-950 shadow-green-900/30 hover:bg-green-400"
                        : "bg-green-700 text-white shadow-green-900/20 hover:bg-green-800"
                    }`}
                    href={plan.href}
                  >
                    Garantir {plan.name} →
                  </a>
                  <p
                    className={`mt-2 text-center text-[11px] font-bold ${
                      plan.featured ? "text-white/35" : "text-slate-400"
                    }`}
                  >
                    Pagamento seguro · Mercado Pago
                  </p>
                </article>
              ))}
            </div>

            {/* ROI callout */}
            <div className="mt-8 rounded-xl bg-slate-950 p-6 text-center text-white sm:p-8">
              <p className="text-xl font-black">
                "Uma proposta fechada já paga o plano inteiro."
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/65">
                Se você fechar um projeto de R$ 500 que antes perderia por falta de apresentação, o plano
                Start se paga em 24 horas. No plano Profissional, 2 projetos a mais já cobrem o
                investimento inteiro.
              </p>
              <a
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-green-600 px-8 font-black text-white hover:bg-green-500"
                href="#fundador"
              >
                Escolher meu plano →
              </a>
            </div>
          </div>
        </section>

        {/* After purchase */}
        <section className="bg-white px-4 py-16">
          <div className="mx-auto grid max-w-7xl gap-6 rounded-lg border border-black/10 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 lg:grid-cols-[0.8fr_1.2fr] lg:p-8">
            <div>
              <p className="text-xs font-black uppercase text-green-300">Depois da compra</p>
              <h2 className="mt-3 text-3xl font-black leading-tight">
                O que acontece depois que você garante sua vaga?
              </h2>
              <p className="mt-3 leading-7 text-white/70">
                Você recebe acesso por e-mail. Planos com implantação recebem um formulário de briefing e
                nossa equipe agenda a configuração inicial.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                [
                  "Acesso imediato",
                  "Start e Profissional recebem acesso por e-mail em até 24h úteis após confirmação do pagamento.",
                ],
                [
                  "Implantação assistida",
                  "Pro Site e Estrutura Completa: equipe entra em contato para agendar a configuração inicial em até 5 dias úteis.",
                ],
                [
                  "Acesso vitalício",
                  "Você paga uma vez. Sem mensalidade, sem renovação automática, sem surpresa futura.",
                ],
                [
                  "Sem aprendizado longo",
                  "A maioria dos clientes cria a primeira proposta em menos de 40 minutos após o primeiro acesso.",
                ],
              ].map(([title, text]) => (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4" key={title}>
                  <strong>{title}</strong>
                  <p className="mt-2 text-sm leading-6 text-white/70">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-[#0d1409] px-4 py-20 text-white">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase text-green-300">FAQ</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
                As dúvidas antes de comprar.
              </h2>
              <p className="mt-3 leading-7 text-white/55">
                Alguma dúvida fora da lista? É só falar no WhatsApp.
              </p>
            </div>
            <div className="grid gap-3">
              {faqs.map(([question, answer], index) => (
                <article className="border-b border-white/10" key={question}>
                  <button
                    className="flex w-full items-center justify-between gap-4 py-5 text-left font-black"
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  >
                    <span>{question}</span>
                    <Plus
                      className={`shrink-0 transition-transform ${openFaq === index ? "rotate-45" : ""}`}
                      size={20}
                    />
                  </button>
                  {openFaq === index && (
                    <p className="pb-5 text-sm leading-7 text-white/65">{answer}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-green-900 px-4 py-20 text-center text-white sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(74,222,128,0.22),transparent_60%)]" />
          <div className="relative mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-green-200 ring-1 ring-white/15">
              Última chamada
            </span>
            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-5xl">
              <span className="text-green-300">{OFERTA.vagasTotais} vagas.</span> Encerra {OFERTA.encerra}.
              <br className="hidden sm:block" /> Depois é mensalidade.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/75">
              Pague uma vez e use o FechaPro para sempre. Envie sua primeira proposta profissional hoje.
            </p>
            <a
              className="mt-9 inline-flex min-h-14 items-center justify-center rounded-xl bg-white px-8 text-base font-black text-green-900 shadow-xl shadow-green-950/40 transition hover:-translate-y-0.5 hover:bg-green-50"
              href="#fundador"
            >
              Garantir minha vaga de Fundador →
            </a>
            <p className="mt-4 text-sm text-white/45">Pagamento seguro via Mercado Pago · PIX disponível</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-4 bg-[#0d1409] px-4 py-8 text-sm text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <Image
            alt="FechaPro"
            src="/brand/logofechapro.png"
            width={110}
            height={30}
            className="h-7 w-auto brightness-0 invert"
          />
          <div className="flex gap-5">
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
