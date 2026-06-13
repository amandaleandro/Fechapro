import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { sendMarketingEmail } from "@/lib/email";
import { ensureMarketingUnsubscribeToken } from "@/lib/marketing";
import { sendUpgradeNudgeWhatsApp } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "";

const DAY = 24 * 60 * 60 * 1000;
// Janela de segurança: só inicia a sequência (1º nudge) para contas criadas nos
// últimos 45 dias. Evita avalanche para toda a base gratuita quando o cron é
// ligado pela primeira vez e não incomoda contas frias muito antigas. Os nudges
// 2 e 3 são acionados pelo nudge anterior, então sequências já iniciadas sempre
// terminam, independentemente da idade da conta.
const MAX_ACCOUNT_AGE_DAYS = 45;

function isAuthorized(request: Request) {
  // Falha fechado: sem secret configurado, a rota não pode ser disparada.
  if (!CRON_SECRET) return false;
  return request.headers.get("Authorization") === `Bearer ${CRON_SECRET}`;
}

type MarkField = "upgradeNudge1SentAt" | "upgradeNudge2SentAt" | "upgradeNudge3SentAt";

type EligibleUser = {
  id: string;
  name: string;
  email: string;
  marketingUnsubscribeToken: string | null;
  brandProfile: { businessName: string } | null;
};

const SELECT = {
  id: true,
  name: true,
  email: true,
  marketingUnsubscribeToken: true,
  brandProfile: { select: { businessName: true } },
} satisfies Prisma.UserSelect;

// Base comum: somente plano gratuito e quem não descadastrou do marketing.
const FREE_NOT_UNSUBSCRIBED = {
  marketingUnsubscribedAt: null,
  subscription: { is: { plan: "free" } },
} satisfies Prisma.UserWhereInput;

async function sendNudge(user: EligibleUser, markField: MarkField, now: Date) {
  const token = await ensureMarketingUnsubscribeToken(user.id, user.marketingUnsubscribeToken);

  await sendMarketingEmail(user.email, "upgradeNudge", {
    name: user.name,
    businessName: user.brandProfile?.businessName,
    unsubscribeToken: token,
  });

  // WhatsApp é best-effort (depende de número conectado e de o usuário ter
  // preenchido o WhatsApp dele): nunca deve impedir a marcação nem o e-mail.
  await sendUpgradeNudgeWhatsApp(user.id, user.name).catch(() => null);

  await prisma.user.update({
    where: { id: user.id },
    data: { [markField]: now },
  });
}

async function runStep(where: Prisma.UserWhereInput, markField: MarkField, now: Date) {
  const users = await prisma.user.findMany({ where, select: SELECT, take: 200 });

  let sent = 0;
  let failed = 0;
  const results = await Promise.allSettled(users.map((user) => sendNudge(user, markField, now)));
  for (const result of results) {
    if (result.status === "fulfilled") {
      sent++;
    } else {
      failed++;
      console.error(`[cron/upgrade-nudge] falha no ${markField}`, result.reason);
    }
  }
  return { sent, failed };
}

async function runUpgradeNudge() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * DAY);
  const sixteenDaysAgo = new Date(now.getTime() - 16 * DAY);
  const oldestAllowed = new Date(now.getTime() - MAX_ACCOUNT_AGE_DAYS * DAY);

  // Nudge 1 — D+7: conta gratuita com pelo menos 7 dias (e não muito antiga).
  const step1 = await runStep(
    {
      ...FREE_NOT_UNSUBSCRIBED,
      createdAt: { lte: sevenDaysAgo, gte: oldestAllowed },
      upgradeNudge1SentAt: null,
    },
    "upgradeNudge1SentAt",
    now,
  );

  // Nudge 2 — ~7 dias após o nudge 1 (D+14): drip ancorado no envio anterior.
  const step2 = await runStep(
    {
      ...FREE_NOT_UNSUBSCRIBED,
      upgradeNudge1SentAt: { lte: sevenDaysAgo },
      upgradeNudge2SentAt: null,
    },
    "upgradeNudge2SentAt",
    now,
  );

  // Nudge 3 — ~16 dias após o nudge 2 (D+30) e encerra a sequência.
  const step3 = await runStep(
    {
      ...FREE_NOT_UNSUBSCRIBED,
      upgradeNudge2SentAt: { lte: sixteenDaysAgo },
      upgradeNudge3SentAt: null,
    },
    "upgradeNudge3SentAt",
    now,
  );

  return {
    step1: step1.sent,
    step2: step2.sent,
    step3: step3.sent,
    failed: step1.failed + step2.failed + step3.failed,
  };
}

export async function GET(request: Request) {
  // Vercel Cron dispara via GET.
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runUpgradeNudge());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runUpgradeNudge());
}
