import { NextResponse } from "next/server";
import { getHealthReport, isAuthorizedHealthRequest } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAuthorizedHealthRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const report = await getHealthReport();
  const status = report.status === "down" ? 503 : 200;

  return NextResponse.json(report, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
