import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { sendProposalSentToClientEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

const RESENDABLE_STATUSES = ["sent", "declined", "expired", "viewed"];

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await context.params;

  const proposal = await prisma.proposalAsset.findFirst({
    where: { id, userId: session.id },
    include: { user: { select: { name: true } } },
  });

  if (!proposal) {
    return jsonError("Proposta não encontrada.", 404);
  }

  if (!RESENDABLE_STATUSES.includes(proposal.status)) {
    return jsonError("Esta proposta não pode ser reenviada.", 400);
  }

  const updated = await prisma.proposalAsset.update({
    where: { id },
    data: {
      status: "sent",
      declinedReason: null,
      declinedAt: null,
    },
  });

  let clientEmailSent = false;
  if (proposal.clientEmail) {
    await sendProposalSentToClientEmail(
      proposal.clientEmail,
      proposal.clientName,
      proposal.user.name,
      proposal.serviceName,
      proposal.publicSlug
    );
    clientEmailSent = true;
  }

  return NextResponse.json({ ...updated, clientEmailSent });
}
