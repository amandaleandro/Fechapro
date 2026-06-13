import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import { canUseProposalPresentation } from "@/lib/billing-access";
import { prisma } from "@/lib/prisma";
import { SlidesPrintButton } from "./print-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export default async function ProposalSlidesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    include: { user: { include: { brandProfile: true, subscription: true } } },
  });

  if (!proposal || !canUseProposalPresentation(proposal.user.subscription)) notFound();

  const [portfolio, testimonials, serviceImage] = await Promise.all([
    findSlidePortfolio(proposal.userId, proposal.publicSlug),
    prisma.testimonialAsset.findMany({
      where: { userId: proposal.userId },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    findSlideServiceImage(proposal.userId, proposal.serviceName),
  ]);

  const brand = proposal.user.brandProfile;
  const brandName = brand?.businessName || proposal.user.name;
  const notes = proposal.notes?.trim();
  const included = proposal.included.length ? proposal.included : ["Escopo alinhado com o cliente."];
  const slideImages = uniqueSlideImages(serviceImage, portfolio).slice(0, 4);
  const heroPhoto = slideImages[0]?.imageUrl;
  const timeline = buildSlideTimeline(proposal.deadline);
  const paymentSplit = buildPaymentSplit(proposal.payment);
  const titleParts = splitTitle(proposal.serviceName);
  const contactLine = brand?.whatsapp || brand?.email || proposal.user.email;
  const cssVars = {
    "--slides-primary": brand?.primaryColor || "#33D14F",
    "--slides-secondary": brand?.secondaryColor || "#020918",
    "--slides-accent": brand?.accentColor || "#1462FF",
    "--slides-green": brand?.primaryColor || "#33D14F",
    "--slides-blue": brand?.accentColor || "#1462FF",
    "--slides-dark": brand?.secondaryColor || "#020918",
  } as CSSProperties;

  return (
    <main className="fp-slides-shell" style={cssVars}>
      <div className="fp-slides-toolbar">
        <a href={`/p/${proposal.publicSlug}`}>Proposta online</a>
        <a href={`/p/${proposal.publicSlug}/pdf`}>PDF da proposta</a>
        <SlidesPrintButton />
      </div>

      <article className="fp-slides-deck">
        <Slide footer={<SlideFooter page="Slide 1 de 5" />}>
          <TemplateHeader brandName={brandName} logoUrl={brand?.logoUrl} />
          <section className="fp-slide-hero-card">
            <div className="fp-slide-hero-copy">
              <p className="fp-slide-eyebrow">Proposta comercial</p>
              <h1>
                {titleParts.first}
                {titleParts.last ? <strong>{titleParts.last}</strong> : null}
              </h1>
              <span>Proposta preparada para</span>
              <h2>{proposal.clientName}</h2>
              <p>{notes || brand?.proposalIntro || defaultIntro(proposal.serviceName, proposal.clientName)}</p>
              <div className="fp-slide-date">
                <IconBox>▣</IconBox>
                <div>
                  <small>Data da proposta</small>
                  <strong>{proposal.createdAt ? formatDate(proposal.createdAt.toISOString().slice(0, 10)) : "A combinar"}</strong>
                </div>
              </div>
            </div>
            <div className="fp-slide-hero-visual">
              {heroPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={heroPhoto} />
              ) : (
                <div className="fp-slide-hero-fallback">{proposal.serviceName}</div>
              )}
            </div>
            <dl className="fp-slide-investment-strip">
              <Fact label="Investimento total" value={money.format(proposal.price)} />
              <Fact label="Garantia" value={brand?.proposalTerms ? "Conforme contrato" : "Escopo protegido"} />
              <Fact label="Validade da proposta" value={proposal.validUntil ? formatDate(proposal.validUntil) : "A combinar"} />
            </dl>
          </section>
        </Slide>

        <Slide footer={<SlideFooter page="Slide 2 de 5" />}>
          <TemplateHeader brandName={brandName} logoUrl={brand?.logoUrl} compact />
          <Header title="Escopo e Etapas do Projeto" highlight="Etapas" />
          <div className="fp-slide-scope-layout">
            <section className="fp-slide-glass-panel">
              <h3>Escopo do projeto</h3>
              <ul className="fp-slide-check-list">
                {included.slice(0, 6).map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="fp-slide-timeline-panel">
              <h3>Etapas do projeto</h3>
              <ol className="fp-slide-template-timeline">
                {timeline.map((step, index) => (
                  <li key={step.title}>
                    <span>{index + 1}</span>
                    <strong>{step.title}</strong>
                    <small>{step.description}</small>
                    <em>{step.duration}</em>
                  </li>
                ))}
              </ol>
            </section>
            <section className="fp-slide-reference-panel">
              <h3>Referencias de projetos</h3>
              <div className="fp-slide-image-row">
                {slideImages.length ? (
                  slideImages.map((item) => (
                    <figure key={item.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" src={item.imageUrl} />
                    </figure>
                  ))
                ) : (
                  demoFrames(proposal.serviceName).map((item) => <figure key={item}>{item}</figure>)
                )}
              </div>
            </section>
          </div>
        </Slide>

        <Slide footer={<SlideFooter page="Slide 3 de 5" />}>
          <TemplateHeader brandName={brandName} logoUrl={brand?.logoUrl} compact />
          <Header title="Investimento e Condições Comerciais" highlight="Condições" />
          <div className="fp-slide-commercial-grid">
            <section className="fp-slide-glass-panel fp-slide-payment-card">
              <h3>Condições de pagamento</h3>
              <div className="fp-slide-payment-split">
                {paymentSplit.map((item) => (
                  <div key={item.label}>
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <p>{proposal.payment || "Pagamento combinado entre as partes."}</p>
            </section>
            <section className="fp-slide-glass-panel">
              <h3>Próximos passos</h3>
              <ol className="fp-slide-number-list">
                <li>Aprovação da proposta</li>
                <li>Assinatura do contrato</li>
                <li>Confirmação do pagamento</li>
                <li>Início da execução</li>
              </ol>
            </section>
            <section className="fp-slide-glass-panel">
              <h3>Contato</h3>
              <div className="fp-slide-contact-list">
                <p>{brand?.whatsapp || "WhatsApp informado na proposta"}</p>
                <p>{brand?.email || proposal.user.email}</p>
                <p>{brand?.website || brand?.instagram || "Atendimento combinado"}</p>
              </div>
            </section>
            <section className="fp-slide-glass-panel fp-slide-acceptance-card">
              <h3>Aceite da proposta</h3>
              <p>Estou de acordo com as condições apresentadas nesta proposta e autorizo o início do projeto.</p>
              <div className="fp-slide-signatures">
                <span>Assinatura do cliente</span>
                <span>Assinatura do contratado</span>
              </div>
            </section>
          </div>
        </Slide>

        <Slide footer={<SlideFooter page="Slide 4 de 5" />}>
          <TemplateHeader brandName={brandName} logoUrl={brand?.logoUrl} compact />
          <Header title="Clareza para decidir com segurança" highlight="decidir" />
          <div className="fp-slide-proof-grid">
            <section className="fp-slide-glass-panel fp-slide-large-copy">
              <h3>O que torna esta proposta diferente</h3>
              <p>{brand?.bio || `${brandName} organiza escopo, prazo, investimento e próximos passos para que ${proposal.clientName} entenda exatamente o que está contratando.`}</p>
              <div className="fp-slide-benefit-row">
                <Benefit title="Mais confiança" text="Processo seguro e transparente." />
                <Benefit title="Mais clareza" text="Tudo organizado para decidir." />
                <Benefit title="Mais chance de fechar" text="Proposta completa, sem improviso." />
              </div>
            </section>
            <section className="fp-slide-glass-panel">
              <h3>Resumo comercial</h3>
              <dl className="fp-slide-fact-stack">
                <Fact label="Cliente" value={proposal.clientName} />
                <Fact label="Servico" value={proposal.serviceName} />
                <Fact label="Investimento" value={money.format(proposal.price)} />
                <Fact label="Prazo" value={proposal.deadline || "A combinar"} />
              </dl>
            </section>
            <section className="fp-slide-glass-panel fp-slide-testimonial-panel">
              <h3>Prova social</h3>
              {testimonials.length ? (
                testimonials.map((item) => (
                  <blockquote key={item.id}>
                    <p>{item.quote}</p>
                    <cite>{item.authorName}{item.company ? `, ${item.company}` : ""}</cite>
                  </blockquote>
                ))
              ) : (
                <p>Use este material para apresentar sua entrega com mais valor antes da comparação por preço.</p>
              )}
            </section>
          </div>
        </Slide>

        <Slide footer={<SlideFooter page="Slide 5 de 5" />}>
          <TemplateHeader brandName={brandName} logoUrl={brand?.logoUrl} compact />
          <div className="fp-slide-final-layout">
            <section>
              <p className="fp-slide-eyebrow">Proposta pronta para aprovação</p>
              <h2>
                Vamos transformar esta proposta em projeto aprovado?
              </h2>
              <p>{brand?.proposalClosing || `A proposta para ${proposal.clientName} está pronta para aceite, contrato e início dos próximos passos.`}</p>
              <a className="fp-slide-cta" href={`/p/${proposal.publicSlug}`}>
                Aceitar proposta
              </a>
            </section>
            <aside className="fp-slide-final-card">
              <h3>Resumo da decisão</h3>
              <dl>
                <Fact label="Investimento" value={money.format(proposal.price)} />
                <Fact label="Validade" value={proposal.validUntil ? formatDate(proposal.validUntil) : "A combinar"} />
                <Fact label="Contato direto" value={contactLine} />
              </dl>
            </aside>
          </div>
        </Slide>
      </article>
    </main>
  );
}

function Slide({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="fp-slide fp-template-slide">
      {children}
      {footer !== undefined ? <footer className="fp-slide-footer">{footer}</footer> : null}
    </div>
  );
}

function TemplateHeader({ brandName, logoUrl, compact = false }: { brandName: string; logoUrl?: string | null; compact?: boolean }) {
  return (
    <header className={`fp-template-header${compact ? " compact" : ""}`}>
      <div className="fp-template-brand">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={logoUrl} />
        ) : (
          <span>{initials(brandName)}</span>
        )}
        <strong>{brandName}</strong>
      </div>
      <div className="fp-template-pill">
        <i />
        Proposta comercial
      </div>
    </header>
  );
}

function Header({ title, highlight }: { title: string; highlight: string }) {
  const parts = title.split(highlight);
  return (
    <header className="fp-slide-section-title">
      <h2>
        {parts[0]}
        <strong>{highlight}</strong>
        {parts[1]}
      </h2>
    </header>
  );
}

function SlideFooter({ page }: { page: string }) {
  return (
    <>
      <span>Transformamos propostas. <strong>Fechamos negócios.</strong></span>
      <span>{page}</span>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Benefit({ title, text }: { title: string; text: string }) {
  return (
    <article>
      <strong>{title}</strong>
      <span>{text}</span>
    </article>
  );
}

function IconBox({ children }: { children: ReactNode }) {
  return <span className="fp-slide-icon-box">{children}</span>;
}

function initials(value: string) {
  return value.trim().split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "FP";
}

function defaultIntro(serviceName: string, clientName: string) {
  return `${serviceName} apresentado com escopo, referências e investimento para ${clientName} decidir com segurança.`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function splitTitle(value: string) {
  const words = value.trim().split(/\s+/);
  if (words.length <= 1) return { first: value, last: "" };
  const last = words.slice(-1).join(" ");
  return { first: `${words.slice(0, -1).join(" ")} `, last };
}

function buildSlideTimeline(deadline?: string | null) {
  const days = parseDeadlineDays(deadline);
  const execution = days ? Math.max(1, Math.ceil(days * 0.55)) : 15;
  const planning = days ? Math.max(1, Math.ceil(days * 0.2)) : 3;
  const finishing = days ? Math.max(1, Math.ceil(days * 0.18)) : 7;
  const delivery = days ? Math.max(1, days - execution - planning - finishing) : 2;

  return [
    { title: "Planejamento", description: "Briefing e alinhamento", duration: `${planning} dias` },
    { title: "Execução", description: "Produção do escopo", duration: `${execution} dias` },
    { title: "Acabamentos", description: "Detalhes e revisão", duration: `${finishing} dias` },
    { title: "Entrega", description: "Validação final", duration: `${delivery} dias` },
  ];
}

function parseDeadlineDays(deadline?: string | null) {
  if (!deadline) return null;
  const match = deadline.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function buildPaymentSplit(payment?: string | null) {
  const normalized = payment || "";
  const percentages = Array.from(normalized.matchAll(/(\d{1,3})\s*%/g)).map((match) => `${match[1]}%`).slice(0, 3);
  if (percentages.length >= 2) {
    return [
      { label: "Entrada", value: percentages[0] },
      { label: "Durante o projeto", value: percentages[1] },
      { label: "Na entrega", value: percentages[2] || "A combinar" },
    ];
  }

  return [
    { label: "Entrada", value: "30%" },
    { label: "Durante o projeto", value: "50%" },
    { label: "Na entrega", value: "20%" },
  ];
}

function demoFrames(serviceName: string) {
  return [serviceName, "Escopo", "Entrega", "Resultado"];
}

function uniqueSlideImages(serviceImage: string | null, portfolio: Awaited<ReturnType<typeof findSlidePortfolio>>) {
  const images = [
    ...(serviceImage ? [{ id: "service-image", imageUrl: serviceImage }] : []),
    ...portfolio.filter((item) => item.imageUrl).map((item) => ({ id: item.id, imageUrl: item.imageUrl as string })),
  ];
  return images.filter((item, index, all) => all.findIndex((candidate) => candidate.imageUrl === item.imageUrl) === index);
}

function demoPortfolioCategories(slug: string) {
  if (!slug.startsWith("demo-")) return [];
  const withoutPrefix = slug.slice("demo-".length);
  const match = withoutPrefix.match(/^(.+)-[A-Za-z0-9_-]{8}$/);
  if (!match?.[1]) return [];
  const niche = match[1];
  const parts = niche.split("-");
  return Array.from(
    new Set(parts.map((_, index) => `Demo:${parts.slice(0, parts.length - index).join("-")}`)),
  );
}

async function findSlidePortfolio(userId: string, slug: string) {
  const categories = demoPortfolioCategories(slug);
  if (!categories.length) {
    return prisma.portfolioAsset.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  }

  const related = await prisma.portfolioAsset.findMany({
    where: { userId, category: { in: categories } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (related.length >= 3) return related;

  const fill = await prisma.portfolioAsset.findMany({
    where: {
      userId,
      id: { notIn: related.map((item) => item.id) },
      category: { startsWith: "Demo:" },
    },
    orderBy: { createdAt: "desc" },
    take: 5 - related.length,
  });

  return [...related, ...fill];
}

async function findSlideServiceImage(userId: string, serviceName: string) {
  const service = await prisma.serviceAsset.findFirst({
    where: {
      userId,
      name: { equals: serviceName, mode: "insensitive" },
      imageUrl: { not: null },
    },
  });
  return service?.imageUrl ?? null;
}
