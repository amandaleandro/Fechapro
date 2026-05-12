import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createProposalCheckout } from "@/lib/asaas";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  let checkoutUrl = "";
  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    include: { user: true },
  });

  if (!proposal) redirect(`/p/${slug}?paymentError=${encodeURIComponent("Proposta não encontrada")}`);
  if (proposal.price <= 0) redirect(`/p/${slug}?paymentError=${encodeURIComponent("Valor da proposta inválido")}`);
  const formData = await request.formData().catch(() => null);
  const paymentMode = String(formData?.get("paymentMode") || "full");
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
        paymentProvider: "asaas",
        providerCheckoutId: checkout.id,
        providerCheckoutUrl: checkout.url,
        providerReceiptUrl: null,
        paymentMethod: paymentMode,
        paymentStatus: "open",
        paymentUpdatedAt: new Date(),
      },
    });

    checkoutUrl = checkout.url;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar o pagamento.";
    redirect(`/p/${slug}?paymentError=${encodeURIComponent(message)}`);
  }

  redirect(checkoutUrl);
}
