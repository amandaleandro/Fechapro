import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "FechaPro <noreply@fechapro.app>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) return;
  await resend.emails.send({ from: FROM, to, subject, html }).catch(() => null);
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${APP_URL}/redefinir-senha?token=${encodeURIComponent(token)}`;
  await sendEmail(
    to,
    "Redefinir senha - FechaPro",
    `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:#111">Redefinir sua senha</h2>
      <p style="color:#444;line-height:1.6">
        Recebemos uma solicitação para redefinir a senha da sua conta FechaPro.
        Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.
      </p>
      <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#106b5b;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
        Redefinir senha
      </a>
      <p style="color:#888;font-size:13px">
        Se você não solicitou a redefinição, ignore este e-mail.
      </p>
    </div>
    `
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
    `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:#111">Você recebeu uma proposta!</h2>
      <p style="color:#444;line-height:1.6">
        Olá, <strong>${safeClientName}</strong>!
        <strong>${safeOwnerName}</strong> preparou uma proposta de <strong>${safeServiceName}</strong> especialmente para você.
        Clique no botão abaixo para visualizar, aceitar ou recusar.
      </p>
      <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#106b5b;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
        Ver proposta
      </a>
      <p style="color:#888;font-size:13px">
        Este e-mail foi enviado porque você recebeu uma proposta comercial via FechaPro.
      </p>
    </div>
    `
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
    `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:#111">Proposta visualizada!</h2>
      <p style="color:#444;line-height:1.6">
        Olá, <strong>${safeOwnerName}</strong>!
        <strong>${safeClientName}</strong> acabou de abrir sua proposta de <strong>${safeServiceName}</strong>.
        Agora é uma boa hora para um contato.
      </p>
      <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#106b5b;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
        Ver proposta
      </a>
    </div>
    `
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
    `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:#111">Proposta aceita!</h2>
      <p style="color:#444;line-height:1.6">
        Olá, <strong>${safeOwnerName}</strong>!
        <strong>${safeClientName}</strong> aceitou sua proposta de <strong>${safeServiceName}</strong>.
      </p>
      <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#106b5b;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
        Ver proposta
      </a>
    </div>
    `
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
    `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <h2 style="margin:0 0 16px;color:#111">Proposta recusada</h2>
      <p style="color:#444;line-height:1.6">
        Olá, <strong>${safeOwnerName}</strong>!
        <strong>${safeClientName}</strong> recusou sua proposta de <strong>${safeServiceName}</strong>.
      </p>
      ${safeReason ? `<p style="color:#444;line-height:1.6"><strong>Motivo:</strong> ${safeReason}</p>` : ""}
      <p style="color:#888;font-size:13px">
        Você pode revisar a proposta e enviar uma nova versão pelo FechaPro.
      </p>
    </div>
    `
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
