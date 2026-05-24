import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { sendPixPaymentConfirmedToClientEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sendProposalPushNotification } from "@/lib/push";
import { requireSession } from "@/lib/session";

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

  if (!proposal) return jsonError("Proposta nao encontrada.", 404);
  if (proposal.paymentStatus === "paid") return jsonError("Pagamento ja confirmado.");

  const isPix = proposal.checkoutMode === "pix";
  const updated = await prisma.proposalAsset.update({
    where: { id },
    data: {
      paymentStatus: "paid",
      paymentProvider: isPix ? "pix" : "manual",
      paymentMethod: isPix ? "pix" : "manual",
      paymentPaidAt: new Date(),
      paymentUpdatedAt: new Date(),
    },
  });

  await sendProposalPushNotification(session.id, {
    title: "Pagamento confirmado",
    body: `Pagamento de ${proposal.clientName} registrado.`,
    slug: proposal.publicSlug,
    tag: `proposal-${proposal.publicSlug}-paid`,
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
