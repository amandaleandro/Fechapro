import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    user: session ? { ...session, isAdmin: isAdminEmail(session.email) } : null,
  });
}
