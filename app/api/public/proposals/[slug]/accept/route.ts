import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { sendProposalAcceptedEmail, sendProposalAcceptedToClientEmail } from "@/lib/email";
import { proposalNotification } from "@/lib/proposal-notifications";
import { sendProposalPushNotification } from "@/lib/push";
import { verifyTurnstile } from "@/lib/turnstile";

const ACCEPTABLE_STATUSES = ["sent", "viewed", "awaiting_response"];
const CONTRACT_VERSION = "service-contract-v2";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    select: {
      userId: true,
      status: true,
      validUntil: true,
      serviceName: true,
      clientName: true,
      clientEmail: true,
      clientPhone: true,
      price: true,
      deadline: true,
      payment: true,
      included: true,
      notes: true,
      user: { select: { email: true, name: true } },
    },
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

  const signerName = cleanAcceptField(formData.get("signerName"), 160) || "Cliente";
  const signerEmail = cleanAcceptField(formData.get("signerEmail"), 180);
  const signerDocument = cleanAcceptField(formData.get("signerDocument"), 40);
  const signerPhone = cleanAcceptField(formData.get("signerPhone"), 40);
  const acceptedAt = new Date();
  const acceptedIp = getRequestIp(request);
  const acceptedUserAgent = cleanAcceptField(request.headers.get("user-agent"), 500);
  const acceptedSnapshotHash = createAcceptanceHash({
    acceptedAt: acceptedAt.toISOString(),
    acceptedBy: signerName,
    acceptedEmail: signerEmail,
    acceptedDocument: signerDocument,
    acceptedPhone: signerPhone,
    proposal: {
      publicSlug: slug,
      clientName: proposal.clientName,
      clientEmail: proposal.clientEmail,
      clientPhone: proposal.clientPhone,
      serviceName: proposal.serviceName,
      price: proposal.price,
      deadline: proposal.deadline,
      payment: proposal.payment,
      included: proposal.included,
      notes: proposal.notes,
    },
    version: CONTRACT_VERSION,
  });

  await prisma.proposalAsset.update({
    where: { publicSlug: slug },
    data: {
      status: "accepted",
      acceptedBy: signerName,
      acceptedEmail: signerEmail || null,
      acceptedDocument: signerDocument || null,
      acceptedPhone: signerPhone || null,
      acceptedAt,
      acceptedIp,
      acceptedUserAgent,
      acceptedSnapshotHash,
      acceptedContractVersion: CONTRACT_VERSION,
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

function cleanAcceptField(value: FormDataEntryValue | string | null, maxLength: number) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  return maskIp(forwardedFor || realIp || cfIp || "");
}

function maskIp(value: string) {
  if (!value) return null;
  if (value.includes(".")) {
    const parts = value.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  if (value.includes(":")) {
    return value.split(":").slice(0, 4).join(":") + "::";
  }
  return value.slice(0, 80);
}

function createAcceptanceHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
