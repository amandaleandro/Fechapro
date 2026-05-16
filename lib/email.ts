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
  footer?: string;
};

export async function sendEmail(to: string, subject: string, html: string) {
  if (smtpTransporter) {
    await smtpTransporter.sendMail({ from: FROM, to, subject, html }).catch(() => null);
    return;
  }

  if (!resend) return;
  await resend.emails.send({ from: FROM, to, subject, html }).catch(() => null);
}

export async function sendWelcomeEmail(to: string, name: string) {
  await sendEmail(
    to,
    "Bem-vindo ao FechaPro",
    emailTemplate({
      title: "Sua conta FechaPro está pronta",
      preheader: "Comece criando sua marca, seus serviços e sua primeira proposta.",
      heroImageUrl: `${APP_URL}/email/email-bemvindo.png`,
      heroImageAlt: "Bem-vindo ao FechaPro: guia rapido para comecar",
      intro: `Ola, ${escapeHtml(name)}!`,
      body: `
        <p>Que bom ter você por aqui. O FechaPro foi criado para transformar orçamentos soltos em propostas bonitas, claras e prontas para fechar negócio.</p>
        <p>Para começar bem, configure sua marca, cadastre seus serviços principais e gere sua primeira proposta com link público, PDF e aceite digital.</p>
      `,
      buttonLabel: "Abrir painel",
      buttonUrl: APP_URL,
      footer: "Este email confirma a criacao da sua conta FechaPro.",
    })
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
        <p>Recebemos uma solicitacao para redefinir a senha da sua conta FechaPro.</p>
        <p>Clique no botao abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
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
      intro: `Ola, ${safeClientName}!`,
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
      intro: `Ola, ${safeOwnerName}!`,
      body: `
        <p><strong>${safeClientName}</strong> acabou de abrir sua proposta de <strong>${safeServiceName}</strong>.</p>
        <p>Este pode ser um bom momento para fazer um contato rapido e tirar duvidas.</p>
      `,
      buttonLabel: "Ver proposta",
      buttonUrl: link,
    })
  );
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
      intro: `Ola, ${safeOwnerName}!`,
      body: `
        <p><strong>${safeClientName}</strong> aceitou sua proposta de <strong>${safeServiceName}</strong>.</p>
        <p>Entre em contato com o cliente para combinar os proximos passos e formalizar o atendimento.</p>
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
    `Confirmacao de aceite - ${serviceName}`,
    emailTemplate({
      title: "Aceite registrado",
      preheader: `Seu aceite da proposta de ${serviceName} foi registrado.`,
      intro: `Ola, ${safeClientName}!`,
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
      intro: `Ola, ${safeOwnerName}!`,
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
      intro: `Ola, ${safeClientName}!`,
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
      intro: `Ola, ${safeClientName}!`,
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

export async function sendProposalWhatsAppIntentEmail(ownerEmail: string, ownerName: string, clientName: string, serviceName: string, intent: string, slug: string) {
  const link = `${APP_URL}/p/${slug}`;
  const safeOwnerName = escapeHtml(ownerName);
  const safeClientName = escapeHtml(clientName);
  const safeServiceName = escapeHtml(serviceName);
  const intentLabel = intent === "negotiate" ? "quer negociar" : intent === "doubt" ? "tem uma duvida" : "clicou no WhatsApp";

  await sendEmail(
    ownerEmail,
    `${clientName} chamou no WhatsApp - FechaPro`,
    emailTemplate({
      title: "Cliente chamou no WhatsApp",
      preheader: `${clientName} interagiu com sua proposta pelo WhatsApp.`,
      intro: `Ola, ${safeOwnerName}!`,
      body: `
        <p><strong>${safeClientName}</strong> ${intentLabel} na proposta de <strong>${safeServiceName}</strong>.</p>
        <p>Responda enquanto o interesse ainda está quente.</p>
      `,
      buttonLabel: "Ver proposta",
      buttonUrl: link,
    })
  );
}

function emailTemplate({ title, preheader, heroImageUrl, heroImageAlt, intro, body, buttonLabel, buttonUrl, footer }: EmailTemplateOptions) {
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
