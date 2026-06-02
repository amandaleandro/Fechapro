import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const props = await prisma.proposalAsset.findMany({
  select: { publicSlug: true, serviceName: true, clientName: true, userId: true },
  orderBy: { createdAt: "desc" },
  take: 10,
});
console.log(JSON.stringify(props, null, 2));
// also list which have service images / portfolio / brand logo
for (const p of props.slice(0, 3)) {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: p.userId }, select: { logoUrl: true } });
  const portfolio = await prisma.portfolioAsset.count({ where: { userId: p.userId } });
  console.log(`slug=${p.publicSlug} logo=${brand?.logoUrl||"(none)"} portfolio=${portfolio}`);
}
await prisma.$disconnect();
