import { redirect } from "next/navigation";
import { AbacateKeyVersionError, createAbacateBilling, createAbacateCheckout, createAbacateProduct } from "@/lib/abacatepay";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  let checkoutUrl = "";
  const proposal = await prisma.proposalAsset.findUnique({
    where: { publicSlug: slug },
    include: { user: true },
  });

  if (!proposal) redirect(`/p/${slug}?paymentError=Proposta%20nao%20encontrada`);
  if (proposal.price <= 0) redirect(`/p/${slug}?paymentError=Valor%20da%20proposta%20invalido`);
  if (proposal.abacatePayCheckoutUrl && proposal.paymentStatus !== "paid") {
    redirect(proposal.abacatePayCheckoutUrl);
  }

  const origin = new URL(request.url).origin;
  const returnUrl = `${origin}/p/${proposal.publicSlug}`;
  const completionUrl = `${origin}/p/${proposal.publicSlug}?payment=success`;
  const externalId = `fechapro-proposal-${proposal.id}`;
  const description = `Proposta ${proposal.serviceName} para ${proposal.clientName}`;

  try {
    let productId = proposal.abacatePayProductId || null;
    let checkout;

    try {
      const product =
        productId
          ? { id: productId }
          : await createAbacateProduct({
              description,
              externalId,
              name: proposal.serviceName,
              price: proposal.price,
            });

      productId = product.id;
      checkout = await createAbacateCheckout({
        completionUrl,
        externalId,
        metadata: { proposalId: proposal.id },
        productId: product.id,
        returnUrl,
      });
    } catch (error) {
      if (!(error instanceof AbacateKeyVersionError)) throw error;
      checkout = await createAbacateBilling({
        completionUrl,
        description,
        externalId,
        name: proposal.serviceName,
        price: proposal.price,
        returnUrl,
      });
    }

    await prisma.proposalAsset.update({
      where: { id: proposal.id },
      data: {
        abacatePayCheckoutId: checkout.id,
        abacatePayCheckoutUrl: checkout.url,
        abacatePayProductId: productId,
        abacatePayReceiptUrl: checkout.receiptUrl || null,
        paymentStatus: checkout.status || "PENDING",
        paymentUpdatedAt: new Date(),
      },
    });

    checkoutUrl = checkout.url;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Nao foi possivel criar o pagamento.";
    const message = rawMessage.toLowerCase().includes("api key version mismatch")
      ? "A chave da AbacatePay nao e compativel com a API v2. Crie uma nova chave no dashboard atual com permissoes PRODUCT:CREATE, PRODUCT:READ e CHECKOUT:CREATE."
      : rawMessage;
    redirect(`/p/${slug}?paymentError=${encodeURIComponent(message)}`);
  }

  redirect(checkoutUrl);
}
