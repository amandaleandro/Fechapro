import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "FechaPro <noreply@fechapro.app>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || "465");
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpSecure = (process.env.SMTP_SECURE || "true") === "true";

const smtpTransporter =
  smtpHost && smtpUser && smtpPassword
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      })
    : null;

type EmailTemplateOptions = {
  title: string;
  preheader: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  intro?: string;
  body: string;
  buttonLabel?: string;
  buttonUrl?: string;
  secondaryButtonLabel?: string;
  secondaryButtonUrl?: string;
  footer?: string;
};

type SendEmailOptions = {
  replyTo?: string;
  listUnsubscribeUrl?: string;
};

type MarketingEmailKey =
  | "activationDay1"
  | "activationDay3"
  | "proposalFollowUp"
  | "upgradeNudge"
  | "weeklyDigest"
  | "winBack"
  | "trialEnding"
  | "newFeature";

type MarketingEmailContext = {
  name: string;
  businessName?: string | null;
  proposalCount?: number;
  acceptedProposalCount?: number;
  planName?: string;
  featureName?: string;
  unsubscribeToken?: string;
};

type MarketingEmailDefinition = {
  subject: string;
  template: EmailTemplateOptions;
};

export async function sendEmail(to: string, subject: string, html: string, options: SendEmailOptions = {}) {
  const headers = options.listUnsubscribeUrl ? { "List-Unsubscribe": `<${options.listUnsubscribeUrl}>` } : undefined;

  if (smtpTransporter) {
    await smtpTransporter.sendMail({ from: FROM, to, subject, html, replyTo: options.replyTo, headers }).catch(() => null);
    return;
  }

  if (!resend) return;
  await resend.emails.send({ from: FROM, to, subject, html, replyTo: options.replyTo, headers }).catch(() => null);
}

export async function sendWelcomeEmail(to: string, name: string) {
  const manualUrl = `${APP_URL}/manual/manual-fechapro-primeiro-acesso.pdf`;

  await sendEmail(
    to,
    "Bem-vindo ao FechaPro",
    emailTemplate({
      title: "Sua conta FechaPro está pronta",
      preheader: "Comece criando sua marca, seus serviços e sua primeira proposta.",
      heroImageUrl: `${APP_URL}/email/email-bemvindo.png`,
      heroImageAlt: "Bem-vindo ao FechaPro: guia rápido para começar",
      intro: `Olá, ${escapeHtml(name)}!`,
      body: `
        <p>Que bom ter você por aqui. O FechaPro foi criado para transformar orçamentos soltos em propostas bonitas, claras e prontas para fechar negócio.</p>
        <p>Para começar bem, configure sua marca, cadastre seus serviços principais e gere sua primeira proposta com link público, PDF e aceite digital.</p>
      `,
      buttonLabel: "Abrir painel",
      buttonUrl: APP_URL,
      secondaryButtonLabel: "Abrir manual de primeiro acesso",
      secondaryButtonUrl: manualUrl,
      footer: "Este email confirma a criação da sua conta FechaPro.",
    })
  );
}

