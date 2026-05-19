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
      proposalStyle: "executive",
      proposalIntro: null,
      proposalClosing: null,
      proposalTerms: null,
      proposalFaq: null,
      showPortfolio: true,
      showTestimonials: true,
      showServices: true,
      showFaq: true,
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
    proposalStyle?: string | null;
    proposalIntro?: string | null;
    proposalClosing?: string | null;
    proposalTerms?: string | null;
    proposalFaq?: string | null;
    showPortfolio?: boolean;
    showTestimonials?: boolean;
    showServices?: boolean;
    showFaq?: boolean;
  };

  const businessName = cleanString(body.businessName) || session.name;
  const logoUrl = clean(body.logoUrl);
  const whatsapp = clean(body.whatsapp);
  const pixKey = clean(body.pixKey);
  const instagram = clean(body.instagram);
  const email = clean(body.email) || session.email;
  const website = clean(body.website);
  const proposalStyle = ["executive", "creative", "premium", "technical", "modern", "classic"].includes(body.proposalStyle || "") ? body.proposalStyle! : "executive";

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
      proposalStyle,
      proposalIntro: clean(body.proposalIntro),
      proposalClosing: clean(body.proposalClosing),
      proposalTerms: clean(body.proposalTerms),
      proposalFaq: clean(body.proposalFaq),
      showPortfolio: body.showPortfolio !== false,
      showTestimonials: body.showTestimonials !== false,
      showServices: body.showServices !== false,
      showFaq: body.showFaq !== false,
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
      proposalStyle,
      proposalIntro: clean(body.proposalIntro),
      proposalClosing: clean(body.proposalClosing),
      proposalTerms: clean(body.proposalTerms),
      proposalFaq: clean(body.proposalFaq),
      showPortfolio: body.showPortfolio !== false,
      showTestimonials: body.showTestimonials !== false,
      showServices: body.showServices !== false,
      showFaq: body.showFaq !== false,
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
