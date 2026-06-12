import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Garante que o usuário tenha um token de descadastro de marketing.
 * O token é estável (gerado uma vez e reutilizado) para que links de
 * unsubscribe em emails antigos continuem válidos.
 */
export async function ensureMarketingUnsubscribeToken(
  userId: string,
  existingToken?: string | null,
): Promise<string> {
  if (existingToken) return existingToken;

  const token = randomUUID();
  await prisma.user.update({
    where: { id: userId },
    data: { marketingUnsubscribeToken: token },
  });
  return token;
}
