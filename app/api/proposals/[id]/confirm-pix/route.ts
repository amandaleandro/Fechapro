import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sendProposalPushNotification } from "@/lib/push";
import { sendPixPaymentConfirmedToClientEmail } from "@/lib/email";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;

  const proposal = await prisma.proposalAsset.findFirst({
    where: { id, userId: session.id },
    select: {
      id: true,
      publicSlug: true,
      checkoutMode: true,
      paymentStatus: true,
      clientName: true,
      serviceName: true,
      clientEmail: true,
      user: { select: { name: true } },
    },
  });

  if (!proposal) return jsonError("Proposta não encontrada.", 404);
  if (proposal.checkoutMode !== "pix") return jsonError("Esta proposta não usa pagamento PIX.");
  if (proposal.paymentStatus === "paid") return jsonError("Pagamento já confirmado.");

  const updated = await prisma.proposalAsset.update({
    where: { id },
    data: {
      paymentStatus: "paid",
      paymentProvider: "pix",
      paymentMethod: "pix",
      paymentPaidAt: new Date(),
      paymentUpdatedAt: new Date(),
    },
  });

  await sendProposalPushNotification(session.id, {
    title: "PIX confirmado",
    body: `Pagamento PIX de ${proposal.clientName} registrado.`,
    slug: proposal.publicSlug,
    tag: `proposal-${proposal.publicSlug}-pix-paid`,
  });

  if (proposal.clientEmail) {
    await sendPixPaymentConfirmedToClientEmail(
      proposal.clientEmail,
      proposal.clientName,
      proposal.user.name,
      proposal.serviceName,
      proposal.publicSlug
    );
  }

  return NextResponse.json(updated);
}
