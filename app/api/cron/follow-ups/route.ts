import { NextResponse } from "next/server";
import { canUsePaidFeatures } from "@/lib/billing-access";
import { sendProposalFollowUpReminderEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sendProposalPushNotification } from "@/lib/push";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "";

function isAuthorized(request: Request) {
  // Falha fechado: sem secret configurado, a rota não pode ser disparada.
  if (!CRON_SECRET) return false;
  return request.headers.get("Authorization") === `Bearer ${CRON_SECRET}`;
}

async function runFollowUps() {
  const now = new Date();

  const usersWithFollowUp = await prisma.brandProfile.findMany({
    where: { followUpEnabled: true },
    select: {
      userId: true,
      followUpDays: true,
      user: {
        select: {
          subscription: { select: { plan: true, status: true, provider: true } },
        },
      },
    },
  });

  // Só envia para assinaturas ativas/em trial com provider confiável.
  const eligibleUsers = usersWithFollowUp.filter(
    ({ user }) => user.subscription && canUsePaidFeatures(user.subscription),
  );

  if (!eligibleUsers.length) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  await Promise.all(
    eligibleUsers.map(async ({ userId, followUpDays }) => {
      const cutoff = new Date(now.getTime() - followUpDays * 24 * 60 * 60 * 1000);

      const proposals = await prisma.proposalAsset.findMany({
        where: {
          userId,
          status: { in: ["sent", "viewed"] },
          followUpSentAt: null,
          createdAt: { lte: cutoff },
        },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
        take: 50,
      });

      const results = await Promise.allSettled(
        proposals.map(async (proposal) => {
          const daysSince = Math.floor((now.getTime() - proposal.createdAt.getTime()) / (24 * 60 * 60 * 1000));
          const dias = `${daysSince} dia${daysSince === 1 ? "" : "s"}`;
          const viewed = proposal.status === "viewed";

          const pushTitle = viewed ? "Proposta vista sem resposta" : "Proposta sem visualização";
          const pushBody = viewed
            ? `${proposal.clientName} abriu sua proposta de ${proposal.serviceName} mas não respondeu em ${dias}.`
            : `${proposal.clientName} não abriu sua proposta de ${proposal.serviceName} em ${dias}.`;

          await Promise.all([
            sendProposalPushNotification(userId, {
              title: pushTitle,
              body: pushBody,
              slug: proposal.publicSlug,
              tag: `follow-up-${proposal.id}`,
            }),
            proposal.user.email
              ? sendProposalFollowUpReminderEmail(
                  proposal.user.email,
                  proposal.user.name,
                  proposal.clientName,
                  proposal.serviceName,
                  proposal.publicSlug,
                  daysSince,
                  viewed ? "viewed_no_response" : "not_viewed",
                )
              : Promise.resolve(),
          ]);

          await prisma.proposalAsset.update({
            where: { id: proposal.id },
            data: { followUpSentAt: now },
          });
        }),
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          processed++;
        } else {
          failed++;
          console.error("[cron/follow-ups] falha ao enviar follow-up", result.reason);
        }
      }
    }),
  );

  return { processed, failed };
}

export async function GET(request: Request) {
  // Vercel Cron dispara via GET.
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runFollowUps());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await runFollowUps());
}
