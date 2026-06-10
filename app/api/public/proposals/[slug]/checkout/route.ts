import { redirect } from "next/navigation";
import { canUseProposalPayments } from "@/lib/billing-access";
import { prisma } from "@/lib/prisma";
import { createProposalCheckout } from "@/lib/mercadopago";
import { cleanConversionText, trackConversionEvent } from "@/lib/conversion";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  let checkoutUrl = "";
  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    include: { user: { include: { subscription: true } } },
  });

  if (!proposal) redirect(`/p/${slug}?paymentError=${encodeURIComponent("Proposta não encontrada")}`);
  if (proposal.price <= 0) redirect(`/p/${slug}?paymentError=${encodeURIComponent("Valor da proposta inválido")}`);
  if (!canUseProposalPayments(proposal.user.subscription)) redirect(`/p/${slug}?paymentError=${encodeURIComponent("Pagamento desativado para este link")}`);
  if (proposal.checkoutMode === "pix") redirect(`/checkout/proposta/${slug}`);
  const formData = await request.formData().catch(() => null);
  const paymentMode = String(formData?.get("paymentMode") || "full");
  const campaign = cleanConversionText(formData?.get("campaign"));
  const source = cleanConversionText(formData?.get("source")) || "public_proposal_checkout";
  const variant = cleanConversionText(formData?.get("variant"));
  const amountCents = paymentMode === "signal_30"
    ? Math.max(100, Math.round(proposal.price * 0.3))
    : paymentMode === "signal_50"
      ? Math.max(100, Math.round(proposal.price * 0.5))
      : proposal.price;

  if (proposal.providerCheckoutUrl && proposal.paymentStatus !== "paid" && proposal.paymentMethod === paymentMode) {
    redirect(proposal.providerCheckoutUrl);
  }

  const origin = new URL(request.url).origin;

  try {
    const checkout = await createProposalCheckout({
      amountCents,
      clientEmail: proposal.clientEmail,
      clientName: proposal.clientName,
      origin,
      publicSlug: proposal.publicSlug,
      serviceName: proposal.serviceName,
    });

    await prisma.proposalAsset.update({
      where: { id: proposal.id },
      data: {
        paymentProvider: "mercadopago",
        providerCheckoutId: checkout.id,
        providerCheckoutUrl: checkout.url,
        providerReceiptUrl: null,
        paymentMethod: paymentMode,
        paymentStatus: "open",
        paymentUpdatedAt: new Date(),
      },
    });

    await trackConversionEvent({
      event: "checkout_started",
      userId: proposal.userId,
      proposalId: proposal.id,
      plan: proposal.user.subscription?.plan || null,
      campaign,
      source,
      variant,
      path: `/p/${proposal.publicSlug}`,
      context: "proposal_checkout",
      metadata: {
        amountCents,
        checkoutId: checkout.id,
        paymentMode,
        publicSlug: proposal.publicSlug,
      },
    });

    checkoutUrl = checkout.url;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar o pagamento.";
    redirect(`/p/${slug}?paymentError=${encodeURIComponent(message)}`);
  }

  redirect(checkoutUrl);
}
