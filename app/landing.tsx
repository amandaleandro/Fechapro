"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { trackPixel } from "@/lib/meta-pixel";
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Eye,
  FileDown,
  FileText,
  MessageSquareQuote,
  Plus,
  QrCode,
  XCircle,
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
  originalPrice: string;
  price: string;
  vagas: number;
  savings: string;
  paybackMonths: number;
  description: string;
  for: string;
  recommendation: string;
  quickFit: string;
  cta: string;
  items: string[];
  notIncluded: string[];
  href: string;
  featured: boolean;
};

// Parâmetros da oferta de lançamento — ajuste aqui e reflete em toda a landing.
const OFERTA = {
  propostasGratis: 3,
  planosDisponiveis: 4,
  encerra: "30/06",
  encerraCompleto: "30/06/2026 às 23h59",
};

const CAMPAIGN_END = new Date("2026-06-30T23:59:00-03:00").getTime();

function getCampaignTimeLeft() {
  const diff = Math.max(0, CAMPAIGN_END - Date.now());
  const totalMinutes = Math.floor(diff / 60000);

  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

export function AuthScreen() {
  const [openFaq, setOpenFaq] = useState(0);
  const [campaignTimeLeft, setCampaignTimeLeft] = useState(getCampaignTimeLeft);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCampaignTimeLeft(getCampaignTimeLeft());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const founderPlans: FounderPlan[] = [
    {
      code: "founder_start",
      name: "Essencial",
      monthlyPrice: "R$ 97/mês",
      annualMonthly: "R$ 1.164/ano",
      originalPrice: "R$ 497",
      price: "R$ 397",
      vagas: 20,
      savings: "R$ 767",
      paybackMonths: 6,
      for: "Designer iniciante, social media, autônomo que quer parar de mandar preço solto.",
      recommendation: "Para quem quer começar sozinho e profissionalizar as propostas sem complicação.",
      quickFit: "Para criar e acompanhar sozinho",
      cta: "Comprar plano de R$ 397",
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
      notIncluded: ["Implantação assistida", "Mini site profissional"],
      href: "/checkout/cadastro/founder_start",
      featured: false,
    },
    {
      code: "founder_professional",
      name: "Profissional",
      monthlyPrice: "R$ 197/mês",
      annualMonthly: "R$ 2.364/ano",
      originalPrice: "R$ 997",
      price: "R$ 797",
      vagas: 15,
      savings: "R$ 1.567",
      paybackMonths: 6,
      for: "Designer estabelecido, nutricionista, coach, fotógrafo — profissional com ticket acima de R$ 500.",
      recommendation: "Para quem quer ajuda para colocar uma estrutura comercial mais forte em funcionamento.",
      quickFit: "Para começar com implantação",
      cta: "Comprar plano de R$ 797",
      description:
        "Portfólio e depoimentos direto na proposta. Você sabe exatamente quando o cliente abriu, clicou e está pronto para fechar.",
      items: [
        "200 propostas por mês",
        "Tudo do Essencial",
        "Portfólio dentro da proposta",
        "Depoimentos de clientes",
        "Rastreamento avançado de visualizações",
        "15 artes de divulgação de boas-vindas",
        "Acesso vitalício — sem mensalidade",
      ],
      notIncluded: ["Mini site profissional", "Implantação completa com diagnóstico"],
      href: "/checkout/cadastro/founder_professional",
      featured: true,
    },
    {
      code: "founder_complete_site",
      name: "Completo com site",
      monthlyPrice: "R$ 297/mês",
      annualMonthly: "R$ 3.564/ano",
      originalPrice: "R$ 1.497",
      price: "R$ 1.197",
      vagas: 10,
      savings: "R$ 2.367",
      paybackMonths: 6,
      for: "Agência pequena, consultor com ticket alto, profissional de saúde que quer presença online própria.",
      recommendation: "Para quem quer proposta, acompanhamento e presença profissional com site.",
      quickFit: "Para ter estrutura personalizada",
      cta: "Comprar plano de R$ 1.197",
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
      notIncluded: ["Diagnóstico do Instagram", "Primeira proposta criada com a equipe"],
      href: "/checkout/cadastro/founder_complete_site",
      featured: false,
    },
    {
      code: "founder",
      name: "Estrutura",
      monthlyPrice: "R$ 497/mês",
      annualMonthly: "R$ 5.964/ano",
      originalPrice: "R$ 1.997",
      price: "R$ 1.697",
      vagas: 5,
      savings: "R$ 4.267",
      paybackMonths: 5,
      for: "Profissional com ticket alto, agência, consultor que quer sair com tudo estruturado sem perder tempo.",
      recommendation: "Para quem quer implantação completa, site e acompanhamento para sair com tudo pronto.",
      quickFit: "Para ter FechaPro, implantação e site",
      cta: "Comprar plano de R$ 1.697",
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
      notIncluded: ["Mensalidade recorrente", "Renovação automática"],
      href: "/checkout/cadastro/founder",
      featured: false,
    },
  ];

  const features = [
    {
      label: "Proposta profissional",
      title: "Mostre valor antes de falar de preço",
      text: "Serviços, escopo, prazo, portfólio e depoimentos em um link claro para enviar pelo WhatsApp.",
      icon: FileText,
    },
    {
      label: "Visualização em tempo real",
      title: "Saiba quando o cliente abriu",
      text: "Acompanhe quem visualizou para priorizar os contatos com maior chance de fechar.",
      icon: Eye,
    },
    {
      label: "Follow-up no momento certo",
      title: "Fale com contexto, sem parecer cobrança",
      text: "Use a visualização como sinal para retomar a conversa enquanto a proposta ainda está fresca.",
      icon: Bell,
    },
    {
      label: "Aceite e pagamento",
      title: "Transforme interesse em confirmação",
      text: "O cliente pode aceitar online e seguir para o pagamento no mesmo fluxo.",
      icon: CreditCard,
    },
  ];

  const extras = [
    "Portfólio e depoimentos",
    "PDF automático",
    "Pagamento integrado",
    "Cadastro de marca e clientes",
    "Templates por nicho",
    "Histórico de follow-up",
  ];

  const comparison = [
    {
      title: "Orçamento comum",
      tone: "danger",
      items: [
        "Mostra apenas o preço",
        "Perde-se no WhatsApp",
        "Facilita comparação com concorrentes",
        "Não mostra portfólio ou depoimentos",
        "Você não sabe se o cliente abriu",
      ],
    },
    {
      title: "Proposta com FechaPro",
      tone: "success",
      items: [
        "Apresenta o valor do serviço",
        "Reúne tudo em um link",
        "Mostra portfólio e depoimentos",
        "Permite aceite online",
        "Avisa quando o cliente visualiza",
      ],
    },
  ];
  const problems = [
    {
      title: "Não sabe se o cliente abriu",
      text: "A proposta foi enviada, mas você não sabe se ela recebeu atenção.",
      icon: MessageSquareQuote,
    },
    {
      title: "Não sabe quando fazer follow-up",
      text: "A mensagem sai cedo demais, tarde demais ou sem contexto.",
      icon: Bell,
    },
    {
      title: "Perde oportunidades por agir tarde",
      text: "Clientes interessados esfriam antes de você perceber o melhor momento.",
      icon: FileDown,
    },
    {
      title: "Fica cobrando resposta sem contexto",
      text: "O contato vira cobrança em vez de continuação natural da proposta.",
      icon: QrCode,
    },
  ];

  const steps = [
    {
      title: "Crie sua proposta",
      text: "Monte uma apresentação profissional com serviços, prazo, valor e diferenciais.",
    },
    {
      title: "Envie o link pelo WhatsApp",
      text: "O cliente abre a proposta no celular, sem instalar app e sem criar conta.",
    },
    {
      title: "Saiba quando abriu",
      text: "Você acompanha a visualização e identifica quais oportunidades estão quentes.",
    },
    {
      title: "Faça o follow-up",
      text: "Retome a conversa no momento certo, com contexto e sem parecer cobrança.",
    },
    {
      title: "Receba o aceite",
      text: "O cliente aprova online e segue para o próximo passo dentro do fluxo.",
    },
  ];
  const testimonials = [
    {
      name: "Ana Clara R.",
      role: "Designer — São Paulo",
      quote:
        "Eu sabia que o cliente tinha aberto e consegui chamar enquanto ele ainda estava analisando. A conversa já começou com contexto.",
    },
    {
      name: "Rafael M.",
      role: "Consultor de marketing — BH",
      quote:
        "Parei de mandar mensagem perguntando se a pessoa tinha visto. Agora eu acompanho a proposta e faço follow-up quando existe sinal de interesse.",
    },
    {
      name: "Juliana F.",
      role: "Nutricionista — Curitiba",
      quote:
        "Agora sei quais propostas estão quentes e quais clientes preciso acompanhar. Isso tirou muita ansiedade da minha rotina comercial.",
    },
  ];

  const faqs = [
    [
      "Preciso instalar algum app?",
      "Não. O FechaPro funciona pelo navegador, no celular ou computador. Seu cliente também acessa pelo link, sem cadastro obrigatório.",
    ],
    [
      "Posso usar pelo celular?",
      "Sim. Você pode acessar o FechaPro pelo navegador do celular ou computador. Seu cliente também abre a proposta pelo celular.",
    ],
    [
      "Uma proposta fechada já paga o plano?",
      "Para a maioria dos profissionais, sim. Se o seu ticket médio é R$ 500 e você fecha 1 proposta a mais por causa do FechaPro, o plano Essencial se pagou em 24 horas. No plano Profissional, 2 projetos a mais já cobrem o investimento inteiro.",
    ],
    [
      "O acesso é realmente vitalício?",
      "Sim. Até 30/06/2026, você realiza um pagamento único e pode continuar utilizando os recursos incluídos no plano adquirido, sem cobrança mensal. A partir de 01/07, novos clientes voltarão aos planos mensais. Taxas externas de gateway, domínio, hospedagem ou serviços extras, quando aplicáveis, seguem as regras do provedor ou da contratação adicional.",
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
      "Quantas propostas posso criar?",
      "Depende do plano escolhido. O Essencial inclui 50 propostas por mês, Profissional e Completo com site incluem 200 propostas por mês, e Estrutura inclui propostas ilimitadas.",
    ],
    [
      "Como sei que o cliente visualizou?",
      "Quando o cliente abre ou acessa o link da proposta, o FechaPro registra a visualização no painel. O sistema acompanha o acesso à proposta pelo link; ele não lê mensagens privadas do WhatsApp.",
    ],
    [
      "Posso enviar pelo WhatsApp?",
      "Sim. Você cria a proposta no FechaPro e envia o link pelo WhatsApp, Instagram, e-mail ou qualquer canal de atendimento.",
    ],
    [
      "Posso alterar minha proposta depois?",
      "Sim. Você pode ajustar informações da proposta pelo painel. Se a proposta já foi enviada, recomendamos avisar o cliente quando houver mudança importante de escopo, prazo ou valor.",
    ],
    [
      "Tem suporte?",
      "Sim. O WhatsApp fica disponível como suporte para dúvidas, mas não é etapa obrigatória para comprar. Os botões dos planos levam direto ao checkout.",
    ],
    [
      "Existe garantia?",
      "Você pode testar o FechaPro por 7 dias. Caso perceba que a plataforma não atende ao que foi apresentado, solicite o cancelamento dentro do prazo previsto nos termos.",
    ],
    [
      "O site está incluso em qual plano?",
      "O mini site profissional está incluso nos planos Completo com site e Estrutura. Essencial e Profissional focam na criação e acompanhamento das propostas.",
    ],
    [
      "Posso parcelar?",
      "O checkout informa as formas disponíveis no momento da compra, incluindo Pix, cartão e opções de parcelamento quando oferecidas pelo provedor de pagamento.",
    ],
    [
      "O pagamento pelo link é seguro?",
      "Sim. O checkout usa Mercado Pago certificado ou PIX direto configurado por você. O FechaPro não processa nem armazena dados de cartão.",
    ],
    [
      "Posso cancelar o plano mensal?",
      "Sim, sem multa. O teste grátis não tem cobrança automática. Se comprar um plano pago, você escolhe o caminho de pagamento no checkout.",
    ],
    [
      "O que acontece depois que eu compro?",
      "Após a confirmação do pagamento, você recebe o acesso ao FechaPro e as instruções para configurar sua conta. Nos planos com implantação, nossa equipe entra em contato para organizar sua marca, serviços e primeira proposta.",
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
          "Plataforma para criar propostas profissionais, acompanhar visualizações, fazer follow-up no momento certo e fechar com aceite online.",
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
            Condição final do acesso vitalício termina em {OFERTA.encerra}. Depois, os planos voltam a ser mensais.
          </span>
          <a href="#planos-pagos" className="underline decoration-2 underline-offset-2 hover:text-[#3d2700]">
            Garantir acesso vitalício
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
              <a href="#planos">Planos</a>
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
                href="/cadastro?plan=free"
              >
                Testar grátis
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
                {["Proposta profissional", "Aviso de visualização", "Aceite online"].map((tag) => (
                  <span
                    className="rounded-full border border-green-700/20 bg-green-50 px-3 py-1 text-xs font-black text-green-800"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-6xl">
                Saiba quando seu cliente visualizou a proposta.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                Crie propostas profissionais, acompanhe cada visualização e faça o follow-up no momento certo.
              </p>
              <p className="mt-4 text-base font-black text-green-800">
                Até {OFERTA.encerra}: pagamento único, acesso vitalício e valores especiais. Depois, o FechaPro volta aos planos mensais.
              </p>
              <p className="mt-2 text-sm font-bold text-slate-700">
                Até 30/06: pagamento único e acesso vitalício. Depois, os planos voltam a ser mensais.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-green-700 px-6 font-black text-white shadow-lg shadow-green-900/15"
                  href="#planos-pagos"
                >
                  Ver planos vitalícios
                </a>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-green-700 px-6 font-black text-green-800 hover:bg-green-50"
                  href="/cadastro?plan=free"
                >
                  Testar grátis antes
                </a>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-600">Sem cartão. Crie sua conta e envie até {OFERTA.propostasGratis} propostas para testar.</p>
              <div className="mt-5 rounded-lg border border-green-700/20 bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase text-green-700">Oferta vitalícia termina em</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {[
                    ["dias", campaignTimeLeft.days],
                    ["horas", campaignTimeLeft.hours],
                    ["minutos", campaignTimeLeft.minutes],
                  ].map(([label, value]) => (
                    <div className="rounded-lg bg-green-50 px-3 py-2" key={label}>
                      <strong className="block text-2xl font-black text-green-900">
                        {String(value).padStart(2, "0")}
                      </strong>
                      <span className="text-[11px] font-black uppercase text-green-700">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ["Enviar", "Proposta com link profissional para abrir no celular"],
                  ["Acompanhar", "Aviso de visualização e histórico de cada cliente"],
                  ["Fechar", "Follow-up com contexto, aceite online e pagamento"],
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
                  <strong>Painel de acompanhamento</strong>
                  <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-black text-slate-950">
                    Agora
                  </span>
                </div>
                <div className="mt-5 grid gap-4 rounded-lg bg-white p-5 text-slate-950">
                  <div className="rounded-lg border-2 border-green-700/40 bg-green-100 p-5 shadow-lg shadow-green-900/10">
                    <div className="flex items-start gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green-700 text-white">
                        <Eye size={24} />
                      </span>
                      <div>
                        <p className="text-2xl font-black leading-tight text-green-950">Marcos visualizou sua proposta agora.</p>
                        <p className="mt-2 text-sm font-bold text-green-900">Proposta: Serviço de fotografia</p>
                        <p className="text-sm font-bold text-green-800">Visualizada hoje às 14h32</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 rounded-lg bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase text-green-700">Próxima ação sugerida</p>
                        <h2 className="text-2xl font-black">Fazer follow-up agora</h2>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                        Cliente quente
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                      "Vi que você conseguiu acessar a proposta. Ficou alguma dúvida sobre o serviço ou sobre a condição apresentada?"
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <span className="rounded-lg bg-green-100 p-3 text-sm font-black text-green-800">Visualizada</span>
                      <span className="rounded-lg bg-blue-50 p-3 text-sm font-black text-blue-800">WhatsApp pronto</span>
                      <span className="rounded-lg bg-amber-50 p-3 text-sm font-black text-amber-800">Aceite pendente</span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {["Ana ainda não abriu", "Marcos visualizou agora", "Clara aceitou online"].map((item) => (
                      <div className="flex items-center justify-between rounded-lg border border-black/10 p-3 text-sm font-bold" key={item}>
                        <span>{item}</span>
                        <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
                      </div>
                    ))}
                  </div>
                  <button
                    className="min-h-12 rounded-lg bg-green-700 font-black text-white"
                    type="button"
                  >
                    Abrir conversa no WhatsApp
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </section>

        {/* Product demo */}
        <section className="px-4 py-16">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase text-green-700">Demonstração do produto</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                Veja o fluxo antes de escolher o plano.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                A compra direta funciona melhor quando você entende exatamente como o FechaPro entra na rotina:
                criar, enviar, acompanhar, fazer follow-up e receber o aceite.
              </p>
              <div className="mt-6 grid gap-2">
                {[
                  "Criação da proposta",
                  "Envio do link pelo WhatsApp",
                  "Proposta aberta pelo cliente",
                  "Registro da visualização",
                  "Aceite e painel de acompanhamento",
                ].map((item) => (
                  <div className="flex items-center gap-3 rounded-lg bg-white p-3 text-sm font-black shadow-sm" key={item}>
                    <CheckCircle2 className="shrink-0 text-green-700" size={18} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-black/10 bg-slate-950 p-4 shadow-2xl shadow-slate-950/10">
              <div className="overflow-hidden rounded-lg bg-white">
                <Image
                  alt="Exemplo de proposta profissional criada no FechaPro"
                  src="/landing/hero-proposta.png"
                  width={900}
                  height={620}
                  className="h-auto w-full"
                />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <span className="rounded-lg bg-green-500/15 p-3 text-center text-xs font-black text-green-200">
                  Link enviado
                </span>
                <span className="rounded-lg bg-green-500/15 p-3 text-center text-xs font-black text-green-200">
                  Visualização registrada
                </span>
                <span className="rounded-lg bg-green-500/15 p-3 text-center text-xs font-black text-green-200">
                  Follow-up no momento certo
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase text-green-700">Orçamento x proposta</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              O cliente decide melhor quando entende valor, não só preço.
            </h2>
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {comparison.map((group) => (
                <article
                  className={`rounded-lg border p-6 shadow-sm ${
                    group.tone === "success"
                      ? "border-green-700 bg-slate-950 text-white"
                      : "border-rose-200 bg-white text-slate-950"
                  }`}
                  key={group.title}
                >
                  <h3 className="text-2xl font-black">{group.title}</h3>
                  <ul className="mt-6 grid gap-3">
                    {group.items.map((item) => (
                      <li className="flex gap-3 text-sm font-bold" key={item}>
                        {group.tone === "success" ? (
                          <CheckCircle2 className="mt-0.5 shrink-0 text-green-400" size={18} />
                        ) : (
                          <XCircle className="mt-0.5 shrink-0 text-rose-500" size={18} />
                        )}
                        <span className={group.tone === "success" ? "text-white/85" : "text-slate-700"}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

          </div>
        </section>

        {/* Problems */}
        <section className="bg-[#0d1409] px-4 py-16 text-white">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase text-rose-400">O que acontece hoje</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Você envia a proposta e depois fica no escuro?
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">
              O problema não é apenas enviar a proposta. É não saber o que aconteceu depois.
            </p>
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

        {/* How it works */}
        <section id="como-funciona" className="bg-[#0d1409] px-4 py-20 text-white">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase text-green-300">Como funciona</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              Entenda em poucos segundos como o FechaPro funciona.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-5">
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
            <p className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm font-bold leading-6 text-white/75">
              Você não precisa instalar nada. O FechaPro funciona online pelo celular ou computador.
            </p>
            <div className="mt-10 grid gap-6 rounded-lg border border-white/10 bg-white/5 p-6 lg:grid-cols-2 lg:items-center">
              <div>
                <h3 className="text-2xl font-black">Você para de trabalhar no escuro.</h3>
                <p className="mt-3 leading-7 text-white/70">
                  Cada movimentação entra no histórico da proposta. Você passa a tomar decisões com base no comportamento do cliente.
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  "Marcos visualizou — há 3 minutos",
                  "Cliente clicou no WhatsApp",
                  "Follow-up feito no momento certo",
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

        {/* Trust before pricing */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-7xl rounded-xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase text-green-700">Antes de escolher o plano</p>
                <h2 className="mt-2 text-2xl font-black leading-tight sm:text-4xl">
                  Produto real, checkout direto e suporte disponível.
                </h2>
                <p className="mt-3 leading-7 text-slate-700">
                  O FechaPro já mostra o fluxo principal antes da compra: proposta enviada por link,
                  visualização registrada e follow-up com contexto. Você escolhe o plano e segue para o checkout.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Tela do produto", "Proposta e painel aparecem na própria página."],
                    ["Depoimentos específicos", "Relatos focados em visualização e follow-up."],
                    ["Compra segura", "Pix ou cartão conforme opções do checkout."],
                    ["Empresa identificada", "Termos, privacidade e suporte no rodapé."],
                  ].map(([title, text]) => (
                    <div className="rounded-lg bg-slate-50 p-4" key={title}>
                      <CheckCircle2 className="text-green-700" size={20} />
                      <strong className="mt-3 block text-sm">{title}</strong>
                      <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-lg border-2 border-green-700/30 bg-green-50 p-4">
                  <p className="text-xs font-black uppercase text-green-700">Visualização registrada</p>
                  <p className="mt-2 text-xl font-black text-green-950">Marcos visualizou sua proposta agora.</p>
                  <p className="mt-1 text-sm font-bold text-green-800">Sinal claro para fazer follow-up no momento certo.</p>
                </div>
                <div className="rounded-lg border border-black/10 bg-white p-4">
                  <p className="text-xs font-black uppercase text-slate-500">Depois do pagamento</p>
                  <div className="mt-4 grid gap-3">
                    {[
                      ["Pagamento aprovado", "Checkout confirmado com Pix ou cartão"],
                      ["Acesso enviado", "Instruções chegam no e-mail informado"],
                      ["Configuração inicial", "Marca, serviços e primeira proposta no painel"],
                    ].map(([title, text]) => (
                      <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3" key={title}>
                        <CheckCircle2 className="mt-0.5 shrink-0 text-green-700" size={18} />
                        <div>
                          <strong className="block text-sm">{title}</strong>
                          <p className="mt-1 text-xs font-bold leading-5 text-slate-600">{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing — monthly anchor + founder offer */}
        <section id="planos" className="bg-[#f5f2ec] px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-xl border-2 border-green-700 bg-white p-6 shadow-xl shadow-green-950/10 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase text-green-700">Condição final do acesso vitalício</p>
                  <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                    O vitalício termina em {OFERTA.encerra}.
                  </h2>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
                    Esta é a última oportunidade de garantir o FechaPro com pagamento único e valores especiais.
                    A partir de 01/07, novos clientes entrarão nos planos mensais.
                  </p>
                  <p className="mt-4 font-black text-green-800">
                    Até {OFERTA.encerra}, pague uma vez e use o FechaPro sem mensalidade. Depois, os planos voltam a ser mensais.
                  </p>
                </div>
                <div className="rounded-lg bg-slate-950 p-5 text-white">
                  <p className="text-xs font-black uppercase text-green-300">Oferta vitalícia termina em</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      ["dias", campaignTimeLeft.days],
                      ["horas", campaignTimeLeft.hours],
                      ["minutos", campaignTimeLeft.minutes],
                    ].map(([label, value]) => (
                      <div className="rounded-lg bg-white/10 px-3 py-3" key={label}>
                        <strong className="block text-2xl font-black text-white">
                          {String(value).padStart(2, "0")}
                        </strong>
                        <span className="text-[11px] font-black uppercase text-white/60">{label}</span>
                      </div>
                    ))}
                  </div>
                  <ul className="mt-5 grid gap-2 text-sm font-bold text-white/80">
                    {[
                      "Pague uma vez",
                      "Use sem mensalidade",
                      "Mantenha seu acesso",
                      `Escolha o plano ideal até ${OFERTA.encerra}`,
                    ].map((item) => (
                      <li className="flex gap-2" key={item}>
                        <CheckCircle2 className="mt-0.5 shrink-0 text-green-300" size={16} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs font-bold text-white/45">
                    Encerra em {OFERTA.encerraCompleto}, horário de Brasília.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <article className="rounded-xl border-2 border-green-700 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-black uppercase text-green-700">Teste grátis</p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  Crie sua conta e envie {OFERTA.propostasGratis} propostas sem pagar.
                </h2>
                <p className="mt-3 leading-7 text-slate-700">
                  Ideal para testar o ciclo completo: montar a proposta, enviar o link e acompanhar o que acontece depois.
                </p>
                <a
                  className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-green-700 px-6 font-black text-white shadow-md shadow-green-900/20 hover:bg-green-800"
                  href="/cadastro?plan=free"
                >
                  Criar minha proposta grátis
                </a>
              </article>

              <article className="rounded-xl border border-black/10 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:p-8">
                <p className="text-xs font-black uppercase text-green-300">Vitalício até {OFERTA.encerra}</p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  Até {OFERTA.encerra}: pague uma vez e use sem mensalidade.
                </h2>
                <p className="mt-3 leading-7 text-white/70">
                  A partir de 01/07, o FechaPro volta aos planos mensais para novos clientes.
                </p>
                <a
                  className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 font-black text-slate-950 hover:bg-green-50"
                  href="#planos-pagos"
                >
                  Ver planos vitalícios
                </a>
              </article>
            </div>

            {/* Founder offer headline */}
            <div id="planos-pagos" className="mt-14 scroll-mt-24 text-center">
              <p className="text-xs font-black uppercase text-green-700">Últimos dias de vitalício</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
                Uma venda pode pagar seu acesso. Depois, você continua usando sem mensalidade.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Até {OFERTA.encerra}, pague uma vez e use o FechaPro sem mensalidade. Depois, os planos voltam a ser mensais.
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
                      Vitalício até {OFERTA.encerra}
                    </span>
                  </div>

                  <p
                    className={`mt-4 text-xs font-black uppercase ${
                      plan.featured ? "text-green-300" : "text-slate-500"
                    }`}
                  >
                    {plan.name}
                  </p>

                  <h3 className="mt-2 text-2xl font-black leading-tight">
                    {plan.price} — {plan.quickFit}
                  </h3>
                  <p
                    className={`mt-2 text-sm font-bold ${
                      plan.featured ? "text-white/55" : "text-slate-500"
                    }`}
                  >
                    De <span className="line-through">{plan.originalPrice}</span> por {plan.price} à vista ou parcelado no cartão
                  </p>
                  <p
                    className={`mt-2 text-sm font-black ${
                      plan.featured ? "text-green-300" : "text-green-700"
                    }`}
                  >
                    Pagamento único • acesso vitalício
                  </p>

                  {plan.featured && (
                    <p className="mt-3 rounded-lg bg-green-500/15 p-3 text-sm font-black text-green-200">
                      Melhor custo-benefício para quem quer começar com implantação e suporte.
                    </p>
                  )}

                  <p
                    className={`mt-3 text-xs font-bold leading-5 ${
                      plan.featured ? "text-white/60" : "text-slate-500"
                    }`}
                  >
                    Para quem: {plan.recommendation}
                  </p>

                  <p
                    className={`mt-1 text-xs font-black ${
                      plan.featured ? "text-green-300" : "text-green-700"
                    }`}
                  >
                    Economize {plan.savings} no 1º ano · se paga em {plan.paybackMonths} meses
                  </p>

                  <ul className="mt-5 flex-1 grid gap-2">
                    {plan.items.slice(0, 5).map((item) => (
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

                  <details
                    className={`mt-4 rounded-lg border p-3 text-sm ${
                      plan.featured
                        ? "border-white/10 bg-white/5 text-white/75"
                        : "border-black/10 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <summary className="cursor-pointer font-black">
                      Ver tudo que está incluso
                    </summary>
                    <p className="mt-3 leading-6">{plan.description}</p>
                    <ul className="mt-3 grid gap-2">
                      {plan.items.slice(5).map((item) => (
                        <li className="flex gap-2 font-bold" key={item}>
                          <CheckCircle2
                            className={`mt-0.5 shrink-0 ${
                              plan.featured ? "text-green-400" : "text-green-700"
                            }`}
                            size={14}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs font-black uppercase">Não está incluso</p>
                    <ul className="mt-2 grid gap-2">
                      {plan.notIncluded.map((item) => (
                        <li className="flex gap-2 font-bold" key={item}>
                          <XCircle
                            className={`mt-0.5 shrink-0 ${
                              plan.featured ? "text-white/35" : "text-slate-400"
                            }`}
                            size={14}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </details>

                  <a
                    className={`mt-6 grid min-h-12 place-items-center rounded-xl px-4 text-center font-black shadow-md ${
                      plan.featured
                        ? "bg-green-500 text-slate-950 shadow-green-900/30 hover:bg-green-400"
                        : "bg-green-700 text-white shadow-green-900/20 hover:bg-green-800"
                    }`}
                    href={plan.href}
                    onClick={() =>
                      trackPixel("AddToCart", {
                        value: Number(plan.price.replace(/[^\d]/g, "")) || undefined,
                        currency: "BRL",
                        content_ids: [plan.code],
                        content_name: plan.name,
                        content_type: "product",
                      })
                    }
                  >
                    {plan.cta}
                  </a>
                  <p
                    className={`mt-2 text-center text-[11px] font-bold ${
                      plan.featured ? "text-white/55" : "text-slate-500"
                    }`}
                  >
                    Pix ou cartão • pagamento seguro • acesso após confirmação
                  </p>
                  <a
                    className={`mt-3 text-center text-xs font-black underline underline-offset-4 ${
                      plan.featured ? "text-white/55 hover:text-white" : "text-slate-500 hover:text-slate-800"
                    }`}
                    href="/interesse"
                  >
                    Ainda está em dúvida? Fale com nossa equipe
                  </a>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-green-700/20 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase text-green-700">Relato de uso</p>
              <blockquote className="mt-3 text-xl font-black leading-8 text-slate-950">
                "Eu sabia que o cliente tinha aberto e consegui chamar enquanto ele ainda estava analisando. A conversa já começou com contexto."
              </blockquote>
              <p className="mt-4 text-sm font-bold text-slate-600">Ana Clara R. — Designer, São Paulo</p>
            </div>

            <div className="mt-8 grid gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm md:grid-cols-4">
              {[
                ["Checkout seguro", "Pagamento por Pix ou cartão, conforme opções exibidas no checkout."],
                ["Compra direta", "Escolha o plano e siga para o pagamento sem depender do WhatsApp."],
                ["Suporte disponível", "Use o atendimento apenas se tiver dúvida antes ou depois da compra."],
                ["Termos claros", "Termos de uso e política de privacidade disponíveis no rodapé."],
              ].map(([title, text]) => (
                <div className="rounded-lg bg-slate-50 p-4" key={title}>
                  <CheckCircle2 className="text-green-700" size={20} />
                  <strong className="mt-3 block text-sm">{title}</strong>
                  <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{text}</p>
                </div>
              ))}
            </div>

            {/* ROI callout */}
            <div className="mt-8 rounded-xl bg-slate-950 p-6 text-center text-white sm:p-8">
              <p className="text-xl font-black">
                "Uma proposta recuperada já pode pagar o plano inteiro."
              </p>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/65">
                Se você fechar um projeto de R$ 500 porque percebeu a visualização e fez o follow-up na hora certa, o plano Essencial se paga em 24 horas. No Profissional, 2 projetos a mais já cobrem o investimento inteiro.
              </p>
              <a
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-green-600 px-8 font-black text-white hover:bg-green-500"
                href="#planos-pagos"
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
                O que acontece depois da compra?
              </h2>
              <p className="mt-3 leading-7 text-white/70">
                Após a confirmação do pagamento, você recebe o acesso ao FechaPro e as instruções para configurar sua conta.
                Nos planos com implantação, nossa equipe entra em contato para organizar sua marca, serviços e primeira proposta.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                [
                  "1. Você recebe o acesso",
                  "Após a confirmação do pagamento, enviamos o acesso e as instruções para o e-mail informado no checkout.",
                ],
                [
                  "2. Cria sua senha",
                  "Você define sua senha e entra no painel do FechaPro pelo navegador.",
                ],
                [
                  "3. Configura sua marca",
                  "Adicione logo, cores, WhatsApp e informações comerciais para deixar a proposta com a sua identidade.",
                ],
                [
                  "4. Cadastra o primeiro serviço",
                  "Inclua descrição, valor, prazo, condições e tudo que o cliente precisa ver antes de decidir.",
                ],
                [
                  "5. Envia a primeira proposta",
                  "Crie a proposta, envie o link e acompanhe quando o cliente visualizar.",
                ],
                [
                  "Planos com implantação",
                  "Nossa equipe entra em contato para iniciar a configuração incluída no plano adquirido.",
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

        {/* Testimonials */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase text-green-700">Quem já usa</p>
            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
              O que muda quando você sabe que a proposta foi aberta.
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

        {/* Features */}
        <section id="funcionalidades" className="px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase text-green-700">Principais recursos</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-5xl">
              Quatro pilares para enviar proposta, acompanhar interesse e fechar com menos atrito.
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="mt-8 rounded-lg border border-black/10 bg-white p-5">
              <p className="text-xs font-black uppercase text-slate-500">E ainda tem mais</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {extras.map((item) => (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700" key={item}>{item}</span>
                ))}
              </div>
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
              Últimos dias de vitalício
            </span>
            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-5xl">
              Garanta seu acesso vitalício antes da volta da mensalidade.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/75">
              Crie propostas profissionais, saiba quando o cliente visualizou e use o FechaPro sem cobrança mensal até a campanha encerrar.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                className="inline-flex min-h-14 items-center justify-center rounded-xl bg-white px-8 text-base font-black text-green-900 shadow-xl shadow-green-950/40 transition hover:-translate-y-0.5 hover:bg-green-50"
                href="#planos-pagos"
              >
                Escolher meu plano vitalício
              </a>
              <a
                className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/20 px-8 text-base font-black text-white transition hover:bg-white/10"
                href="/cadastro?plan=free"
              >
                Testar grátis antes
              </a>
            </div>
            <p className="mt-4 text-sm text-white/45">
              Condição disponível até 30/06 às 23h59 · Pagamento único · Mercado Pago ou PIX
            </p>
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
