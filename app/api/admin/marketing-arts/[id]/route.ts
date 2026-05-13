import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { cleanOptionalString, cleanString } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    caption?: string;
    imageUrl?: string;
    whatsappMessage?: string;
  };

  const imageUrl = cleanString(body.imageUrl);
  if (!imageUrl) return jsonError("Envie a imagem da arte pronta.", 400);

  const item = await prisma.marketingArtAsset.findUnique({ where: { id } });
  if (!item) return jsonError("Pedido de arte nao encontrado.", 404);

  const updated = await prisma.marketingArtAsset.update({
    where: { id },
    data: {
      caption: cleanOptionalString(body.caption),
      imageUrl,
      source: "uploaded",
      whatsappMessage: cleanOptionalString(body.whatsappMessage),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          brandProfile: {
            select: {
              businessName: true,
              whatsapp: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(updated);
}
