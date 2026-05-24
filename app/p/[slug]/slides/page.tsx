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

  const [portfolio, testimonials] = await Promise.all([
    prisma.portfolioAsset.findMany({
      where: { userId: proposal.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.testimonialAsset.findMany({
      where: { userId: proposal.userId },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
  ]);

  const brand = proposal.user.brandProfile;
  const brandName = brand?.businessName || proposal.user.name;
  const notes = proposal.notes?.trim();
  const included = proposal.included.length ? proposal.included : ["Escopo alinhado com o cliente."];
  const heroPhoto = portfolio.find((item) => item.imageUrl)?.imageUrl;
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
        <Slide className="fp-slide-cover">
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

        <Slide>
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

        <Slide>
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

        <Slide>
          <Header eyebrow="Prova visual" title={portfolio.length ? "Referencias que sustentam a proposta" : "Uma entrega pensada para apresentar bem"} />
          {portfolio.length ? (
            <div className="fp-slide-gallery">
              {portfolio.map((item) => (
                <figure key={item.id}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" src={item.imageUrl} />
                  ) : (
                    <span>{item.category || "Portfolio"}</span>
                  )}
                  <figcaption>{item.title}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="fp-slide-statement fp-slide-empty">
              <p>{brand?.bio || `${brandName} conduz o trabalho com escopo, prazo e investimento definidos para a decisao do cliente.`}</p>
            </div>
          )}
        </Slide>

        <Slide>
          <Header eyebrow="Fechamento" title="Pronto para seguir" />
          <div className="fp-slide-close">
            <div>
              <p>{brand?.proposalClosing || `A proposta para ${proposal.clientName} esta pronta para aceite e alinhamento dos proximos passos.`}</p>
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
                <Fact label="Servico" value={proposal.serviceName} />
              </dl>
            )}
          </div>
        </Slide>
      </article>
    </main>
  );
}

function Slide({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`fp-slide ${className}`}>{children}</div>;
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
  return `${serviceName} apresentado com escopo, referencias e investimento para ${clientName} decidir com seguranca.`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}
