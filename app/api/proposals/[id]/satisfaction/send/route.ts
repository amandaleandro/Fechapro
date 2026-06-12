import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { sendSatisfactionSurveyEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { buildSatisfactionSurveyClientWhatsAppUrl, sendSatisfactionSurveyToClientViaWhatsApp } from "@/lib/whatsapp";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;

  const proposal = await prisma.proposalAsset.findFirst({
    where: { id, userId: session.id },
    include: {
      satisfactionSurvey: true,
      user: { select: { name: true } },
    },
  });

  if (!proposal) return jsonError("Proposta nao encontrada.", 404);
  if (proposal.status !== "accepted") return jsonError("Envie a pesquisa apenas depois da proposta aceita.", 400);
  if (!proposal.clientEmail && !proposal.acceptedEmail && !proposal.clientPhone && !proposal.acceptedPhone) {
    return jsonError("Cadastre um e-mail ou WhatsApp do cliente para enviar a pesquisa.", 400);
  }

  const clientEmail = proposal.acceptedEmail || proposal.clientEmail || null;
  const clientPhone = proposal.acceptedPhone || proposal.clientPhone || null;
  const clientName = proposal.acceptedBy || proposal.clientName;
  const now = new Date();

  const survey = await prisma.satisfactionSurvey.upsert({
    where: { proposalId: proposal.id },
    create: {
      proposalId: proposal.id,
      userId: session.id,
      clientName,
      clientEmail,
      serviceCompletedAt: now,
      sentAt: now,
    },
    update: {
      clientName,
      clientEmail,
      serviceCompletedAt: proposal.satisfactionSurvey?.serviceCompletedAt || now,
      sentAt: now,
    },
  });

  let emailSent = false;
  let whatsappSent = false;
  let whatsappUrl: string | null = null;

  if (clientEmail) {
    await sendSatisfactionSurveyEmail(clientEmail, clientName, proposal.user.name, proposal.serviceName, proposal.publicSlug);
    emailSent = true;
  }

  if (clientPhone) {
    whatsappUrl = buildSatisfactionSurveyClientWhatsAppUrl(clientPhone, proposal.user.name, proposal.serviceName, proposal.publicSlug);
    whatsappSent = await sendSatisfactionSurveyToClientViaWhatsApp(clientPhone, proposal.user.name, proposal.serviceName, proposal.publicSlug);
  }

  return NextResponse.json({ ...survey, emailSent, whatsappSent, whatsappUrl });
}
