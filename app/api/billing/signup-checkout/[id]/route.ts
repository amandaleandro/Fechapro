import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const checkout = await prisma.signupPayment.findUnique({
    where: { id },
    select: {
      claimedAt: true,
      email: true,
      plan: true,
      status: true,
    },
  });

  if (!checkout) {
    return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    claimed: Boolean(checkout.claimedAt),
    email: checkout.email ?? null,
    plan: checkout.plan,
    status: checkout.status,
  });
}
