import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    select: {
      id: true,
      userId: true,
      status: true,
      clientName: true,
      clientEmail: true,
      serviceName: true,
      acceptedBy: true,
      acceptedEmail: true,
      satisfactionSurvey: { select: { sentAt: true, serviceCompletedAt: true, testimonialId: true } },
    },
  });

  if (!proposal || proposal.status !== "accepted" || !proposal.satisfactionSurvey?.serviceCompletedAt) {
    redirect(`/p/${slug}?error=unavailable#satisfacao`);
  }

  const formData = await request.formData();
  const turnstileToken = formData.get("cf-turnstile-response") as string | null;
  if (!await verifyTurnstile(turnstileToken)) {
    redirect(`/p/${slug}?error=bot#satisfacao`);
  }

  const rating = clampScore(formData.get("rating"), 1, 5);
  const recommendScore = clampScore(formData.get("recommendScore"), 0, 10);
  const comment = String(formData.get("comment") || "").trim().slice(0, 1200) || null;
  const testimonialOk = formData.get("testimonialOk") === "on";
  const clientName = String(formData.get("clientName") || proposal.acceptedBy || proposal.clientName).trim().slice(0, 120) || proposal.clientName;
  const clientEmail = String(formData.get("clientEmail") || proposal.acceptedEmail || proposal.clientEmail || "").trim().slice(0, 180) || null;

  if (rating === null || recommendScore === null) {
    redirect(`/p/${slug}?error=survey#satisfacao`);
  }

  let testimonialId = proposal.satisfactionSurvey?.testimonialId || null;
  if (testimonialOk && comment) {
    if (testimonialId) {
      await prisma.testimonialAsset.updateMany({
        where: { id: testimonialId, userId: proposal.userId },
        data: {
          authorName: clientName,
          company: proposal.serviceName,
          quote: comment,
        },
      });
    } else {
      const testimonial = await prisma.testimonialAsset.create({
        data: {
          userId: proposal.userId,
          authorName: clientName,
          company: proposal.serviceName,
          quote: comment,
        },
      });
      testimonialId = testimonial.id;
    }
  }

  await prisma.satisfactionSurvey.upsert({
    where: { proposalId: proposal.id },
    create: {
      proposalId: proposal.id,
      userId: proposal.userId,
      testimonialId,
      rating,
      recommendScore,
      comment,
      testimonialOk,
      clientName,
      clientEmail,
      respondedAt: new Date(),
    },
    update: {
      rating,
      recommendScore,
      comment,
      testimonialOk,
      testimonialId,
      clientName,
      clientEmail,
      respondedAt: new Date(),
    },
  });

  revalidatePath(`/p/${slug}`);
  redirect(`/p/${slug}?survey=1#satisfacao`);
}

function clampScore(value: FormDataEntryValue | null, min: number, max: number) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < min || numberValue > max) return null;
  return numberValue;
}
