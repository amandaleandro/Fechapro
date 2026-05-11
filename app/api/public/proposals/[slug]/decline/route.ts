import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendProposalDeclinedEmail } from "@/lib/email";
import { verifyTurnstile } from "@/lib/turnstile";

const DECLINABLE_STATUSES = ["sent", "viewed"];

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    select: { status: true, serviceName: true, clientName: true, user: { select: { email: true, name: true } } },
  });

  if (!proposal || !DECLINABLE_STATUSES.includes(proposal.status)) {
    redirect(`/p/${slug}?error=unavailable`);
  }

  const formData = await request.formData();
  const turnstileToken = formData.get("cf-turnstile-response") as string | null;
  if (!await verifyTurnstile(turnstileToken)) {
    redirect(`/p/${slug}?error=bot`);
  }

  const reason = String(formData.get("reason") || "");

  const trimmedReason = reason.trim() || null;

  await prisma.proposalAsset.update({
    where: { publicSlug: slug },
    data: {
      status: "declined",
      declinedReason: trimmedReason,
      declinedAt: new Date(),
    },
  });

  if (proposal.user.email) {
    await sendProposalDeclinedEmail(
      proposal.user.email,
      proposal.user.name,
      proposal.clientName,
      proposal.serviceName,
      trimmedReason
    );
  }

  redirect(`/p/${slug}?declined=1`);
}
