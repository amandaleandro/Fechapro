import { NextResponse } from "next/server";
import { sendProposalFollowUpReminderEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sendProposalPushNotification } from "@/lib/push";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function POST(request: Request) {
  if (CRON_SECRET && request.headers.get("Authorization") !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const usersWithFollowUp = await prisma.brandProfile.findMany({
    where: { followUpEnabled: true },
    select: { userId: true, followUpDays: true },
  });

  if (!usersWithFollowUp.length) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;

  await Promise.all(
    usersWithFollowUp.map(async ({ userId, followUpDays }) => {
      const cutoff = new Date(now.getTime() - followUpDays * 24 * 60 * 60 * 1000);

      const proposals = await prisma.proposalAsset.findMany({
        where: {
          userId,
          status: "sent",
          viewCount: 0,
          followUpSentAt: null,
          createdAt: { lte: cutoff },
        },
        include: { user: { select: { name: true, email: true } } },
        take: 50,
      });

      await Promise.all(
        proposals.map(async (proposal) => {
          const daysSince = Math.floor((now.getTime() - proposal.createdAt.getTime()) / (24 * 60 * 60 * 1000));

          await Promise.all([
            sendProposalPushNotification(userId, {
              title: "Proposta sem visualização",
              body: `${proposal.clientName} não abriu sua proposta de ${proposal.serviceName} em ${daysSince} dia${daysSince === 1 ? "" : "s"}.`,
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
                )
              : Promise.resolve(),
          ]);

          await prisma.proposalAsset.update({
            where: { id: proposal.id },
            data: { followUpSentAt: now },
          });

          processed++;
        }),
      );
    }),
  );

  return NextResponse.json({ processed });
}
