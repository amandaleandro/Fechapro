import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getClientIp, rateLimit, rateLimitError } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { cleanOptionalString, isValidEmail, isValidPhone } from "@/lib/validation";

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
  const whatsapp = cleanOptionalString(body.whatsapp);
  const businessType = cleanOptionalString(body.businessType);
  const mainNeed = cleanOptionalString(body.mainNeed);
  const message = cleanOptionalString(body.message);

  if (!name || !email) {
    return jsonError("Informe nome e e-mail para registrar o interesse.");
  }

  if (!isValidEmail(email)) {
    return jsonError("Informe um e-mail valido.");
  }

  if (whatsapp && !isValidPhone(whatsapp)) {
    return jsonError("Informe um WhatsApp valido.");
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
