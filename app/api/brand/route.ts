import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET() {
  const session = await requireSession();
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.id },
  });

  return NextResponse.json(
    brand || {
      businessName: session.name,
      logoUrl: null,
      primaryColor: "#106b5b",
      secondaryColor: "#0F172A",
      accentColor: "#2563EB",
      whatsapp: null,
      instagram: null,
      email: session.email,
      website: null,
      bio: null,
    },
  );
}

export async function PUT(request: Request) {
  const session = await requireSession();
  const body = (await request.json()) as {
    businessName?: string;
    logoUrl?: string | null;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    whatsapp?: string | null;
    instagram?: string | null;
    email?: string | null;
    website?: string | null;
    bio?: string | null;
  };

  const brand = await prisma.brandProfile.upsert({
    where: { userId: session.id },
    create: {
      userId: session.id,
      businessName: body.businessName?.trim() || session.name,
      logoUrl: clean(body.logoUrl),
      primaryColor: normalizeColor(body.primaryColor),
      secondaryColor: normalizeColor(body.secondaryColor, "#0F172A"),
      accentColor: normalizeColor(body.accentColor, "#2563EB"),
      whatsapp: clean(body.whatsapp),
      instagram: clean(body.instagram),
      email: clean(body.email) || session.email,
      website: clean(body.website),
      bio: clean(body.bio),
    },
    update: {
      businessName: body.businessName?.trim() || session.name,
      logoUrl: clean(body.logoUrl),
      primaryColor: normalizeColor(body.primaryColor),
      secondaryColor: normalizeColor(body.secondaryColor, "#0F172A"),
      accentColor: normalizeColor(body.accentColor, "#2563EB"),
      whatsapp: clean(body.whatsapp),
      instagram: clean(body.instagram),
      email: clean(body.email) || session.email,
      website: clean(body.website),
      bio: clean(body.bio),
    },
  });

  return NextResponse.json(brand);
}

function clean(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned || null;
}

function normalizeColor(value?: string, fallback = "#106b5b") {
  return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value! : fallback;
}
