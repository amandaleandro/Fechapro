import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendProposalWhatsAppIntentEmail } from "@/lib/email";

const intentMessages: Record<string, string> = {
  approve: "Olá, vi a proposta e quero aprovar.",
  doubt: "Olá, vi a proposta e tenho uma dúvida.",
  negotiate: "Olá, vi a proposta e quero negociar.",
  contact: "Olá, vi a proposta e quero falar sobre ela.",
};

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent") || "contact";

  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    select: {
      clientName: true,
      serviceName: true,
      status: true,
      user: {
        select: {
          email: true,
          name: true,
          brandProfile: { select: { whatsapp: true } },
        },
      },
    },
  });

  const phone = proposal?.user.brandProfile?.whatsapp?.replace(/\D/g, "");
  if (!proposal || !phone) redirect(`/p/${slug}?error=whatsapp`);

  const message = intentMessages[intent] || intentMessages.contact;
  const nextStatus = ["sent", "viewed"].includes(proposal.status) ? "awaiting_response" : proposal.status;

  await prisma.proposalAsset.update({
    where: { publicSlug: slug },
    data: {
      whatsappClickCount: { increment: 1 },
      status: nextStatus,
    },
  });

  if (proposal.user.email) {
    await sendProposalWhatsAppIntentEmail(
      proposal.user.email,
      proposal.user.name,
      proposal.clientName,
      proposal.serviceName,
      intent,
      slug,
    );
  }

  redirect(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
}
