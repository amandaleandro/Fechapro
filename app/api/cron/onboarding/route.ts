import { NextResponse } from "next/server";
import { sendMarketingEmail } from "@/lib/email";
import { ensureMarketingUnsubscribeToken } from "@/lib/marketing";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "";

const DAY = 24 * 60 * 60 * 1000;
// Janela de segurança: nunca dispara onboarding para contas mais antigas que
// isso (evita avalanche de emails para a base existente ao ligar o cron pela
// primeira vez, e contas frias que nunca devem mais ser ativadas).
const MAX_ACCOUNT_AGE_DAYS = 14;

function isAuthorized(request: Request) {
  // Falha fechado: sem secret configurado, a rota não pode ser disparada.
  if (!CRON_SECRET) return false;
  return request.headers.get("Authorization") === `Bearer ${CRON_SECRET}`;
}

type EligibleUser = {
  id: string;
  name: string;
  email: string;
  marketingUnsubscribeToken: string | null;
  brandProfile: { businessName: string } | null;
};

async function sendOnboarding(
  user: EligibleUser,
  key: "activationDay1" | "activationDay3",
  markField: "onboardingDay1SentAt" | "onboardingDay3SentAt",
  now: Date,
) {
  const token = await ensureMarketingUnsubscribeToken(user.id, user.marketingUnsubscribeToken);

  await sendMarketingEmail(user.email, key, {
    name: user.name,
    businessName: user.brandProfile?.businessName,
    unsubscribeToken: token,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { [markField]: now },
  });
}

async function runOnboarding() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 1 * DAY);
  const threeDaysAgo = new Date(now.getTime() - 3 * DAY);
  const oldestAllowed = new Date(now.getTime() - MAX_ACCOUNT_AGE_DAYS * DAY);

  // D+1 — conta com pelo menos 1 dia, ainda sem nenhuma proposta criada.
  const day1Users = await prisma.user.findMany({
    where: {
      createdAt: { lte: oneDayAgo, gte: oldestAllowed },
      onboardingDay1SentAt: null,
      marketingUnsubscribedAt: null,
      proposalAssets: { none: {} },
    },
    select: {
      id: true,
      name: true,
      email: true,
      marketingUnsubscribeToken: true,
      brandProfile: { select: { businessName: true } },
    },
    take: 200,
  });

  // D+3 — conta com pelo menos 3 dias e marca incompleta (sem perfil, sem logo
  // ou sem WhatsApp), independentemente de já ter criado proposta.
  const day3Users = await prisma.user.findMany({
    where: {
      createdAt: { lte: threeDaysAgo, gte: oldestAllowed },
      onboardingDay3SentAt: null,
      marketingUnsubscribedAt: null,
      OR: [
        { brandProfile: { is: null } },
        { brandProfile: { logoUrl: null } },
        { brandProfile: { whatsapp: null } },
        { brandProfile: { whatsapp: "" } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      marketingUnsubscribeToken: true,
      brandProfile: { select: { businessName: true } },
    },
    take: 200,
  });

  let day1 = 0;
  let day3 = 0;
  let failed = 0;

  const day1Results = await Promise.allSettled(
    day1Users.map((user) => sendOnboarding(user, "activationDay1", "onboardingDay1SentAt", now)),
  );
  for (const result of day1Results) {
    if (result.status === "fulfilled") day1++;
    else {
      failed++;
      console.error("[cron/onboarding] falha no D+1", result.reason);
    }
  }

  const day3Results = await Promise.allSettled(
    day3Users.map((user) => sendOnboarding(user, "activationDay3", "onboardingDay3SentAt", now)),
  );
  for (const result of day3Results) {
    if (result.status === "fulfilled") day3++;
    else {
      failed++;
      console.error("[cron/onboarding] falha no D+3", result.reason);
    }
  }

  return { day1, day3, failed };
}

export async function GET(request: Request) {
  // Vercel Cron dispara via GET.
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runOnboarding());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runOnboarding());
}
