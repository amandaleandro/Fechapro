import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { plans, type PlanCode } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const allowedStatuses = new Set(["active", "trial", "blocked", "pending", "paused", "canceled"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = (await request.json()) as { plan?: PlanCode; status?: string };
  const plan = body.plan;
  const status = body.status?.trim().toLowerCase();

  if (!plan || !plans[plan]) {
    return jsonError("Plano inválido.");
  }

  if (!status || !allowedStatuses.has(status)) {
    return jsonError("Status inválido.");
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) {
    return jsonError("Usuário não encontrado.", 404);
  }

  const subscription = await prisma.planSubscription.upsert({
    where: { userId: id },
    create: {
      userId: id,
      plan,
      status,
      provider: "admin",
    },
    update: {
      plan,
      status,
      provider: "admin",
    },
  });

  return NextResponse.json({ subscription });
}
