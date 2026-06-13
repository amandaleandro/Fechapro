import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { plans } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PeriodKey = "daily" | "weekly" | "monthly" | "yearly";

type PeriodMetric = {
  accessCount: number;
  revenueCents: number;
};

export async function GET() {
  await requireAdmin();

  const periods = periodRanges();
  const earliest = Object.values(periods).reduce((min, range) => (range.start < min ? range.start : min), new Date());

  const [accessEvents, proposalPayments, signupPayments] = await Promise.all([
    prisma.accessEvent.findMany({
      where: { createdAt: { gte: earliest } },
      select: { createdAt: true },
    }),
    prisma.proposalAsset.findMany({
      where: { paymentStatus: "paid", paymentPaidAt: { gte: earliest } },
      select: { paymentPaidAt: true, price: true },
    }),
    prisma.signupPayment.findMany({
      where: { status: "paid", paidAt: { gte: earliest } },
      select: { paidAt: true, plan: true },
    }),
  ]);

  const metrics: Record<PeriodKey, PeriodMetric> = {
    daily: { accessCount: 0, revenueCents: 0 },
    weekly: { accessCount: 0, revenueCents: 0 },
    monthly: { accessCount: 0, revenueCents: 0 },
    yearly: { accessCount: 0, revenueCents: 0 },
  };

  for (const event of accessEvents) {
    for (const key of Object.keys(periods) as PeriodKey[]) {
      if (isWithin(event.createdAt, periods[key])) metrics[key].accessCount += 1;
    }
  }

  for (const payment of proposalPayments) {
    if (!payment.paymentPaidAt) continue;
    addRevenue(metrics, periods, payment.paymentPaidAt, payment.price);
  }

  for (const payment of signupPayments) {
    if (!payment.paidAt) continue;
    addRevenue(metrics, periods, payment.paidAt, plans[payment.plan].priceCents);
  }

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      periods: Object.fromEntries(
        (Object.keys(periods) as PeriodKey[]).map((key) => [
          key,
          {
            ...metrics[key],
            start: periods[key].start.toISOString(),
            end: periods[key].end.toISOString(),
          },
        ]),
      ),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

function addRevenue(metrics: Record<PeriodKey, PeriodMetric>, periods: Record<PeriodKey, DateRange>, date: Date, cents: number) {
  for (const key of Object.keys(periods) as PeriodKey[]) {
    if (isWithin(date, periods[key])) metrics[key].revenueCents += cents;
  }
}

type DateRange = { start: Date; end: Date };

function isWithin(date: Date, range: DateRange) {
  return date >= range.start && date < range.end;
}

function periodRanges(): Record<PeriodKey, DateRange> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const weekStart = new Date(today);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

  return {
    daily: { start: today, end: tomorrow },
    weekly: { start: weekStart, end: weekEnd },
    monthly: { start: monthStart, end: monthEnd },
    yearly: { start: yearStart, end: yearEnd },
  };
}
