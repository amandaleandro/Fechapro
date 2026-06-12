import webpush, { WebPushError } from "web-push";
import { prisma } from "@/lib/prisma";
import { sendProposalWhatsAppNotification } from "@/lib/whatsapp";

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const subject = process.env.VAPID_SUBJECT || `mailto:${process.env.EMAIL_FROM || "suporte@fechapro.com.br"}`;

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export function getVapidPublicKey() {
  return publicKey;
}

export function isPushConfigured() {
  return Boolean(publicKey && privateKey);
}

export async function sendProposalPushNotification(
  userId: string,
  input: {
    title: string;
    body: string;
    slug: string;
    tag: string;
  }
) {
  // WhatsApp e push são canais independentes: dispara o WhatsApp em paralelo para
  // que a espera dele (reconexão do Baileys) não atrase o push. A função trata os
  // próprios erros e nunca lança — o resultado é apenas aguardado no fim.
  const whatsappResult = sendProposalWhatsAppNotification(userId, input);

  if (isPushConfigured()) {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subscriptions.length) {
      const payload = JSON.stringify({
        title: input.title,
        body: input.body,
        url: `${APP_URL}/p/${input.slug}`,
        tag: input.tag,
      });

      await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.p256dh,
                  auth: subscription.auth,
                },
              },
              payload
            );
          } catch (error) {
            const statusCode = error instanceof WebPushError ? error.statusCode : 0;
            if (statusCode === 404 || statusCode === 410) {
              await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => null);
            }
          }
        })
      );
    }
  }

  await whatsappResult;
}
