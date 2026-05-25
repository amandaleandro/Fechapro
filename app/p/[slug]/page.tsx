import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { prisma } from "@/lib/prisma";
import { sendProposalViewedEmail } from "@/lib/email";
import { sendProposalPushNotification } from "@/lib/push";
import { proposalNotification } from "@/lib/proposal-notifications";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export default async function PublicProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ accepted?: string; declined?: string; error?: string; name?: string; payment?: string; paymentError?: string; survey?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const session = await getSession();
  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    include: { satisfactionSurvey: true, user: { include: { brandProfile: true } } },
  });

  if (!proposal) notFound();

  const isOwnerView = session?.id === proposal.userId;
  const shouldTrackView = !isOwnerView;
  const isFirstView = shouldTrackView && proposal.status === "sent";
  const currentStatus = isFirstView ? "viewed" : proposal.status;
  const currentViewCount = shouldTrackView ? proposal.viewCount + 1 : proposal.viewCount;

  if (shouldTrackView) {
    await prisma.proposalAsset.update({
      where: { id: proposal.id },
      data: {
        viewCount: { increment: 1 },
        status: currentStatus,
      },
    });
  }

  if (isFirstView && proposal.user.email) {
    await sendProposalViewedEmail(
      proposal.user.email,
      proposal.user.name,
      proposal.clientName,
      proposal.serviceName,
      proposal.publicSlug
    );
  }

  if (isFirstView) {
    await sendProposalPushNotification(
      proposal.userId,
      proposalNotification("viewed", {
        clientName: proposal.clientName,
        serviceName: proposal.serviceName,
        slug: proposal.publicSlug,
      })
    );
  }

  const demoCategories = demoPortfolioCategories(proposal.publicSlug);
  const [portfolio, testimonials, services] = await Promise.all([
    prisma.portfolioAsset.findMany({
      where: { userId: proposal.userId, ...(demoCategories.length ? { category: { in: demoCategories } } : {}) },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.testimonialAsset.findMany({
      where: { userId: proposal.userId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.serviceAsset.findMany({
      where: { userId: proposal.userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);
  const brand = proposal.user.brandProfile;
  const brandName = brand?.businessName || proposal.user.name;
  const brandColor = brand?.primaryColor || "#22C55E";
  const brandSecondaryColor = brand?.secondaryColor || "#0F172A";
  const brandAccentColor = brand?.accentColor || "#2563EB";
  const proposalStyle = getProposalStyle(brand?.proposalStyle || "modern");
  const segmentStyle = getPublicSegmentStyle(proposal.segment || "auto", proposal.serviceName, proposal.included, proposal.notes || "", brandColor, brandSecondaryColor, brandAccentColor);
  const customFaq = parseCustomFaq(brand?.proposalFaq || "");
  const expired = Boolean(proposal.validUntil && proposal.validUntil < new Date().toISOString().slice(0, 10));
  const hasDecision = expired || currentStatus === "accepted" || currentStatus === "declined";
  const satisfactionReleased = Boolean(proposal.satisfactionSurvey?.serviceCompletedAt);
  const validUntilLabel = proposal.validUntil ? formatDate(proposal.validUntil) : "A combinar";
  const daysLeft = proposal.validUntil ? getDaysLeft(proposal.validUntil) : null;
  const whatsappUrl = brand?.whatsapp
    ? `/api/public/proposals/${proposal.publicSlug}/whatsapp?intent=contact`
    : null;
  const acceptHref = hasDecision ? "#status" : "#aceite";
  const wantsPix = proposal.checkoutMode === "pix";
  const proposalPdfHref = `/p/${proposal.publicSlug}/pdf`;
  const contractPdfHref = `/p/${proposal.publicSlug}/contrato`;
  const acceptedDocumentHref = currentStatus === "accepted" ? contractPdfHref : proposalPdfHref;
  const acceptedDocumentLabel = currentStatus === "accepted" ? "Contrato" : "Contrato / proposta";
  const acceptedAtLabel = proposal.acceptedAt
    ? proposal.acceptedAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })
    : "";
  const contractConditions = [
    ["Contratante", proposal.clientName],
    ["Contratada", brandName],
    ["Serviço", proposal.serviceName],
    ["Investimento", money.format(proposal.price)],
    ["Prazo", proposal.deadline],
    ["Pagamento", proposal.payment || "A combinar"],
    ["Validade da proposta", validUntilLabel],
  ];

  return (
    <main
      className={`fp-proposal-page mobile-safe-bottom min-h-screen pb-20 text-slate-900 ${segmentStyle.pageClass}`}
      style={{
        "--proposal-primary": segmentStyle.primary,
        "--proposal-accent": segmentStyle.accent,
        "--proposal-secondary": brandSecondaryColor,
      } as CSSProperties}
    >
      <article className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-4 sm:px-6 sm:py-8">
        {query.accepted ? (
          <div className="rounded-lg border border-green-700/20 bg-green-50 p-4 text-green-800 shadow-xl shadow-slate-900/5">
            <strong>Proposta aceita com sucesso.</strong>
            <p className="mt-1 text-sm">Obrigado, {query.name || "cliente"}. O contrato preenchido já está disponível com as condições aceitas.</p>
            <a className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-green-700 px-4 text-sm font-black text-white" href="#contrato">
              Ver contrato
            </a>
          </div>
        ) : null}

        {query.declined ? (
          <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-4 text-rose-900 shadow-xl shadow-slate-900/5">
            <strong>Proposta recusada.</strong>
            <p className="mt-1 text-sm">Obrigado pelo retorno. O profissional recebeu a atualização.</p>
          </div>
        ) : null}

        {query.payment === "success" ? (
          <div className="rounded-lg border border-green-700/20 bg-green-50 p-4 text-green-800 shadow-xl shadow-slate-900/5">
            <strong>Pagamento iniciado.</strong>
            <p className="mt-1 text-sm">Assim que o Mercado Pago confirmar o pagamento, o status será atualizado.</p>
          </div>
        ) : null}

        {query.paymentError ? (
          <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-4 text-rose-900 shadow-xl shadow-slate-900/5">
            <strong>Não foi possível abrir o pagamento.</strong>
            <p className="mt-1 text-sm">{query.paymentError}</p>
          </div>
        ) : null}

        {query.survey ? (
          <div className="rounded-lg border border-green-700/20 bg-green-50 p-4 text-green-800 shadow-xl shadow-slate-900/5">
            <strong>Pesquisa enviada com sucesso.</strong>
            <p className="mt-1 text-sm">Obrigado pelo retorno. Sua avaliação ficou ligada a esta proposta.</p>
          </div>
        ) : null}

        {query.error === "whatsapp" ? (
          <div className="rounded-lg border border-amber-700/20 bg-amber-50 p-4 text-amber-900 shadow-xl shadow-slate-900/5">
            <strong>WhatsApp indisponível.</strong>
            <p className="mt-1 text-sm">O profissional ainda não configurou um número de WhatsApp para esta proposta.</p>
          </div>
        ) : null}

        {expired ? (
          <div className="rounded-lg border border-amber-700/20 bg-amber-50 p-4 text-amber-900 shadow-xl shadow-slate-900/5">
            <strong>Proposta vencida.</strong>
            <p className="mt-1 text-sm">Entre em contato para solicitar uma nova validade.</p>
          </div>
        ) : null}

        <header className={`fp-proposal-hero overflow-hidden text-white shadow-xl shadow-slate-900/10 ${proposalStyle.radiusClass} ${proposalStyle.headerClass}`} style={{ background: segmentStyle.headerBackground || proposalStyle.headerBackground(brandSecondaryColor, brandColor, brandAccentColor) }}>
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${segmentStyle.primary}, ${segmentStyle.accent})` }} />
          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_0.45fr]">
            <div>
              <div className="flex items-center gap-4">
                {brand?.logoUrl ? (
                  <span className="fp-proposal-logo-frame grid place-items-center overflow-hidden rounded-lg shadow-sm ring-1 ring-white/70">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="" className="fp-proposal-logo-image object-contain" src={brand.logoUrl} />
                  </span>
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-lg font-black text-white sm:h-20 sm:w-20" style={{ background: segmentStyle.primary }}>
                    FP
                  </div>
                )}
                <div>
                  <p className="text-xs font-black uppercase" style={{ color: segmentStyle.accent }}>{segmentStyle.eyebrow}</p>
                  <strong>{brandName}</strong>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full px-3 py-1 text-xs font-black uppercase text-white" style={{ background: segmentStyle.primary }}>
                  {segmentStyle.segmentName}
                </span>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-green-200">
                  {proposalStyle.badges[0]}
                </span>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase" style={{ color: segmentStyle.accent }}>
                  {proposalStyle.badges[1]}
                </span>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-white/80">
                  {proposalStyle.badges[2]}
                </span>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-white/80">
                  {proposalStyle.badges[3]}
                </span>
              </div>

              <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight sm:text-6xl">
                Proposta para {proposal.clientName}
              </h1>
              <div className="fp-proposal-service-brief mt-5 max-w-2xl rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-black uppercase text-white/60">Serviço proposto</p>
                <strong className="mt-1 block text-xl font-black text-white sm:text-2xl">{proposal.serviceName}</strong>
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold text-white/80">
                  <span>Prazo: {proposal.deadline}</span>
                  <span aria-hidden="true">|</span>
                  <span>Pagamento: {proposal.payment || "A combinar"}</span>
                </div>
              </div>
              <p className="mt-4 max-w-2xl whitespace-pre-line leading-7 text-white/75">
                {brand?.proposalIntro || brand?.bio || segmentStyle.intro}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {!hasDecision ? (
                  <a className="inline-flex min-h-12 items-center justify-center rounded-lg px-5 font-black text-slate-950" href="#aceite" style={{ background: segmentStyle.accent }}>
                    Aceitar proposta
                  </a>
                ) : null}
                <a className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 px-5 font-black text-white" href={acceptedDocumentHref}>
                  {acceptedDocumentLabel}
                </a>
                {currentStatus === "accepted" && proposal.paymentStatus === "paid" ? (
                  <a className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-5 font-black text-white" href={`/p/${proposal.publicSlug}/recibo`}>
                    Recibo
                  </a>
                ) : null}
              </div>
            </div>

            <aside className={`fp-proposal-price-card grid content-between gap-4 bg-white p-4 text-slate-950 ${proposalStyle.radiusClass}`}>
              <div>
                <div className="fp-proposal-price-media mb-4 overflow-hidden rounded-lg">
                  {portfolio[0]?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="h-full w-full object-cover" src={portfolio[0].imageUrl} />
                  ) : (
                    <div className="grid h-full content-between p-4 text-white">
                      <span className="text-xs font-black uppercase text-white/70">{segmentStyle.segmentName}</span>
                      <strong className="text-lg font-black leading-tight">{proposal.serviceName}</strong>
                    </div>
                  )}
                </div>
                <span className="inline-flex rounded-lg px-3 py-1 text-xs font-black uppercase text-white" style={{ background: statusColor(currentStatus, expired) }}>
                  {expired ? "Vencida" : labelStatus(currentStatus)}
                </span>
                <p className="mt-5 text-sm font-black uppercase text-slate-500">Investimento</p>
                <strong className="mt-1 block text-3xl font-black sm:text-4xl">{money.format(proposal.price)}</strong>
                <p className="mt-3 text-sm font-bold text-slate-600">
                  Validade: {validUntilLabel}
                  {daysLeft !== null && daysLeft >= 0 ? ` (${daysLeft === 0 ? "vence hoje" : `${daysLeft} dias`})` : ""}
                </p>
                <div className="mt-5 grid gap-2 border-t border-black/10 pt-4 text-sm">
                  <HeroDetail label="Cliente" value={proposal.clientName} />
                  <HeroDetail label="Entrega" value={proposal.deadline} />
                  <HeroDetail label="Canal" value="Link online + PDF" />
                </div>
              </div>
              <div className="grid gap-2">
                {!hasDecision ? (
                  <a className="grid min-h-11 place-items-center rounded-lg px-4 text-center font-black text-white" href="#aceite" style={{ background: brandColor }}>
                    Aceitar online
                  </a>
                ) : null}
                <a className="grid min-h-11 place-items-center rounded-lg border border-black/10 px-4 text-center font-black" href={acceptedDocumentHref}>
                  {acceptedDocumentLabel}
                </a>
                {currentStatus === "accepted" && proposal.paymentStatus === "paid" ? (
                  <a className="grid min-h-11 place-items-center rounded-lg border border-green-700/20 bg-green-50 px-4 text-center font-black text-green-800" href={`/p/${proposal.publicSlug}/recibo`}>
                    Recibo de pagamento
                  </a>
                ) : null}
              </div>
            </aside>
          </div>
        </header>

        <section className={`fp-proposal-summary grid gap-3 border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/5 sm:grid-cols-5 ${proposalStyle.radiusClass}`}>
          <PreviewBox label="Serviço" value={proposal.serviceName} />
          <PreviewBox label="Prazo" value={proposal.deadline} />
          <PreviewBox label="Pagamento" value={proposal.payment || "A combinar"} />
          <PreviewBox label="Visualizações" value={String(currentViewCount)} />
          <PreviewBox label="Cliques WhatsApp" value={String(proposal.whatsappClickCount)} />
        </section>

        {brand?.proposalClosing ? (
          <section className="fp-proposal-message rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
            <p className="text-xs font-black uppercase text-blue-700">Mensagem</p>
            <h2 className="mt-1 text-2xl font-black">Antes de decidir</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">{brand.proposalClosing}</p>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div className="fp-proposal-panel grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
            <section>
              <p className="text-xs font-black uppercase text-blue-700">Escopo</p>
              <h2 className="mt-1 text-2xl font-black">Itens inclusos</h2>
              <ul className="mt-4 grid gap-3">
                {(proposal.included.length ? proposal.included : ["Serviço conforme combinado."]).map((item, index) => (
                  <li className="fp-proposal-scope-item grid grid-cols-[auto_1fr] gap-3 rounded-lg border border-black/10 p-3 leading-7 text-slate-700" key={`${item}-${index}`}>
                    <span className="mt-1 grid size-6 place-items-center rounded-full text-xs font-black text-white" style={{ background: brandColor }}>
                      OK
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {proposal.notes ? (
              <section className="rounded-lg bg-[var(--ui-bg)] p-4">
                <h2 className="font-black">Observações</h2>
                <p className="mt-2 whitespace-pre-line leading-7 text-slate-700">{proposal.notes}</p>
              </section>
            ) : null}
          </div>

          <aside className="grid gap-4">
            <section className="fp-proposal-panel rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
              <p className="text-xs font-black uppercase text-blue-700">Pagamento</p>
              <h2 className="mt-1 text-2xl font-black">{proposal.paymentStatus === "paid" ? "Pagamento confirmado" : wantsPix ? "Pague com PIX" : "Pague com PIX ou cartão"}</h2>
              <p className="mt-2 leading-7 text-slate-600">
                {proposal.paymentStatus === "paid"
                  ? "O pagamento desta proposta foi confirmado."
                  : wantsPix
                    ? "Finalize com o PIX direto do profissional."
                    : "Finalize o pagamento em ambiente seguro via Mercado Pago."}
              </p>
              {proposal.paymentStatus === "paid" ? (
                <div className="mt-4 rounded-lg border border-green-700/20 bg-green-50 p-3 text-sm font-bold text-green-900">
                  Recibo disponível no menu de documentos da proposta.
                </div>
              ) : (
                <a className="mt-4 grid min-h-12 w-full place-items-center rounded-lg px-5 text-center font-black text-white" href={`/checkout/proposta/${proposal.publicSlug}`} style={{ background: brandColor }}>
                  Pagar agora
                </a>
              )}
            </section>

            <section className="fp-proposal-panel rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
              <p className="text-xs font-black uppercase text-blue-700">Próximos passos</p>
              <ol className="mt-4 grid gap-3">
                {["Aceite a proposta pelo formulário abaixo.", "O profissional recebe a confirmação.", "O projeto segue com briefing, pagamento e execução combinados."].map((item, index) => (
                  <li className="grid grid-cols-[auto_1fr] gap-3 text-sm font-bold leading-6 text-slate-700" key={item}>
                    <span className="grid size-7 place-items-center rounded-lg text-xs font-black text-white" style={{ background: brandSecondaryColor }}>{index + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </section>

            <section className="fp-proposal-panel rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
              <p className="text-xs font-black uppercase text-blue-700">Contato</p>
              <div className="mt-3 grid gap-2 text-sm font-bold text-slate-600">
                {brand?.email ? <p>E-mail: {brand.email}</p> : null}
                {brand?.instagram ? <p>Instagram: {brand.instagram}</p> : null}
                {brand?.website ? <p>Site: {brand.website}</p> : null}
              </div>
              {whatsappUrl ? (
                <a className="mt-4 grid min-h-11 place-items-center rounded-lg px-5 text-center font-black text-white" href={whatsappUrl} style={{ background: brandColor }} target="_blank">
                  Falar no WhatsApp
                </a>
              ) : null}
            </section>
          </aside>
        </section>

        {brand?.showPortfolio !== false && portfolio.length ? (
          <section className="fp-proposal-panel rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
            <p className="text-xs font-black uppercase text-blue-700">Prova visual</p>
            <h2 className="mt-1 text-2xl font-black">Portfólio relacionado</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {portfolio.map((item) => (
                <div className="fp-proposal-portfolio-item overflow-hidden rounded-lg border border-black/10 bg-white" key={item.id}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="h-44 w-full object-cover" src={item.imageUrl} />
                  ) : (
                    <div className="grid h-44 place-items-center font-black text-white" style={{ background: brandColor }}>
                      {item.category || "Portfólio"}
                    </div>
                  )}
                  <div className="p-3">
                    <strong className="block">{item.title}</strong>
                    <span className="text-sm font-bold text-slate-500">{item.category || "Trabalho anterior"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {brand?.showServices !== false && services.length ? (
          <section className="fp-proposal-panel rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
            <p className="text-xs font-black uppercase text-blue-700">Serviços</p>
            <h2 className="mt-1 text-2xl font-black">Outras formas de contratar</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <div className="overflow-hidden rounded-lg border border-black/10 bg-slate-50" key={service.id}>
                  {service.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="h-32 w-full object-cover" src={service.imageUrl} />
                  ) : null}
                  <div className="p-4">
                    <strong className="block">{service.name}</strong>
                    <span className="mt-1 block text-sm font-bold text-slate-500">
                      A partir de {money.format(service.price)} {service.deadline ? `- ${service.deadline}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {brand?.showTestimonials !== false && testimonials.length ? (
          <section className="fp-proposal-panel rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
            <p className="text-xs font-black uppercase text-blue-700">Prova social</p>
            <h2 className="mt-1 text-2xl font-black">Depoimentos</h2>
            <div className="mt-4 grid gap-3">
              {testimonials.map((item) => (
                <blockquote className="rounded-lg border-l-4 border-blue-600 bg-slate-50 p-4 leading-7 text-slate-700" key={item.id}>
                  "{item.quote}"
                  <cite className="mt-2 block font-black not-italic text-slate-900">
                    {item.authorName}
                    {item.company ? `, ${item.company}` : ""}
                  </cite>
                </blockquote>
              ))}
            </div>
          </section>
        ) : null}

        {brand?.proposalTerms ? (
          <section className="fp-proposal-panel rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
            <p className="text-xs font-black uppercase text-blue-700">Condições</p>
            <h2 className="mt-1 text-2xl font-black">Termos comerciais</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">{brand.proposalTerms}</p>
          </section>
        ) : null}

        {currentStatus === "accepted" ? (
          <section className="fp-proposal-panel rounded-lg border border-green-700/20 bg-white p-5 shadow-xl shadow-slate-900/5" id="contrato">
            <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
              <div>
                <p className="text-xs font-black uppercase text-green-700">Contrato preenchido</p>
                <h2 className="mt-1 text-2xl font-black">Condições aceitas para a execução</h2>
                <p className="mt-2 leading-7 text-slate-600">
                  Este documento foi gerado automaticamente a partir da proposta aceita. Ele consolida escopo, valor,
                  prazo, forma de pagamento, observações e termos comerciais cadastrados pelo profissional.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {contractConditions.map(([label, value]) => (
                    <div className="rounded-lg border border-black/10 bg-slate-50 p-3" key={label}>
                      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
                      <strong className="mt-1 block text-slate-950">{value}</strong>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-lg border border-black/10 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-slate-500">Escopo e termos contratados</p>
                  <ul className="mt-3 grid gap-2 text-sm font-bold leading-6 text-slate-700">
                    {(proposal.included.length ? proposal.included : ["Serviço conforme combinado."]).map((item, index) => (
                      <li key={`${item}-${index}`}>- {item}</li>
                    ))}
                  </ul>
                  {proposal.notes ? (
                    <p className="mt-3 whitespace-pre-line text-sm font-bold leading-6 text-slate-700">{proposal.notes}</p>
                  ) : null}
                  {brand?.proposalTerms ? (
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{brand.proposalTerms}</p>
                  ) : null}
                </div>
              </div>

              <aside className="grid content-start gap-3 rounded-lg border border-green-700/20 bg-green-50 p-4 text-green-950">
                <div>
                  <p className="text-xs font-black uppercase text-green-700">Assinatura</p>
                  <h3 className="mt-1 text-xl font-black">Assinatura digital do cliente</h3>
                  <p className="mt-2 text-sm font-bold leading-6">
                    Assinado por {proposal.acceptedBy || proposal.clientName}
                    {proposal.acceptedEmail ? ` (${proposal.acceptedEmail})` : ""}
                    {acceptedAtLabel ? ` em ${acceptedAtLabel}` : ""}.
                  </p>
                </div>
                <div className="grid gap-2">
                  <a className="grid min-h-11 place-items-center rounded-lg px-4 text-center font-black text-white" href={contractPdfHref} style={{ background: brandColor }} target="_blank">
                    Abrir contrato em PDF
                  </a>
                  <a className="grid min-h-11 place-items-center rounded-lg border border-green-700/30 bg-white px-4 text-center font-black text-green-900" href={contractPdfHref} target="_blank">
                    Imprimir ou salvar
                  </a>
                  {whatsappUrl ? (
                    <a className="grid min-h-11 place-items-center rounded-lg border border-green-700/30 bg-white px-4 text-center font-black text-green-900" href={whatsappUrl} target="_blank">
                      Enviar duvida pelo WhatsApp
                    </a>
                  ) : null}
                </div>
                <p className="text-xs font-bold leading-5 text-green-900/80">
                  Como a proposta já foi aceita, o aceite digital do cliente fica registrado como assinatura no PDF. Se precisar de assinatura física, abra o contrato em PDF e use a opção de imprimir.
                </p>
              </aside>
            </div>
          </section>
        ) : null}

        {brand?.showFaq !== false ? (
        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
          <p className="text-xs font-black uppercase text-blue-700">FAQ</p>
          <h2 className="mt-1 text-2xl font-black">Perguntas frequentes</h2>
          <div className="mt-4 grid gap-3">
            {(customFaq.length ? customFaq : [
              ["Como aprovo?", "Use o aceite digital nesta página para registrar nome, e-mail, data e hora."],
              ["Posso tirar dúvidas?", "Sim. Use o botão de WhatsApp para conversar antes de aprovar."],
              ["O que acontece depois?", "O profissional recebe a confirmação e combina os próximos passos do serviço."],
            ]).map(([question, answer]) => (
              <details className="rounded-lg border border-black/10 bg-slate-50 p-4" key={question}>
                <summary className="cursor-pointer font-black">{question}</summary>
                <p className="mt-2 leading-7 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </section>
        ) : null}

        <section className="fp-proposal-panel rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5" id="status">
          <div className="grid gap-3 sm:grid-cols-3">
            <PreviewBox label="Status" value={expired ? "Vencida" : labelStatus(currentStatus)} />
            <PreviewBox label="Pagamento" value={proposal.paymentStatus === "paid" ? "Confirmado" : "Pendente"} />
            <PreviewBox label="Formato" value="Online + PDF" />
          </div>
          {currentStatus === "accepted" ? (
            <div className="mt-4 rounded-lg border border-green-700/20 bg-green-50 p-4 text-green-900">
              <strong>Comprovante de aceite registrado.</strong>
              <p className="mt-1 text-sm font-bold">
                Aceito por {proposal.acceptedBy || proposal.clientName}
                {proposal.acceptedAt ? ` em ${proposal.acceptedAt.toLocaleString("pt-BR")}` : ""}.
              </p>
              <a className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg px-4 font-black text-white" href={acceptedDocumentHref} style={{ background: brandColor }}>
                Baixar {acceptedDocumentLabel.toLowerCase()}
              </a>
            </div>
          ) : null}
        </section>

        {currentStatus === "accepted" && satisfactionReleased ? (
          <section className="fp-proposal-accept grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5" id="satisfacao">
            <div>
              <p className="text-xs font-black uppercase text-blue-700">Pós-serviço</p>
              <h2 className="mt-1 text-2xl font-black">Pesquisa de satisfação</h2>
              <p className="mt-2 leading-7 text-slate-600">Este formulário fica ligado ao orçamento aceito e ajuda o profissional a acompanhar a entrega final.</p>
            </div>
            {proposal.satisfactionSurvey?.respondedAt ? (
              <div className="rounded-lg border border-green-700/20 bg-green-50 p-4 text-green-900">
                <strong>Avaliação registrada.</strong>
                <p className="mt-1 text-sm font-bold">
                  Nota {proposal.satisfactionSurvey.rating || "-"} de 5
                  {proposal.satisfactionSurvey.recommendScore !== null ? ` | Indicação ${proposal.satisfactionSurvey.recommendScore}/10` : ""}.
                </p>
              </div>
            ) : (
              <form action={`/api/public/proposals/${proposal.publicSlug}/satisfaction`} method="post" className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    Satisfação geral
                    <select className="min-h-12 rounded-lg border border-black/10 bg-slate-50 p-3 outline-green-700" name="rating" required defaultValue="">
                      <option value="" disabled>Escolha uma nota</option>
                      <option value="5">5 - Excelente</option>
                      <option value="4">4 - Muito bom</option>
                      <option value="3">3 - Bom</option>
                      <option value="2">2 - Regular</option>
                      <option value="1">1 - Ruim</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-black text-slate-700">
                    Indicaria para alguém? 0 a 10
                    <input className="min-h-12 rounded-lg border border-black/10 bg-slate-50 p-3 outline-green-700" name="recommendScore" type="number" min="0" max="10" required />
                  </label>
                </div>
                <textarea className="min-h-28 rounded-lg border border-black/10 bg-slate-50 p-3 outline-green-700" name="comment" maxLength={1200} placeholder="Conte como foi a experiência, o que gostou ou o que poderia melhorar." />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="min-h-12 rounded-lg border border-black/10 bg-slate-50 p-3 outline-green-700" name="clientName" placeholder="Seu nome" defaultValue={proposal.acceptedBy || proposal.clientName} />
                  <input className="min-h-12 rounded-lg border border-black/10 bg-slate-50 p-3 outline-green-700" name="clientEmail" placeholder="Seu e-mail" type="email" defaultValue={proposal.acceptedEmail || proposal.clientEmail || ""} />
                </div>
                <label className="flex items-start gap-3 rounded-lg border border-black/10 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                  <input className="mt-1" name="testimonialOk" type="checkbox" />
                  Autorizo usar meu comentário como depoimento, com meu nome, para divulgar o trabalho realizado.
                </label>
                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
                  <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
                ) : null}
                <button className="min-h-12 rounded-lg px-5 font-black text-white" style={{ background: brandColor }} type="submit">
                  Enviar avaliação
                </button>
              </form>
            )}
          </section>
        ) : null}

        {!hasDecision ? (
          <section className="fp-proposal-accept grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5" id="aceite">
            <div>
              <p className="text-xs font-black uppercase text-blue-700">Aceite digital</p>
              <h2 className="mt-1 text-2xl font-black">Pronto para seguir?</h2>
              <p className="mt-2 leading-7 text-slate-600">Preencha seu nome para registrar o aceite desta proposta.</p>
            </div>
            <form action={`/api/public/proposals/${proposal.publicSlug}/accept`} method="post" className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="min-h-12 rounded-lg border border-black/10 bg-slate-50 p-3 outline-green-700"
                  name="signerName"
                  placeholder="Seu nome para aceitar"
                  required
                />
                <input
                  className="min-h-12 rounded-lg border border-black/10 bg-slate-50 p-3 outline-green-700"
                  name="signerEmail"
                  placeholder="Seu e-mail"
                  type="email"
                />
              </div>
              {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
                <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
              ) : null}
              <button className="min-h-12 rounded-lg px-5 font-black text-white" style={{ background: brandColor }} type="submit">
                Aceitar proposta
              </button>
            </form>
            {whatsappUrl ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <a className="grid min-h-11 place-items-center rounded-lg border border-black/10 px-4 text-center font-black text-slate-800" href={`/api/public/proposals/${proposal.publicSlug}/whatsapp?intent=doubt`} target="_blank">
                  Tenho uma dúvida
                </a>
                <a className="grid min-h-11 place-items-center rounded-lg border border-black/10 px-4 text-center font-black text-slate-800" href={`/api/public/proposals/${proposal.publicSlug}/whatsapp?intent=negotiate`} target="_blank">
                  Quero negociar
                </a>
              </div>
            ) : null}
            <details className="rounded-lg border border-black/10 bg-slate-50 p-4">
              <summary className="cursor-pointer font-black text-slate-700">Não vou seguir com esta proposta</summary>
              <form action={`/api/public/proposals/${proposal.publicSlug}/decline`} method="post" className="mt-4 grid gap-3">
                <textarea
                  className="min-h-24 rounded-lg border border-black/10 bg-white p-3 outline-rose-700"
                  name="reason"
                  placeholder="Opcional: conte o motivo da recusa"
                />
                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
                  <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
                ) : null}
                <button className="min-h-12 rounded-lg border border-rose-700 px-5 font-black text-rose-800" type="submit">
                  Recusar proposta
                </button>
              </form>
            </details>
          </section>
        ) : null}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
          // eslint-disable-next-line @next/next/no-sync-scripts
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" />
        ) : null}
      </article>

      <div className="fp-proposal-mobile-bar fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 p-3 shadow-2xl shadow-slate-950/15 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2">
          <a className="grid min-h-11 place-items-center rounded-lg border border-black/10 px-3 text-center text-sm font-black text-slate-800" href={acceptedDocumentHref}>
            PDF
          </a>
          <a className="grid min-h-11 place-items-center rounded-lg px-3 text-center text-sm font-black text-white" href={acceptHref} style={{ background: brandColor }}>
            {hasDecision ? "Ver status" : "Aceitar"}
          </a>
        </div>
      </div>
    </main>
  );
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

function PreviewBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="fp-proposal-metric rounded-lg border border-black/10 p-4">
      <dt className="text-xs font-black uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-black">{value}</dd>
    </div>
  );
}

function HeroDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <span className="font-black uppercase text-slate-400">{label}</span>
      <strong className="min-w-0 text-right text-slate-800">{value}</strong>
    </div>
  );
}

