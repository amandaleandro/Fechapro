"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle2, CreditCard, Eye, FileText, HelpCircle, MessageCircle, MousePointerClick, ShieldCheck, Sparkles, XCircle, Zap } from "lucide-react";
import { trackConversion } from "@/lib/conversion-client";
import { trackPixel } from "@/lib/meta-pixel";
import type { PlanCode } from "@/lib/plans";

type LandingPlan = {
  code: PlanCode;
  name: string;
  price: string;
  suffix: string;
  featured?: boolean;
  href: string;
  items: string[];
};

const plans: LandingPlan[] = [
  {
    code: "essential",
    name: "Essencial",
    price: "19,97",
    suffix: "/mes",
    href: "/checkout/cadastro/essential",
    items: ["5 propostas por mes", "Link da proposta", "PDF simples"],
  },
  {
    code: "professional",
    name: "Profissional",
    price: "49,97",
    suffix: "/mes",
    featured: true,
    href: "/checkout/cadastro/professional",
    items: ["30 propostas por mes", "Botao de aceite", "Aviso de visualizacao", "PDF sem marca"],
  },
  {
    code: "premium",
    name: "Premium",
    price: "99,97",
    suffix: "/mes",
    href: "/checkout/cadastro/premium",
    items: ["Propostas ilimitadas", "IA para montar proposta", "Link de pagamento", "Suporte prioritario"],
  },
];

const faqs = [
  ["Preciso ter site?", "Nao. O FechaPro foi feito para quem vende pelo WhatsApp e precisa enviar uma proposta profissional em link."],
  ["Tem teste gratis?", "Sim. Voce pode testar por 3 dias antes de decidir o plano ideal para seu volume de propostas."],
  ["O cliente precisa instalar algo?", "Nao. Ele abre o link da proposta no celular, visualiza tudo e pode aceitar pelo proprio navegador."],
  ["O FechaPro garante venda?", "Nao prometemos venda garantida. O produto aumenta controle, apresentacao e timing de follow-up para melhorar suas chances."],
];

function trackCta(context: string, plan?: PlanCode) {
  trackConversion({
    event: "primary_cta_clicked",
    plan,
    campaign: "landing_saas_mensal",
    source: "landing",
    context,
  });
}

function trackPlan(plan: LandingPlan) {
  trackCta("plan_card", plan.code);
  trackPixel("AddToCart", {
    value: Number(plan.price.replace(",", ".")),
    currency: "BRL",
    content_ids: [plan.code],
    content_name: plan.name,
    content_type: "product",
  });
}

function LogoMark() {
  return (
    <a className="inline-flex items-center gap-2" href="#top" aria-label="FechaPro">
      <Image alt="FechaPro" src="/brand/logofechapro.png" width={132} height={36} className="h-8 w-auto brightness-0 invert" priority />
    </a>
  );
}

function ProposalPhone() {
  return (
    <div className="fp-lp-phone">
      <div className="fp-lp-phone-top">
        <span>Sua Proposta</span>
        <strong><Eye size={13} /> Visualizada ha 2 min</strong>
      </div>
      <h2>Instalacao de<br />Ar Condicionado</h2>
      <p>Proposta #4587 · Enviada em 23/05/2026</p>
      <span className="fp-lp-total-label">Valor total</span>
      <strong className="fp-lp-total">R$ 1.380,00</strong>
      <div className="fp-lp-divider" />
      <span className="fp-lp-list-title">O que esta incluso</span>
      {["Instalacao completa", "Suporte e materiais", "Teste e regulagem", "Garantia de 90 dias"].map((item) => (
        <span className="fp-lp-check" key={item}><CheckCircle2 size={15} /> {item}</span>
      ))}
      <button type="button">Aceitar proposta <CheckCircle2 size={17} /></button>
      <small><ShieldCheck size={13} /> Proposta segura e criptografada</small>
    </div>
  );
}

