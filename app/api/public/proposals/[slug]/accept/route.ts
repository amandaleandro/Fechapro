import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendProposalAcceptedEmail, sendProposalAcceptedToClientEmail } from "@/lib/email";
import { proposalNotification } from "@/lib/proposal-notifications";
import { sendProposalPushNotification } from "@/lib/push";
import { verifyTurnstile } from "@/lib/turnstile";

const ACCEPTABLE_STATUSES = ["sent", "viewed", "awaiting_response"];

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    select: { userId: true, status: true, validUntil: true, serviceName: true, clientName: true, clientEmail: true, user: { select: { email: true, name: true } } },
  });

  if (!proposal || !ACCEPTABLE_STATUSES.includes(proposal.status)) {
    redirect(`/p/${slug}?error=unavailable`);
  }

  if (proposal.validUntil && new Date(proposal.validUntil) < new Date()) {
    redirect(`/p/${slug}?error=expired`);
  }

  const formData = await request.formData();
  const turnstileToken = formData.get("cf-turnstile-response") as string | null;
  if (!await verifyTurnstile(turnstileToken)) {
    redirect(`/p/${slug}?error=bot`);
  }

  const signerName = String(formData.get("signerName") || "Cliente");
  const signerEmail = String(formData.get("signerEmail") || "");

  await prisma.proposalAsset.update({
    where: { publicSlug: slug },
    data: {
      status: "accepted",
      acceptedBy: signerName,
      acceptedEmail: signerEmail || null,
      acceptedAt: new Date(),
    },
  });
  revalidatePath(`/p/${slug}`);

  if (proposal.user.email) {
    await sendProposalAcceptedEmail(
      proposal.user.email,
      proposal.user.name,
      signerName,
      proposal.serviceName,
      slug
    );
  }

  await sendProposalPushNotification(
    proposal.userId,
    proposalNotification("accepted", {
      clientName: signerName || proposal.clientName,
      serviceName: proposal.serviceName,
      slug,
    })
  );

  const clientEmail = signerEmail || proposal.clientEmail;
  if (clientEmail) {
    await sendProposalAcceptedToClientEmail(
      clientEmail,
      signerName,
      proposal.user.name,
      proposal.serviceName,
      slug
    );
  }

  redirect(`/p/${slug}?accepted=1&name=${encodeURIComponent(signerName)}#contrato`);
}
