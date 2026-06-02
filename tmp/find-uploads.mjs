import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const svc = await prisma.serviceAsset.findMany({ where: { imageUrl: { contains: "/api/uploads" } }, select: { name:true, imageUrl:true, userId:true }, take: 10 });
const port = await prisma.portfolioAsset.findMany({ where: { imageUrl: { contains: "/api/uploads" } }, select: { title:true, imageUrl:true, userId:true }, take: 10 });
const brands = await prisma.brandProfile.findMany({ where: { logoUrl: { contains: "/api/uploads" } }, select: { logoUrl:true, userId:true }, take: 10 });
console.log("SERVICES w/ upload:", JSON.stringify(svc,null,2));
console.log("PORTFOLIO w/ upload:", JSON.stringify(port,null,2));
console.log("BRANDS w/ upload logo:", JSON.stringify(brands,null,2));
// non-demo proposals
const real = await prisma.proposalAsset.findMany({ where: { NOT: { publicSlug: { startsWith: "demo-" } } }, select: { publicSlug:true, serviceName:true, userId:true }, take: 10 });
console.log("NON-DEMO proposals:", JSON.stringify(real,null,2));
await prisma.$disconnect();
