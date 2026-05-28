import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendProposalWhatsAppIntentEmail } from "@/lib/email";

const intentMessages: Record<string, string> = {
  approve: "Olá, vi a proposta e quero aprovar.",
  doubt: "Olá, vi a proposta e tenho uma dúvida.",
  negotiate: "Olá, vi a proposta e quero negociar.",
  contact: "Olá, vi a proposta e quero falar sobre ela.",
  service: "Olá, tenho interesse em contratar um serviço.",
};

function formatWhatsAppPhone(value?: string | null) {
  const digits = value?.replace(/\D/g, "");
  if (!digits) return "";

  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent") || "contact";
  const serviceParam = url.searchParams.get("service");

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

  const phone = formatWhatsAppPhone(proposal?.user.brandProfile?.whatsapp);
  if (!proposal || !phone) redirect(`/p/${slug}?error=whatsapp`);

  const message = intent === "service" && serviceParam
    ? `Olá, tenho interesse no serviço: ${serviceParam}.`
    : (intentMessages[intent] || intentMessages.contact);
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
