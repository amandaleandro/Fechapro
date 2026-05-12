import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`interest:${ip}`, 8, 60 * 60_000)) {
    return rateLimitError();
  }

  const body = (await request.json()) as {
    businessType?: string;
    email?: string;
    mainNeed?: string;
    message?: string;
    name?: string;
    whatsapp?: string;
  };

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const whatsapp = cleanOptional(body.whatsapp);
  const businessType = cleanOptional(body.businessType);
  const mainNeed = cleanOptional(body.mainNeed);
  const message = cleanOptional(body.message);

  if (!name || !email) {
    return jsonError("Informe nome e e-mail para registrar o interesse.");
  }

  if (!EMAIL_REGEX.test(email)) {
    return jsonError("Informe um e-mail valido.");
  }

  const lead = await prisma.interestLead.upsert({
    where: { email },
    update: {
      businessType,
      mainNeed,
      message,
      name,
      whatsapp,
    },
    create: {
      businessType,
      email,
      mainNeed,
      message,
      name,
      whatsapp,
    },
  });

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}

function cleanOptional(value?: string) {
  const trimmed = value?.trim();
  return trimmed || null;
}
