import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendProposalViewedEmail } from "@/lib/email";
import { sendProposalPushNotification } from "@/lib/push";

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
  searchParams: Promise<{ accepted?: string; declined?: string; error?: string; name?: string; payment?: string; paymentError?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    include: { user: { include: { brandProfile: true } } },
  });

  if (!proposal) notFound();

  const isFirstView = proposal.status === "sent";
  const currentStatus = isFirstView ? "viewed" : proposal.status;
  const currentViewCount = proposal.viewCount + 1;

  await prisma.proposalAsset.update({
    where: { id: proposal.id },
    data: {
      viewCount: { increment: 1 },
      status: currentStatus,
    },
  });

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
    await sendProposalPushNotification(proposal.userId, {
      title: "Proposta visualizada",
      body: `${proposal.clientName} abriu a proposta de ${proposal.serviceName}.`,
      slug: proposal.publicSlug,
      tag: `proposal-${proposal.publicSlug}-viewed`,
    });
  }

  const [portfolio, testimonials, services] = await Promise.all([
    prisma.portfolioAsset.findMany({
      where: { userId: proposal.userId },
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
  const expired = Boolean(proposal.validUntil && proposal.validUntil < new Date().toISOString().slice(0, 10));
  const hasDecision = expired || currentStatus === "accepted" || currentStatus === "declined";
  const validUntilLabel = proposal.validUntil ? formatDate(proposal.validUntil) : "A combinar";
  const daysLeft = proposal.validUntil ? getDaysLeft(proposal.validUntil) : null;
  const whatsappUrl = brand?.whatsapp
    ? `/api/public/proposals/${proposal.publicSlug}/whatsapp?intent=contact`
    : null;
  const acceptHref = hasDecision ? "#status" : "#aceite";

  return (
    <main className="min-h-screen bg-slate-100 pb-20 text-slate-900">
      <article className="mx-auto grid w-full max-w-5xl gap-5 px-4 py-4 sm:px-6 sm:py-8">
        {query.accepted ? (
          <div className="rounded-lg border border-green-700/20 bg-green-50 p-4 text-green-800 shadow-xl shadow-slate-900/5">
            <strong>Proposta aceita com sucesso.</strong>
            <p className="mt-1 text-sm">Obrigado, {query.name || "cliente"}. O profissional já pode seguir com os próximos passos.</p>
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
            <p className="mt-1 text-sm">Assim que o Asaas confirmar o pagamento, o status será atualizado automaticamente.</p>
          </div>
        ) : null}

        {query.paymentError ? (
          <div className="rounded-lg border border-rose-700/20 bg-rose-50 p-4 text-rose-900 shadow-xl shadow-slate-900/5">
            <strong>Não foi possível abrir o pagamento.</strong>
            <p className="mt-1 text-sm">{query.paymentError}</p>
          </div>
        ) : null}

        {query.error === "whatsapp" ? (
          <div className="rounded-lg border border-amber-700/20 bg-amber-50 p-4 text-amber-900 shadow-xl shadow-slate-900/5">
            <strong>WhatsApp indisponivel.</strong>
            <p className="mt-1 text-sm">O profissional ainda não configurou um número de WhatsApp para esta proposta.</p>
          </div>
        ) : null}

        {expired ? (
          <div className="rounded-lg border border-amber-700/20 bg-amber-50 p-4 text-amber-900 shadow-xl shadow-slate-900/5">
            <strong>Proposta vencida.</strong>
            <p className="mt-1 text-sm">Entre em contato para solicitar uma nova validade.</p>
          </div>
        ) : null}

        <header className="overflow-hidden rounded-lg text-white shadow-xl shadow-slate-900/10" style={{ background: brandSecondaryColor }}>
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${brandColor}, ${brandAccentColor})` }} />
          <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_0.45fr]">
            <div>
              <div className="flex items-center gap-3">
                {brand?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="h-12 w-12 rounded-lg object-cover" src={brand.logoUrl} />
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-lg font-black text-white" style={{ background: brandColor }}>
                    FP
                  </div>
                )}
                <div>
                  <p className="text-xs font-black uppercase" style={{ color: brandAccentColor }}>Proposta comercial online</p>
                  <strong>{brandName}</strong>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-green-200">
                  Link interativo
                </span>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase" style={{ color: brandAccentColor }}>
                  PDF disponível
                </span>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-white/80">
                  Aceite online
                </span>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-white/80">
                  Atendimento em ate 24h
                </span>
              </div>

              <h1 className="mt-5 max-w-2xl text-4xl font-black leading-none sm:text-6xl">
                Proposta para {proposal.clientName}
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-white/75">
                {brand?.bio || "Uma proposta organizada com escopo, investimento, prazo, portfólio e aceite em um único link."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {!hasDecision ? (
                  <a className="inline-flex min-h-12 items-center justify-center rounded-lg px-5 font-black text-slate-950" href="#aceite" style={{ background: brandColor }}>
                    Aceitar proposta
                  </a>
                ) : null}
                <a className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 px-5 font-black text-white" href={`/p/${proposal.publicSlug}/pdf`}>
                  Baixar PDF
                </a>
              </div>
            </div>

            <aside className="grid content-between gap-4 rounded-lg bg-white p-4 text-slate-950">
              <div>
                <span className="inline-flex rounded-lg px-3 py-1 text-xs font-black uppercase text-white" style={{ background: statusColor(currentStatus, expired) }}>
                  {expired ? "Vencida" : labelStatus(currentStatus)}
                </span>
                <p className="mt-5 text-sm font-black uppercase text-slate-500">Investimento</p>
                <strong className="mt-1 block text-4xl font-black">{money.format(proposal.price)}</strong>
                <p className="mt-3 text-sm font-bold text-slate-600">
                  Validade: {validUntilLabel}
                  {daysLeft !== null && daysLeft >= 0 ? ` (${daysLeft === 0 ? "vence hoje" : `${daysLeft} dias`})` : ""}
                </p>
              </div>
              <div className="grid gap-2">
                {!hasDecision ? (
                  <a className="grid min-h-11 place-items-center rounded-lg px-4 text-center font-black text-white" href="#aceite" style={{ background: brandColor }}>
                    Aceitar online
                  </a>
                ) : null}
                <a className="grid min-h-11 place-items-center rounded-lg border border-black/10 px-4 text-center font-black" href={`/p/${proposal.publicSlug}/pdf`}>
                  Baixar PDF
                </a>
              </div>
            </aside>
          </div>
        </header>

        <section className="grid gap-3 rounded-lg border border-black/10 bg-white p-4 shadow-xl shadow-slate-900/5 sm:grid-cols-5">
          <PreviewBox label="Serviço" value={proposal.serviceName} />
          <PreviewBox label="Prazo" value={proposal.deadline} />
          <PreviewBox label="Pagamento" value={proposal.payment || "A combinar"} />
          <PreviewBox label="Visualizações" value={String(currentViewCount)} />
          <PreviewBox label="Cliques WhatsApp" value={String(proposal.whatsappClickCount)} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr] lg:items-start">
          <div className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
            <section>
              <p className="text-xs font-black uppercase text-blue-700">Escopo</p>
              <h2 className="mt-1 text-2xl font-black">Itens inclusos</h2>
              <ul className="mt-4 grid gap-3">
                {(proposal.included.length ? proposal.included : ["Serviço conforme combinado."]).map((item, index) => (
                  <li className="grid grid-cols-[auto_1fr] gap-3 leading-7 text-slate-700" key={`${item}-${index}`}>
                    <span className="mt-1 grid size-6 place-items-center rounded-full text-xs font-black text-white" style={{ background: brandColor }}>
                      OK
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {proposal.notes ? (
              <section className="rounded-lg bg-slate-100 p-4">
                <h2 className="font-black">Observações</h2>
                <p className="mt-2 whitespace-pre-line leading-7 text-slate-700">{proposal.notes}</p>
              </section>
            ) : null}
          </div>

          <aside className="grid gap-4">
            <section className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
              <p className="text-xs font-black uppercase text-blue-700">Pagamento</p>
              <h2 className="mt-1 text-2xl font-black">{proposal.paymentStatus === "paid" ? "Pagamento confirmado" : "Pague com PIX ou cartão"}</h2>
              <p className="mt-2 leading-7 text-slate-600">
                {proposal.paymentStatus === "paid"
                  ? "O Asaas confirmou o pagamento desta proposta."
                  : "Finalize o pagamento em ambiente seguro via Asaas."}
              </p>
              {proposal.paymentStatus === "paid" && proposal.providerReceiptUrl ? (
                <a className="mt-4 grid min-h-11 place-items-center rounded-lg px-5 text-center font-black text-white" href={proposal.providerReceiptUrl} style={{ background: brandColor }} target="_blank">
                  Ver comprovante
                </a>
              ) : (
                <a className="mt-4 grid min-h-12 w-full place-items-center rounded-lg px-5 text-center font-black text-white" href={`/checkout/proposta/${proposal.publicSlug}`} style={{ background: brandColor }}>
                  Pagar agora
                </a>
              )}
            </section>

            <section className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
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

            <section className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
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

        {portfolio.length ? (
          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
            <p className="text-xs font-black uppercase text-blue-700">Prova visual</p>
            <h2 className="mt-1 text-2xl font-black">Portfólio relacionado</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {portfolio.map((item) => (
                <div className="overflow-hidden rounded-lg border border-black/10 bg-white" key={item.id}>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="h-44 w-full object-cover" src={item.imageUrl} />
                  ) : (
                    <div className="grid h-44 place-items-center font-black text-white" style={{ background: brandColor }}>
                      {item.category || "Portfolio"}
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

        {services.length ? (
          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
            <p className="text-xs font-black uppercase text-blue-700">Servicos</p>
            <h2 className="mt-1 text-2xl font-black">Outras formas de contratar</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <div className="rounded-lg border border-black/10 bg-slate-50 p-4" key={service.id}>
                  <strong className="block">{service.name}</strong>
                  <span className="mt-1 block text-sm font-bold text-slate-500">
                    A partir de {money.format(service.price)} {service.deadline ? `- ${service.deadline}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {testimonials.length ? (
          <section className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
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

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5">
          <p className="text-xs font-black uppercase text-blue-700">FAQ</p>
          <h2 className="mt-1 text-2xl font-black">Perguntas frequentes</h2>
          <div className="mt-4 grid gap-3">
            {[
              ["Como aprovo?", "Use o aceite digital nesta página para registrar nome, e-mail, data e hora."],
              ["Posso tirar dúvidas?", "Sim. Use o botão de WhatsApp para conversar antes de aprovar."],
              ["O que acontece depois?", "O profissional recebe a confirmação e combina os próximos passos do serviço."],
            ].map(([question, answer]) => (
              <details className="rounded-lg border border-black/10 bg-slate-50 p-4" key={question}>
                <summary className="cursor-pointer font-black">{question}</summary>
                <p className="mt-2 leading-7 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5" id="status">
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
              <a className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg px-4 font-black text-white" href={`/p/${proposal.publicSlug}/pdf`} style={{ background: brandColor }}>
                Baixar comprovante em PDF
              </a>
            </div>
          ) : null}
        </section>

        {!hasDecision ? (
          <section className="grid gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-xl shadow-slate-900/5" id="aceite">
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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 p-3 shadow-2xl shadow-slate-950/15 backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2">
          <a className="grid min-h-11 place-items-center rounded-lg border border-black/10 px-3 text-center text-sm font-black text-slate-800" href={`/p/${proposal.publicSlug}/pdf`}>
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

function PreviewBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 p-4">
      <dt className="text-xs font-black uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 font-black">{value}</dd>
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
