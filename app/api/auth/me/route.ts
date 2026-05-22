import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  const profile = session
    ? await prisma.user.findUnique({ where: { id: session.id }, select: { niche: true, segment: true } })
    : null;
  return NextResponse.json({
    user: session ? { ...session, ...profile, isAdmin: isAdminEmail(session.email) } : null,
  });
}