function MiniChart() {
  return (
    <div className="fp-lp-chart">
      <span>Propostas visualizadas</span>
      <strong>+28%</strong>
      <small>vs ultimos 30 dias</small>
      <svg viewBox="0 0 170 60" role="img" aria-label="Grafico de propostas visualizadas">
        <polyline points="4,48 18,42 30,36 45,39 58,28 72,33 88,24 104,22 119,16 136,18 151,10 166,13" fill="none" stroke="#3b82f6" strokeWidth="3" />
        <polyline points="4,48 18,42 30,36 45,39 58,28 72,33 88,24 104,22 119,16 136,18 151,10 166,13" fill="none" stroke="#93c5fd" strokeWidth="1" />
      </svg>
    </div>
  );
}

function WithoutWith() {
  return (
    <section className="fp-lp-section fp-lp-comparison" id="exemplo">
      <div>
        <h2>O problema nem sempre e o preco.<br /><span>E a forma como sua proposta chega.</span></h2>
      </div>
      <div className="fp-lp-chat">
        <span>Sem FechaPro</span>
        <div className="fp-lp-whatsapp">
          <strong>Segue o orcamento:</strong>
          <p>Instalacao de ar condicionado</p>
          <p>R$ 1.380,00</p>
          <p>Inclui instalacao, materiais e garantia.</p>
        </div>
        <div className="fp-lp-reply">Ok, vou ver aqui e te falo.</div>
        {["So preco", "Sem contexto", "Facil de ser ignorado", "Baixa chance de resposta"].map((item) => (
          <p className="fp-lp-bad" key={item}><XCircle size={14} /> {item}</p>
        ))}
      </div>
      <ArrowRight className="fp-lp-arrow" size={42} />
      <div className="fp-lp-result">
        <span>Com FechaPro</span>
        <div className="fp-lp-result-card">
          <div className="fp-lp-thumb" />
          <div>
            <strong>Instalacao de Ar Condicionado</strong>
            <small>Proposta profissional</small>
            <em>R$ 1.380,00</em>
          </div>
        </div>
        <div className="fp-lp-tags">
          <span><Eye size={14} /> Proposta visualizada</span>
          <span><BadgeCheck size={14} /> Aceite digital</span>
        </div>
        <strong className="fp-lp-win">Muito mais chance de fechar</strong>
        {["Proposta profissional com valor percebido", "Cliente entende antes de comparar preco", "Aviso de visualizacao em tempo real", "Mais confianca, mais resposta, mais vendas"].map((item) => (
          <p className="fp-lp-good" key={item}><CheckCircle2 size={14} /> {item}</p>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["1. Crie", "Monte sua proposta em minutos"],
    ["2. Envie", "Mande o link no WhatsApp"],
    ["3. Feche", "Receba aceite com mais facilidade"],
  ];
  return (
    <section className="fp-lp-section" id="como-funciona">
      <p className="fp-lp-kicker">Como funciona</p>
      <div className="fp-lp-steps">
        {steps.map(([title, text], index) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
            {index === 0 ? (
              <div className="fp-lp-stepbox">
                <span>Nova proposta</span>
                <small>Titulo do servico</small>
                <strong>Instalacao de Ar Condicionado</strong>
                <small>Itens inclusos</small>
                <em>Instalacao completa</em>
                <em>Materiais</em>
                <em>Teste e regulagem</em>
              </div>
            ) : index === 1 ? (
              <div className="fp-lp-stepbox">
                <span>Link da proposta</span>
                <strong>fechapro.com/p/4587</strong>
                <button type="button">Copiar link</button>
                <em>WhatsApp</em>
              </div>
            ) : (
              <div className="fp-lp-stepbox">
                <strong className="fp-lp-accepted"><CheckCircle2 size={24} /> Proposta aceita!</strong>
                <small>em 24/05/2026 as 11:23</small>
                <em>Enviar contrato</em>
                <em>Gerar cobranca</em>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export function AuthScreen() {
  return <LandingPage />;
}

export default function LandingPage() {
  return (
    <main className="fp-lp" id="top">
      <header className="fp-lp-header">
        <LogoMark />
        <nav>
          <a href="#como-funciona">Como funciona</a>
          <a href="#planos">Planos</a>
          <a href="#faq">FAQ</a>
        </nav>
        <Link className="fp-lp-header-cta" href="/checkout/cadastro/professional" onClick={() => trackCta("header", "professional")}>
          Testar 3 dias gratis
        </Link>
      </header>

      <section className="fp-lp-hero">
        <div className="fp-lp-hero-copy">
          <h1>Voce manda orcamento.<br />O cliente visualiza.<br /><span>E some.</span></h1>
          <p>
            O FechaPro transforma seu orcamento do WhatsApp em uma proposta profissional com link, aceite e aviso de visualizacao. Seu servico para de parecer improviso e comeca a vender com cara de empresa.
          </p>
          <div className="fp-lp-actions">
            <Link href="/checkout/cadastro/professional" onClick={() => trackCta("hero_primary", "professional")}>Testar 3 dias gratis <ArrowRight size={18} /></Link>
            <a href="#exemplo" onClick={() => trackCta("hero_example")}>Ver exemplo <MousePointerClick size={16} /></a>
          </div>
          <div className="fp-lp-trust">
            <span><CheckCircle2 size={16} /> Sem site</span>
            <span><CheckCircle2 size={16} /> Sem complicacao</span>
            <span><CheckCircle2 size={16} /> A partir de R$19,97/mes</span>
          </div>
        </div>
        <div className="fp-lp-hero-visual">
          <ProposalPhone />
          <MiniChart />
          <div className="fp-lp-radar"><span /></div>
          <div className="fp-lp-conversion"><small>Conversao</small><strong>+37%</strong><span>com FechaPro</span></div>
        </div>
      </section>

      <section className="fp-lp-benefits">
        <article><Sparkles size={34} /><div><strong>Mais profissional</strong><p>Pare de mandar orcamento solto no WhatsApp.</p></div></article>
        <article><BadgeCheck size={34} /><div><strong>Mais valor percebido</strong><p>Seu cliente entende melhor antes de comparar so preco.</p></div></article>
        <article><Zap size={34} /><div><strong>Follow-up na hora certa</strong><p>Saiba quando o cliente visualizou e retome na hora certa.</p></div></article>
      </section>

      <WithoutWith />
      <HowItWorks />

      <section className="fp-lp-plans" id="planos">
        <p className="fp-lp-kicker">Planos</p>
        <h2>Escolha seu plano</h2>
        <div className="fp-lp-plan-grid">
          {plans.map((plan) => (
            <article className={plan.featured ? "featured" : ""} key={plan.code}>
              {plan.featured ? <span className="fp-lp-badge">Mais escolhido</span> : null}
              <h3>{plan.name}</h3>
              <strong><small>R$</small> {plan.price} <em>{plan.suffix}</em></strong>
              <ul>
                {plan.items.map((item) => <li key={item}><CheckCircle2 size={16} /> {item}</li>)}
              </ul>
              <Link href={plan.href} onClick={() => trackPlan(plan)}>Escolher plano</Link>
            </article>
          ))}
        </div>
        <div className="fp-lp-plan-notes">
          <span><ShieldCheck size={18} /> Teste gratis por 3 dias</span>
          <span><CreditCard size={18} /> Cobranca por cartao ou Pix Automatico</span>
          <span><XCircle size={18} /> Cancelamento facil</span>
        </div>
      </section>

      <section className="fp-lp-final">
        <div className="fp-lp-final-art"><FileText size={92} /></div>
        <div>
          <h2>Pare de mandar preco.<br /><span>Comece a vender melhor.</span></h2>
          <p>Crie sua primeira proposta hoje mesmo.</p>
        </div>
        <Link href="/checkout/cadastro/professional" onClick={() => trackCta("final_cta", "professional")}>Comecar agora <ArrowRight size={18} /></Link>
      </section>

      <section className="fp-lp-faq" id="faq">
        <p className="fp-lp-kicker">FAQ</p>
        <h2>Duvidas comuns</h2>
        <div>
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary><HelpCircle size={18} /> {question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="fp-lp-footer">
        <LogoMark />
        <span>© 2026 FechaPro. Todos os direitos reservados.</span>
        <nav>
          <a href="/privacidade">Privacidade</a>
          <a href="/termos">Termos</a>
          <a href="/login">Entrar</a>
        </nav>
      </footer>
    </main>
  );
}