function statusColor(status: string, expired: boolean) {
  if (expired) return "#b7791f";
  const colors: Record<string, string> = {
    accepted: "#22C55E",
    awaiting_response: "#4f46e5",
    declined: "#a83b3b",
    sent: "#b7791f",
    viewed: "#2563eb",
  };
  return colors[status] || "#0F172A";
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

function getDaysLeft(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function getProposalStyle(style: string) {
  if (style === "creative") {
    return {
      pageClass: "bg-rose-50",
      radiusClass: "rounded-2xl",
      headerClass: "border border-white/10",
      eyebrow: "Proposta criativa",
      badges: ["Apresentação visual", "PDF de impacto", "Aceite fácil", "Contato direto"],
      headerBackground: (secondary: string, primary: string, accent: string) => `radial-gradient(circle at 12% 20%, ${accent} 0, transparent 28%), linear-gradient(135deg, ${secondary}, ${primary})`,
    };
  }
  if (style === "premium") {
    return {
      pageClass: "bg-slate-950",
      radiusClass: "rounded-lg",
      headerClass: "border border-white/15",
      eyebrow: "Proposta premium",
      badges: ["Experiência completa", "PDF premium", "Aceite online", "Próximos passos"],
      headerBackground: (secondary: string, primary: string, accent: string) => `linear-gradient(135deg, ${secondary}, ${primary} 58%, ${accent})`,
    };
  }
  if (style === "technical" || style === "classic") {
    return {
      pageClass: "bg-stone-50",
      radiusClass: "rounded-none",
      headerClass: "border-y border-black/10",
      eyebrow: "Proposta técnica",
      badges: ["Escopo claro", "PDF objetivo", "Aceite registrado", "Condições definidas"],
      headerBackground: (secondary: string) => secondary,
    };
  }
  return {
    pageClass: "bg-[var(--ui-bg)]",
    radiusClass: "rounded-lg",
    headerClass: "",
    eyebrow: "Proposta executiva",
    badges: ["Link interativo", "PDF disponível", "Aceite online", "Atendimento em até 24h"],
    headerBackground: (secondary: string) => secondary,
  };
}

function getPublicSegmentStyle(
  segment: string,
  serviceName: string,
  included: string[],
  notes: string,
  primary: string,
  secondary: string,
  accent: string,
) {
  const text = stripAccents(`${serviceName} ${included.join(" ")} ${notes}`).toLowerCase();
  const base = {
    pageClass: "bg-[var(--ui-bg)]",
    primary,
    accent,
    segmentName: "Serviço profissional",
    eyebrow: "Proposta profissional",
    intro: "Uma proposta organizada com escopo, investimento, prazo, portfólio e aceite em um único link.",
    headerBackground: `linear-gradient(135deg, ${secondary}, ${primary})`,
  };

  if (segment === "home_reform" || hasAny(text, ["pintura", "reforma", "obra", "eletrica", "hidraulica", "instalacao", "acabamento", "alvenaria", "marcenaria", "moveis planejados", "movel planejado", "sob medida"])) {
    return {
      ...base,
      pageClass: "bg-slate-100",
      primary,
      accent: "#FACC15",
      segmentName: "Casa e reforma",
      eyebrow: "Orçamento de obra",
      intro: "Escopo visual, etapas claras, materiais combinados e valor total para aprovar com segurança.",
      headerBackground: `linear-gradient(135deg, ${secondary} 0%, #111827 52%, ${primary} 100%)`,
    };
  }
  if (segment === "automotive" || hasAny(text, ["mecanica", "automotiva", "veiculo", "carro", "lavagem", "polimento", "freio", "scanner"])) {
    return {
      ...base,
      pageClass: "bg-zinc-100",
      primary: accent,
      accent: "#F97316",
      segmentName: "Automotivo",
      eyebrow: "Orçamento automotivo",
      intro: "Diagnóstico, itens inclusos, prazo e condição de pagamento apresentados de forma objetiva.",
      headerBackground: `linear-gradient(135deg, #111827, ${secondary} 55%, ${accent})`,
    };
  }
  if (segment === "beauty" || hasAny(text, ["beleza", "manicure", "unha", "sobrancelha", "cabelo", "maquiagem", "estetica"])) {
    return {
      ...base,
      pageClass: "bg-pink-50",
      primary: accent,
      accent: "#F9A8D4",
      segmentName: "Beleza e estética",
      eyebrow: "Proposta de cuidado",
      intro: "Atendimento personalizado, procedimento, cuidados e próximos passos em uma apresentação leve.",
      headerBackground: `linear-gradient(135deg, #831843, ${accent} 58%, #F9A8D4)`,
    };
  }
  if (segment === "health" || hasAny(text, ["saude", "nutricao", "psicologia", "pilates", "personal", "treino", "terapia", "consulta"])) {
    return {
      ...base,
      pageClass: "bg-emerald-50",
      primary,
      accent: "#A7F3D0",
      segmentName: "Saúde e bem-estar",
      eyebrow: "Plano de cuidado",
      intro: "Plano claro, acolhedor e organizado para entender o atendimento e aprovar com tranquilidade.",
      headerBackground: `linear-gradient(135deg, #064E3B, ${primary})`,
    };
  }
  if (segment === "business" || hasAny(text, ["consultoria", "advocacia", "juridic", "contabilidade", "contrato", "cnpj", "mentoria"])) {
    return {
      ...base,
      pageClass: "bg-slate-50",
      primary: secondary,
      accent: primary,
      segmentName: "Negocios",
      eyebrow: "Proposta comercial",
      intro: "Escopo, entregáveis, condições e decisão comercial apresentados com clareza executiva.",
      headerBackground: `linear-gradient(135deg, ${secondary}, #1E293B 58%, ${primary})`,
    };
  }
  if (segment === "events" || hasAny(text, ["evento", "fotografia", "fotografic", "fotografo", "cerimonial", "buffet", "decoracao", "festa", "casamento", "som", "sonorizacao", "iluminacao", "audiovisual", "dj", "microfone"])) {
    return {
      ...base,
      pageClass: "bg-amber-50",
      primary: accent,
      accent: "#FDE68A",
      segmentName: "Eventos",
      eyebrow: "Proposta de evento",
      intro: "Planejamento, itens contratados, data, produção e próximos passos reunidos para aprovar sem ruído.",
      headerBackground: `linear-gradient(135deg, #78350F, ${accent})`,
    };
  }
  if (segment === "technology" || hasAny(text, ["site", "landing", "software", "sistema", "marketing", "design", "social media", "trafego", "conteudo"])) {
    return {
      ...base,
      pageClass: "bg-blue-50",
      primary: accent,
      accent: "#93C5FD",
      segmentName: "Digital",
      eyebrow: "Proposta digital",
      intro: "Estratégia, produção, entregáveis e revisão organizados para facilitar a aprovação do projeto.",
      headerBackground: `linear-gradient(135deg, #172554, ${secondary} 45%, ${accent})`,
    };
  }
  if (segment === "education" || hasAny(text, ["aula", "curso", "educacao", "reforco", "treinamento", "workshop"])) {
    return {
      ...base,
      pageClass: "bg-violet-50",
      primary: accent,
      accent: "#DDD6FE",
      segmentName: "Educação",
      eyebrow: "Plano de aprendizado",
      intro: "Conteúdo, encontros, materiais e acompanhamento reunidos para aprovar o plano com clareza.",
      headerBackground: `linear-gradient(135deg, #4C1D95, ${secondary} 55%, ${accent})`,
    };
  }
  if (segment === "food" || hasAny(text, ["bolo", "buffet", "marmita", "coffee", "cardapio", "gastronomia", "comida", "doces"])) {
    return {
      ...base,
      pageClass: "bg-orange-50",
      primary: accent,
      accent: "#FED7AA",
      segmentName: "Gastronomia",
      eyebrow: "Proposta de pedido",
      intro: "Cardápio, quantidade, preparo, entrega e condições combinadas para aprovar sem dúvidas.",
      headerBackground: `linear-gradient(135deg, #7C2D12, ${accent})`,
    };
  }
  if (segment === "pet" || hasAny(text, ["pet", "banho", "tosa", "adestramento", "veterinario", "dog", "gato"])) {
    return {
      ...base,
      pageClass: "bg-teal-50",
      primary,
      accent: "#99F6E4",
      segmentName: "Pet",
      eyebrow: "Plano de cuidado pet",
      intro: "Atendimento, cuidados, orientações e valores organizados para o tutor aprovar com tranquilidade.",
      headerBackground: `linear-gradient(135deg, #134E4A, ${primary})`,
    };
  }
  if (segment === "real_estate" || hasAny(text, ["imovel", "imobiliaria", "condominio", "locacao", "vistoria", "administracao", "sindico"])) {
    return {
      ...base,
      pageClass: "bg-stone-50",
      primary: secondary,
      accent: "#D6D3D1",
      segmentName: "Imóveis",
      eyebrow: "Proposta imobiliaria",
      intro: "Escopo, imóvel atendido, responsabilidades e condições comerciais apresentados com objetividade.",
      headerBackground: `linear-gradient(135deg, #292524, ${secondary} 58%, ${primary})`,
    };
  }
  if (segment === "fashion_retail" || hasAny(text, ["moda", "loja", "varejo", "colecao", "vitrine", "ecommerce", "roupa", "calcado"])) {
    return {
      ...base,
      pageClass: "bg-rose-50",
      primary: accent,
      accent: "#FDA4AF",
      segmentName: "Moda e varejo",
      eyebrow: "Proposta comercial",
      intro: "Produtos, campanha, loja, prazos e entregas alinhados em uma proposta pronta para decisão.",
      headerBackground: `linear-gradient(135deg, #881337, ${secondary} 48%, ${accent})`,
    };
  }
  if (segment === "transport" || hasAny(text, ["transporte", "frete", "logistica", "entrega", "mudanca", "rota", "motoboy"])) {
    return {
      ...base,
      pageClass: "bg-cyan-50",
      primary: secondary,
      accent: "#A5F3FC",
      segmentName: "Transporte",
      eyebrow: "Proposta logística",
      intro: "Rota, prazo, volume, operação e condições de pagamento definidos para aprovar o atendimento.",
      headerBackground: `linear-gradient(135deg, #164E63, ${secondary} 52%, ${primary})`,
    };
  }
  if (segment === "finance" || hasAny(text, ["financeiro", "seguro", "credito", "investimento", "consorcio", "planejamento financeiro"])) {
    return {
      ...base,
      pageClass: "bg-emerald-50",
      primary: secondary,
      accent: "#BBF7D0",
      segmentName: "Financeiro",
      eyebrow: "Proposta financeira",
      intro: "Objetivo, análise, entregáveis e próximos passos organizados para uma decisão segura.",
      headerBackground: `linear-gradient(135deg, #052E16, ${secondary} 58%, ${primary})`,
    };
  }
  if (segment === "industry" || hasAny(text, ["industrial", "industria", "maquina", "equipamento", "manutencao", "usinagem", "solda"])) {
    return {
      ...base,
      pageClass: "bg-neutral-100",
      primary: secondary,
      accent: "#FCD34D",
      segmentName: "Indústria",
      eyebrow: "Proposta técnica",
      intro: "Diagnóstico, execução, materiais, segurança e entrega técnica apresentados com precisão.",
      headerBackground: `linear-gradient(135deg, #171717, ${secondary} 54%, ${primary})`,
    };
  }
  if (segment === "agriculture" || hasAny(text, ["agro", "rural", "fazenda", "plantio", "irrigacao", "maquina agricola", "pecuaria"])) {
    return {
      ...base,
      pageClass: "bg-lime-50",
      primary,
      accent: "#BEF264",
      segmentName: "Agro",
      eyebrow: "Proposta rural",
      intro: "Área atendida, insumos, operação, prazo e suporte descritos para aprovar com segurança.",
      headerBackground: `linear-gradient(135deg, #365314, ${primary})`,
    };
  }
  if (segment === "tourism" || hasAny(text, ["turismo", "viagem", "hospedagem", "hotel", "pousada", "roteiro", "excursao"])) {
    return {
      ...base,
      pageClass: "bg-sky-50",
      primary: accent,
      accent: "#BAE6FD",
      segmentName: "Turismo",
      eyebrow: "Proposta de experiencia",
      intro: "Roteiro, hospedagem, datas, inclusos e condições reunidos para aprovar a experiência.",
      headerBackground: `linear-gradient(135deg, #0C4A6E, ${secondary} 48%, ${accent})`,
    };
  }
  if (segment === "security" || hasAny(text, ["seguranca", "camera", "alarme", "monitoramento", "cftv", "portaria", "controle de acesso"])) {
    return {
      ...base,
      pageClass: "bg-slate-100",
      primary: secondary,
      accent: "#FBBF24",
      segmentName: "Segurança",
      eyebrow: "Proposta de protecao",
      intro: "Diagnóstico, equipamentos, instalação, treinamento e suporte organizados para aprovar o projeto.",
      headerBackground: `linear-gradient(135deg, #020617, ${secondary} 50%, ${primary})`,
    };
  }
  return base;
}

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hasAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function parseCustomFaq(value: string) {
  return value
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts): parts is [string, string] => Boolean(parts[0] && parts[1]));
}

function labelStatus(status: string) {
  const labels: Record<string, string> = {
    accepted: "Aceita",
    declined: "Recusada",
    draft: "Rascunho",
    expired: "Expirada",
    sent: "Enviada",
    awaiting_response: "Aguardando resposta",
    viewed: "Visualizada",
  };
  return labels[status] || status;
}
