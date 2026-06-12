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
  const heroPhoto = serviceImage || portfolio.find((item) => item.imageUrl)?.imageUrl;
  const nextSteps = [
    ["01", "Aceite online", "O cliente revisa a proposta e registra o aceite no link."],
    ["02", "Alinhamento final", "Profissional e cliente confirmam detalhes, pagamento e agenda."],
    ["03", "Execução", "O trabalho segue com escopo, prazo e condições documentadas."],
  ];
  const cssVars = {
    "--slides-primary": brand?.primaryColor || "#16A34A",
    "--slides-secondary": brand?.secondaryColor || "#0F172A",
    "--slides-accent": brand?.accentColor || "#2563EB",
  } as CSSProperties;

  return (
    <main className="fp-slides-shell" style={cssVars}>
      <div className="fp-slides-toolbar">
        <a href={`/p/${proposal.publicSlug}`}>Proposta online</a>
        <a href={`/p/${proposal.publicSlug}/pdf`}>PDF da proposta</a>
        <SlidesPrintButton />
      </div>

      <article className="fp-slides-deck">
        <Slide className="fp-slide-cover" footer={<><span>{brandName}</span><span>1 / 6</span></>}>
          <div className="fp-slide-brand">
            {brand?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={brand.logoUrl} />
            ) : (
              <span>{initials(brandName)}</span>
            )}
            <strong>{brandName}</strong>
          </div>
          <div className="fp-slide-cover-copy">
            <p>Apresentação comercial</p>
            <h1>{proposal.serviceName}</h1>
            <h2>Preparada para {proposal.clientName}</h2>
            <dl className="fp-slide-cover-strip">
              <Fact label="Investimento" value={money.format(proposal.price)} />
              <Fact label="Prazo" value={proposal.deadline || "A combinar"} />
              <Fact label="Validade" value={proposal.validUntil ? formatDate(proposal.validUntil) : "A combinar"} />
            </dl>
          </div>
          <div className="fp-slide-cover-media">
            {heroPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={heroPhoto} />
            ) : (
              <div>
                <strong>{money.format(proposal.price)}</strong>
                <span>{proposal.deadline || "Prazo a combinar"}</span>
              </div>
            )}
          </div>
        </Slide>

        <Slide footer={<><span>{brandName}</span><span>2 / 6</span></>}>
          <Header eyebrow="Contexto" title={`O que ${proposal.clientName} recebe`} />
          <div className="fp-slide-grid">
            <div className="fp-slide-statement">
              <p>{notes || brand?.proposalIntro || defaultIntro(proposal.serviceName, proposal.clientName)}</p>
            </div>
            <dl className="fp-slide-facts">
              <Fact label="Investimento" value={money.format(proposal.price)} />
              <Fact label="Prazo" value={proposal.deadline || "A combinar"} />
              <Fact label="Pagamento" value={proposal.payment || "A combinar"} />
              <Fact label="Validade" value={proposal.validUntil ? formatDate(proposal.validUntil) : "A combinar"} />
            </dl>
          </div>
        </Slide>

        <Slide footer={<><span>{brandName}</span><span>3 / 6</span></>}>
          <Header eyebrow="Escopo" title="Entrega organizada em etapas claras" />
          <ol className="fp-slide-scope">
            {included.slice(0, 7).map((item, index) => (
              <li key={`${item}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </Slide>

        <Slide footer={<><span>{brandName}</span><span>4 / 6</span></>}>
          <Header eyebrow="Próximos passos" title="Como seguimos depois da aprovação" />
          <div className="fp-slide-timeline">
            {nextSteps.map(([number, title, text]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </Slide>

        <Slide footer={<><span>{brandName}</span><span>5 / 6</span></>}>
          <Header eyebrow="Prova visual" title={portfolio.length ? "Referências que sustentam a proposta" : "Uma entrega pensada para apresentar bem"} />
          {portfolio.length ? (
            <div className="fp-slide-gallery">
              {portfolio.map((item) => (
                <figure key={item.id}>
                  <div className="fp-slide-gallery-media">
                    <span>{item.category || "Portfólio"}</span>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={item.imageUrl} />
                    ) : null}
                  </div>
                  <figcaption>{item.title}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="fp-slide-statement fp-slide-empty">
              <p>{brand?.bio || `${brandName} conduz o trabalho com escopo, prazo e investimento definidos para a decisão do cliente.`}</p>
            </div>
          )}
        </Slide>

        <Slide footer={<><span>{brandName}</span><span>6 / 6</span></>}>
          <Header eyebrow="Fechamento" title="Pronto para seguir" />
          <div className="fp-slide-close">
            <div>
              <p>{brand?.proposalClosing || `A proposta para ${proposal.clientName} está pronta para aceite e alinhamento dos próximos passos.`}</p>
              <a href={`/p/${proposal.publicSlug}`}>Abrir proposta para aceite</a>
            </div>
            {testimonials.length ? (
              <div className="fp-slide-quotes">
                {testimonials.map((item) => (
                  <blockquote key={item.id}>
                    <p>{item.quote}</p>
                    <cite>{item.authorName}{item.company ? `, ${item.company}` : ""}</cite>
                  </blockquote>
                ))}
              </div>
            ) : (
              <dl className="fp-slide-facts">
                <Fact label="Contato" value={brand?.whatsapp || brand?.email || proposal.user.email} />
                <Fact label="Serviço" value={proposal.serviceName} />
              </dl>
            )}
          </div>
        </Slide>
      </article>
    </main>
  );
}

function Slide({ children, className = "", footer }: { children: ReactNode; className?: string; footer?: ReactNode }) {
  return (
    <div className={`fp-slide ${className}`}>
      {children}
      {footer !== undefined ? <footer className="fp-slide-footer">{footer}</footer> : null}
    </div>
  );
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="fp-slide-header">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
    </header>
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
