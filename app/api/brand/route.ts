import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { cleanOptionalString, cleanString, HEX_COLOR_REGEX, isValidEmail, isValidHttpUrl, isValidPhone } from "@/lib/validation";

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
      pixKey: null,
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
    pixKey?: string | null;
    instagram?: string | null;
    email?: string | null;
    website?: string | null;
    bio?: string | null;
  };

  const businessName = cleanString(body.businessName) || session.name;
  const logoUrl = clean(body.logoUrl);
  const whatsapp = clean(body.whatsapp);
  const pixKey = clean(body.pixKey);
  const instagram = clean(body.instagram);
  const email = clean(body.email) || session.email;
  const website = clean(body.website);

  if (logoUrl && !isValidHttpUrl(logoUrl) && !logoUrl.startsWith("/")) return jsonError("URL do logo inválida.");
  if (whatsapp && !isValidPhone(whatsapp)) return jsonError("WhatsApp inválido.");
  if (email && !isValidEmail(email)) return jsonError("E-mail comercial inválido.");
  if (website && !isValidHttpUrl(website)) return jsonError("Site inválido.");

  const brand = await prisma.brandProfile.upsert({
    where: { userId: session.id },
    create: {
      userId: session.id,
      businessName,
      logoUrl,
      primaryColor: normalizeColor(body.primaryColor),
      secondaryColor: normalizeColor(body.secondaryColor, "#0F172A"),
      accentColor: normalizeColor(body.accentColor, "#2563EB"),
      whatsapp,
      pixKey,
      instagram,
      email,
      website,
      bio: clean(body.bio),
    },
    update: {
      businessName,
      logoUrl,
      primaryColor: normalizeColor(body.primaryColor),
      secondaryColor: normalizeColor(body.secondaryColor, "#0F172A"),
      accentColor: normalizeColor(body.accentColor, "#2563EB"),
      whatsapp,
      pixKey,
      instagram,
      email,
      website,
      bio: clean(body.bio),
    },
  });

  return NextResponse.json(brand);
}

function clean(value?: string | null) {
  return cleanOptionalString(value);
}

function normalizeColor(value?: string, fallback = "#106b5b") {
  return HEX_COLOR_REGEX.test(value || "") ? value! : fallback;
}