export async function sendMarketingEmail(to: string, key: MarketingEmailKey, context: MarketingEmailContext) {
  const definition = marketingEmailDefinition(key, context);
  const unsubscribeUrl = context.unsubscribeToken ? `${APP_URL}/api/marketing/unsubscribe?token=${encodeURIComponent(context.unsubscribeToken)}` : undefined;
  const footer = unsubscribeUrl
    ? `${definition.template.footer || "Você recebeu este email porque tem uma conta FechaPro."} Para sair dos emails de marketing, acesse: ${unsubscribeUrl}`
    : definition.template.footer;

  await sendEmail(
    to,
    definition.subject,
    emailTemplate({
      ...definition.template,
      footer,
    }),
    { listUnsubscribeUrl: unsubscribeUrl }
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${APP_URL}/redefinir-senha?token=${encodeURIComponent(token)}`;
  await sendEmail(
    to,
    "Redefinir senha - FechaPro",
    emailTemplate({
      title: "Redefinir sua senha",
      preheader: "Use este link para criar uma nova senha. Ele expira em 1 hora.",
      body: `
        <p>Recebemos uma solicitação para redefinir a senha da sua conta FechaPro.</p>
        <p>Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
      `,
      buttonLabel: "Redefinir senha",
      buttonUrl: link,
      footer: "Se você não solicitou a redefinição, ignore este email.",
    })
  );
}

export async function sendProposalSentToClientEmail(clientEmail: string, clientName: string, ownerName: string, serviceName: string, slug: string) {
  const link = `${APP_URL}/p/${slug}`;
  const safeClientName = escapeHtml(clientName);
  const safeOwnerName = escapeHtml(ownerName);
  const safeServiceName = escapeHtml(serviceName);

  await sendEmail(
    clientEmail,
    `${ownerName} enviou uma proposta para você - FechaPro`,
    emailTemplate({
      title: "Você recebeu uma proposta",
      preheader: `${ownerName} preparou uma proposta de ${serviceName} para você.`,
      intro: `Olá, ${safeClientName}!`,
      body: `
        <p><strong>${safeOwnerName}</strong> preparou uma proposta de <strong>${safeServiceName}</strong> especialmente para você.</p>
        <p>Acesse o link para visualizar os detalhes, baixar o PDF e registrar sua resposta.</p>
      `,
      buttonLabel: "Ver proposta",
      buttonUrl: link,
      footer: "Este email foi enviado porque você recebeu uma proposta comercial via FechaPro.",
    })
  );
}

export async function sendProposalViewedEmail(ownerEmail: string, ownerName: string, clientName: string, serviceName: string, slug: string) {
  const link = `${APP_URL}/p/${slug}`;
  const safeOwnerName = escapeHtml(ownerName);
  const safeClientName = escapeHtml(clientName);
  const safeServiceName = escapeHtml(serviceName);

  await sendEmail(
    ownerEmail,
    `${clientName} abriu sua proposta - FechaPro`,
    emailTemplate({
      title: "Sua proposta foi visualizada",
      preheader: `${clientName} acabou de abrir sua proposta de ${serviceName}.`,
      intro: `Olá, ${safeOwnerName}!`,
      body: `
        <p><strong>${safeClientName}</strong> acabou de abrir sua proposta de <strong>${safeServiceName}</strong>.</p>
        <p>Este pode ser um bom momento para fazer um contato rápido e tirar dúvidas.</p>
      `,
      buttonLabel: "Ver proposta",
      buttonUrl: link,
    })
  );
}

export async function sendProposalFollowUpEmail(ownerEmail: string, ownerName: string, businessName: string | null | undefined, proposalCount: number, acceptedProposalCount: number) {
  await sendMarketingEmail(ownerEmail, "proposalFollowUp", {
    name: ownerName,
    businessName,
    proposalCount,
    acceptedProposalCount,
  });
}

export async function sendProposalAcceptedEmail(ownerEmail: string, ownerName: string, clientName: string, serviceName: string, slug: string) {
  const link = `${APP_URL}/p/${slug}`;
  const safeOwnerName = escapeHtml(ownerName);
  const safeClientName = escapeHtml(clientName);
  const safeServiceName = escapeHtml(serviceName);

  await sendEmail(
    ownerEmail,
    `Proposta aceita por ${clientName} - FechaPro`,
    emailTemplate({
      title: "Proposta aceita",
      preheader: `${clientName} aceitou sua proposta de ${serviceName}.`,
      intro: `Olá, ${safeOwnerName}!`,
      body: `
        <p><strong>${safeClientName}</strong> aceitou sua proposta de <strong>${safeServiceName}</strong>.</p>
        <p>Entre em contato com o cliente para combinar os próximos passos e formalizar o atendimento.</p>
      `,
      buttonLabel: "Ver proposta",
      buttonUrl: link,
    })
  );
}

export async function sendProposalAcceptedToClientEmail(clientEmail: string, clientName: string, ownerName: string, serviceName: string, slug: string) {
  const link = `${APP_URL}/p/${slug}`;
  const safeClientName = escapeHtml(clientName);
  const safeOwnerName = escapeHtml(ownerName);
  const safeServiceName = escapeHtml(serviceName);

  await sendEmail(
    clientEmail,
    `Confirmação de aceite - ${serviceName}`,
    emailTemplate({
      title: "Aceite registrado",
      preheader: `Seu aceite da proposta de ${serviceName} foi registrado.`,
      intro: `Olá, ${safeClientName}!`,
      body: `
        <p>Confirmamos o aceite da proposta de <strong>${safeServiceName}</strong>, enviada por <strong>${safeOwnerName}</strong>.</p>
        <p>O responsável pela proposta também foi notificado e deve entrar em contato para combinar os próximos passos.</p>
      `,
      buttonLabel: "Ver proposta",
      buttonUrl: link,
      footer: "Este email confirma o aceite digital registrado pelo FechaPro.",
    })
  );
}

export async function sendSatisfactionSurveyEmail(clientEmail: string, clientName: string, ownerName: string, serviceName: string, slug: string) {
  const link = `${APP_URL}/p/${slug}#satisfacao`;
  const safeClientName = escapeHtml(clientName);
  const safeOwnerName = escapeHtml(ownerName);
  const safeServiceName = escapeHtml(serviceName);

  await sendEmail(
    clientEmail,
    `Como foi o atendimento? - ${serviceName}`,
    emailTemplate({
      title: "Conte como foi o atendimento",
      preheader: `${ownerName} quer saber como foi sua experiência com ${serviceName}.`,
      intro: `Olá, ${safeClientName}!`,
      body: `
        <p><strong>${safeOwnerName}</strong> marcou o serviço <strong>${safeServiceName}</strong> como concluído e enviou uma pesquisa rápida de satisfação.</p>
        <p>Sua resposta ajuda a melhorar o atendimento e, se você autorizar, pode virar depoimento para novos clientes.</p>
      `,
      buttonLabel: "Responder pesquisa",
      buttonUrl: link,
      footer: "Este email foi enviado porque você recebeu uma proposta pelo FechaPro.",
    })
  );
}

export async function sendProposalDeclinedEmail(ownerEmail: string, ownerName: string, clientName: string, serviceName: string, reason: string | null) {
  const safeOwnerName = escapeHtml(ownerName);
  const safeClientName = escapeHtml(clientName);
  const safeServiceName = escapeHtml(serviceName);
  const safeReason = reason ? escapeHtml(reason) : null;

  await sendEmail(
    ownerEmail,
    `Proposta recusada por ${clientName} - FechaPro`,
    emailTemplate({
      title: "Proposta recusada",
      preheader: `${clientName} recusou sua proposta de ${serviceName}.`,
      intro: `Olá, ${safeOwnerName}!`,
      body: `
        <p><strong>${safeClientName}</strong> recusou sua proposta de <strong>${safeServiceName}</strong>.</p>
        ${safeReason ? `<p><strong>Motivo informado:</strong> ${safeReason}</p>` : ""}
        <p>Você pode revisar a proposta e enviar uma nova versão pelo FechaPro.</p>
      `,
    })
  );
}

export async function sendProposalDeclinedToClientEmail(clientEmail: string, clientName: string, ownerName: string, serviceName: string, reason: string | null, slug: string) {
  const link = `${APP_URL}/p/${slug}`;
  const safeClientName = escapeHtml(clientName);
  const safeOwnerName = escapeHtml(ownerName);
  const safeServiceName = escapeHtml(serviceName);
  const safeReason = reason ? escapeHtml(reason) : null;

  await sendEmail(
    clientEmail,
    `Resposta registrada - ${serviceName}`,
    emailTemplate({
      title: "Resposta registrada",
      preheader: `Registramos sua recusa da proposta de ${serviceName}.`,
      intro: `Olá, ${safeClientName}!`,
      body: `
        <p>Registramos sua recusa da proposta de <strong>${safeServiceName}</strong>, enviada por <strong>${safeOwnerName}</strong>.</p>
        ${safeReason ? `<p><strong>Motivo informado:</strong> ${safeReason}</p>` : ""}
        <p>O responsável pela proposta também foi notificado.</p>
      `,
      buttonLabel: "Ver proposta",
      buttonUrl: link,
      footer: "Este email confirma a resposta registrada pelo FechaPro.",
    })
  );
}

export async function sendPixPaymentConfirmedToClientEmail(clientEmail: string, clientName: string, ownerName: string, serviceName: string, slug: string) {
  const link = `${APP_URL}/p/${slug}`;
  const safeClientName = escapeHtml(clientName);
  const safeOwnerName = escapeHtml(ownerName);
  const safeServiceName = escapeHtml(serviceName);

  await sendEmail(
    clientEmail,
    `Pagamento PIX confirmado - ${serviceName}`,
    emailTemplate({
      title: "Pagamento confirmado",
      preheader: `${ownerName} confirmou o recebimento do PIX para ${serviceName}.`,
      intro: `Olá, ${safeClientName}!`,
      body: `
        <p><strong>${safeOwnerName}</strong> confirmou o recebimento do seu pagamento via PIX para <strong>${safeServiceName}</strong>.</p>
        <p>O atendimento está confirmado. Em breve o profissional entrará em contato para combinar os próximos passos.</p>
      `,
      buttonLabel: "Ver proposta",
      buttonUrl: link,
      footer: "Este email confirma o pagamento PIX registrado pelo FechaPro.",
    })
  );
}

export type ProposalFollowUpVariant = "not_viewed" | "viewed_no_response";

export async function sendProposalFollowUpReminderEmail(
  ownerEmail: string,
  ownerName: string,
  clientName: string,
  serviceName: string,
  slug: string,
  daysSince: number,
  variant: ProposalFollowUpVariant = "not_viewed",
) {
  const link = `${APP_URL}/p/${slug}`;
  const safeOwnerName = escapeHtml(ownerName);
  const safeClientName = escapeHtml(clientName);
  const safeServiceName = escapeHtml(serviceName);
  const dias = `${daysSince} dia${daysSince === 1 ? "" : "s"}`;
  const viewed = variant === "viewed_no_response";

  const subject = viewed
    ? `${clientName} viu sua proposta mas ainda não respondeu - FechaPro`
    : `${clientName} ainda não visualizou sua proposta - FechaPro`;

  const body = viewed
    ? `
        <p>Sua proposta de <strong>${safeServiceName}</strong> para <strong>${safeClientName}</strong> foi <strong>visualizada</strong>, mas ainda não houve resposta há <strong>${dias}</strong>.</p>
        <p>O interesse existe — vale uma mensagem rápida para tirar dúvidas e ajudar a fechar.</p>
      `
    : `
        <p>Sua proposta de <strong>${safeServiceName}</strong> para <strong>${safeClientName}</strong> foi enviada há <strong>${dias}</strong> e ainda não foi visualizada.</p>
        <p>Este pode ser um bom momento para enviar uma mensagem rápida e perguntar se chegou bem.</p>
      `;

  await sendEmail(
    ownerEmail,
    subject,
    emailTemplate({
      title: viewed ? "Proposta vista sem resposta" : "Proposta sem visualização",
      preheader: viewed
        ? `${clientName} abriu sua proposta de ${serviceName} mas não respondeu em ${dias}.`
        : `${clientName} não abriu sua proposta de ${serviceName} em ${dias}.`,
      intro: `Olá, ${safeOwnerName}!`,
      body,
      buttonLabel: "Ver proposta",
      buttonUrl: link,
      footer: "Lembrete automático do FechaPro para acompanhamento de propostas.",
    })
  );
}

export async function sendProposalWhatsAppIntentEmail(ownerEmail: string, ownerName: string, clientName: string, serviceName: string, intent: string, slug: string) {
  const link = `${APP_URL}/p/${slug}`;
  const safeOwnerName = escapeHtml(ownerName);
  const safeClientName = escapeHtml(clientName);
  const safeServiceName = escapeHtml(serviceName);
  const intentLabel = intent === "negotiate" ? "quer negociar" : intent === "doubt" ? "tem uma dúvida" : "clicou no WhatsApp";

  await sendEmail(
    ownerEmail,
    `${clientName} chamou no WhatsApp - FechaPro`,
    emailTemplate({
      title: "Cliente chamou no WhatsApp",
      preheader: `${clientName} interagiu com sua proposta pelo WhatsApp.`,
      intro: `Olá, ${safeOwnerName}!`,
      body: `
        <p><strong>${safeClientName}</strong> ${intentLabel} na proposta de <strong>${safeServiceName}</strong>.</p>
        <p>Responda enquanto o interesse ainda está quente.</p>
      `,
      buttonLabel: "Ver proposta",
      buttonUrl: link,
    })
  );
}

function emailTemplate({ title, preheader, heroImageUrl, heroImageAlt, intro, body, buttonLabel, buttonUrl, secondaryButtonLabel, secondaryButtonUrl, footer }: EmailTemplateOptions) {
  const safeTitle = escapeHtml(title);
  const safePreheader = escapeHtml(preheader);
  const heroImage = heroImageUrl
    ? `
      <tr>
        <td style="padding:0;background:#ffffff">
          <img src="${escapeHtml(heroImageUrl)}" alt="${escapeHtml(heroImageAlt || title)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0">
        </td>
      </tr>
    `
    : "";
  const button =
    buttonLabel && buttonUrl
      ? `
        <tr>
          <td style="padding:8px 32px 28px">
            <a href="${escapeHtml(buttonUrl)}" style="display:inline-block;border-radius:8px;background:#106b5b;color:#ffffff;font-size:15px;font-weight:700;line-height:1;text-decoration:none;padding:14px 22px">
              ${escapeHtml(buttonLabel)}
            </a>
            ${
              secondaryButtonLabel && secondaryButtonUrl
                ? `
                  <a href="${escapeHtml(secondaryButtonUrl)}" style="display:inline-block;margin-left:10px;border-radius:8px;border:1px solid #106b5b;color:#106b5b;background:#ffffff;font-size:15px;font-weight:700;line-height:1;text-decoration:none;padding:13px 20px">
                    ${escapeHtml(secondaryButtonLabel)}
                  </a>
                `
                : ""
            }
          </td>
        </tr>
      `
      : "";

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${safeTitle}</title>
      </head>
      <body style="margin:0;background:#f5f7f6;font-family:Arial,Helvetica,sans-serif;color:#1f2933">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${safePreheader}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f7f6;padding:28px 12px">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dfe8e4;border-radius:14px;overflow:hidden">
                <tr>
                  <td style="background:#106b5b;padding:22px 32px;color:#ffffff">
                    <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">FechaPro</div>
                    <h1 style="margin:12px 0 0;font-size:26px;line-height:1.2;color:#ffffff">${safeTitle}</h1>
                  </td>
                </tr>
                ${heroImage}
                <tr>
                  <td style="padding:30px 32px 12px;color:#344054;font-size:16px;line-height:1.65">
                    ${intro ? `<p style="margin:0 0 16px">${intro}</p>` : ""}
                    <div style="margin:0">${body}</div>
                  </td>
                </tr>
                ${button}
                <tr>
                  <td style="padding:22px 32px;background:#f8faf9;border-top:1px solid #e6eeea;color:#667085;font-size:13px;line-height:1.5">
                    ${footer ? escapeHtml(footer) : "Mensagem enviada pelo FechaPro."}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function marketingEmailDefinition(key: MarketingEmailKey, context: MarketingEmailContext): MarketingEmailDefinition {
  const firstName = escapeHtml(context.name.trim().split(/\s+/)[0] || "tudo bem");
  const businessName = context.businessName ? escapeHtml(context.businessName) : "sua marca";
  const proposalCount = context.proposalCount ?? 0;
  const acceptedProposalCount = context.acceptedProposalCount ?? 0;
  const planName = escapeHtml(context.planName || "um plano maior");
  const featureName = escapeHtml(context.featureName || "uma novidade");

  const definitions: Record<MarketingEmailKey, MarketingEmailDefinition> = {
    activationDay1: {
      subject: "Seu primeiro fechamento começa pela primeira proposta",
      template: {
        title: "Crie sua primeira proposta no FechaPro",
        preheader: "Configure sua marca, cadastre um serviço e envie um link profissional hoje.",
        intro: `Olá, ${firstName}!`,
        body: `
          <p>O jeito mais rápido de sentir valor no FechaPro é criar uma proposta real, mesmo que seja para um cliente em negociação.</p>
          <p>Comece por três passos: ajuste a identidade de <strong>${businessName}</strong>, cadastre seu serviço principal e gere o link da proposta para enviar no WhatsApp ou email.</p>
        `,
        buttonLabel: "Criar proposta",
        buttonUrl: `${APP_URL}/?view=proposals`,
        footer: "Email de onboarding do FechaPro.",
      },
    },
    activationDay3: {
      subject: "Seu painel fica melhor quando sua marca aparece",
      template: {
        title: "Deixe suas propostas com cara de marca",
        preheader: "Logo, cores, WhatsApp e PIX deixam cada proposta pronta para vender.",
        intro: `Olá, ${firstName}!`,
        body: `
          <p>Uma proposta com identidade clara passa mais confiança antes mesmo do cliente ler o preço.</p>
          <p>Complete logo, cores, WhatsApp, portfólio e depoimentos para transformar cada link em uma experiência comercial mais forte.</p>
        `,
        buttonLabel: "Configurar marca",
        buttonUrl: `${APP_URL}/?view=brand`,
        footer: "Email de ativação do FechaPro.",
      },
    },
    proposalFollowUp: {
      subject: "Uma proposta enviada merece acompanhamento",
      template: {
        title: "Acompanhe suas propostas abertas",
        preheader: "Veja visualizações, respostas e pagamentos para priorizar o próximo contato.",
        intro: `Olá, ${firstName}!`,
        body: `
          <p>Você já criou <strong>${proposalCount}</strong> proposta${proposalCount === 1 ? "" : "s"} no FechaPro.</p>
          <p>Abra a lista de propostas para ver quais clientes visualizaram, quais ainda precisam de resposta e onde vale fazer um follow-up agora.</p>
        `,
        buttonLabel: "Ver propostas",
        buttonUrl: `${APP_URL}/?view=proposals`,
        footer: "Email de acompanhamento comercial do FechaPro.",
      },
    },
    upgradeNudge: {
      subject: "Hora de acelerar o fluxo comercial?",
      template: {
        title: "Recursos extras para vender com mais ritmo",
        preheader: "Templates, artes, portfólio e limites maiores ajudam quando a operação cresce.",
        intro: `Olá, ${firstName}!`,
        body: `
          <p>Quando propostas passam a fazer parte da rotina, pequenos atalhos economizam muito tempo.</p>
          <p>O plano <strong>${planName}</strong> libera mais estrutura para criar, organizar e acompanhar oportunidades sem montar tudo do zero.</p>
        `,
        buttonLabel: "Comparar planos",
        buttonUrl: `${APP_URL}/?view=plans`,
        footer: "Email promocional do FechaPro.",
      },
    },
    weeklyDigest: {
      subject: "Resumo da sua semana no FechaPro",
      template: {
        title: "Seu resumo comercial",
        preheader: "Veja propostas criadas, aceites e próximas ações recomendadas.",
        intro: `Olá, ${firstName}!`,
        body: `
          <p>Nesta semana, seu painel registrou <strong>${proposalCount}</strong> proposta${proposalCount === 1 ? "" : "s"} e <strong>${acceptedProposalCount}</strong> aceite${acceptedProposalCount === 1 ? "" : "s"}.</p>
          <p>Revise as propostas pendentes e transforme oportunidades paradas em próximos passos claros.</p>
        `,
        buttonLabel: "Abrir dashboard",
        buttonUrl: APP_URL,
        footer: "Resumo periódico do FechaPro.",
      },
    },
    winBack: {
      subject: "Suas propostas ainda podem trabalhar por você",
      template: {
        title: "Volte com um próximo envio simples",
        preheader: "Reative seu painel criando uma proposta ou atualizando seus serviços.",
        intro: `Olá, ${firstName}!`,
        body: `
          <p>Se o comercial ficou corrido, retomar pode ser simples: atualize um serviço, escolha um template e envie uma proposta nova ainda hoje.</p>
          <p>O FechaPro guarda sua estrutura para você não precisar recomeçar.</p>
        `,
        buttonLabel: "Retomar painel",
        buttonUrl: APP_URL,
        footer: "Email de reativação do FechaPro.",
      },
    },
    trialEnding: {
      subject: "Garanta a continuidade do seu FechaPro",
      template: {
        title: "Seu acesso precisa de atenção",
        preheader: "Escolha um plano para manter propostas, templates e acompanhamento ativos.",
        intro: `Olá, ${firstName}!`,
        body: `
          <p>Para continuar usando suas propostas, clientes e materiais comerciais sem interrupção, escolha o plano que combina com sua rotina.</p>
          <p>Se você já tem propostas em negociação, manter o painel ativo ajuda a acompanhar respostas no momento certo.</p>
        `,
        buttonLabel: "Escolher plano",
        buttonUrl: `${APP_URL}/?view=plans`,
        footer: "Email sobre continuidade de acesso ao FechaPro.",
      },
    },
    newFeature: {
      subject: `Novidade no FechaPro: ${featureName}`,
      template: {
        title: featureName,
        preheader: "Uma melhoria nova para deixar seu processo comercial mais simples.",
        intro: `Olá, ${firstName}!`,
        body: `
          <p>Tem recurso novo no FechaPro para ajudar sua rotina comercial a ficar mais leve e organizada.</p>
          <p>Abra o painel, teste a novidade e veja onde ela pode economizar tempo no seu processo de venda.</p>
        `,
        buttonLabel: "Ver novidade",
        buttonUrl: APP_URL,
        footer: "Email de novidades do produto FechaPro.",
      },
    },
  };

  return definitions[key];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
