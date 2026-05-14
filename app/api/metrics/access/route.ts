import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { path?: string; referrer?: string } | null;
  const path = typeof body?.path === "string" ? body.path.slice(0, 500) : "/";
  const referrer = typeof body?.referrer === "string" && body.referrer ? body.referrer.slice(0, 500) : null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 500) || null;
  const session = await getSession().catch(() => null);

  await prisma.accessEvent.create({
    data: {
      path,
      referrer,
      userAgent,
      userId: session?.id || null,
    },
  });

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
