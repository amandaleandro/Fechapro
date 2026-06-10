"use client";

import { trackPixel } from "@/lib/meta-pixel";

const SUPPORT_PHONE = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
const SUPPORT_MESSAGE =
  process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE || "Olá! Preciso de ajuda com o FechaPro.";

export function WhatsAppSupportButton() {
  if (!SUPPORT_PHONE) return null;

  const phone = SUPPORT_PHONE.startsWith("55") ? SUPPORT_PHONE : `55${SUPPORT_PHONE}`;
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Suporte via WhatsApp"
      title="Suporte via WhatsApp"
      onClick={() => trackPixel("Contact", { content_name: "WhatsApp Suporte" })}
      className="fixed bottom-20 right-4 z-50 flex min-h-12 items-center gap-2 rounded-full bg-[#25D366] px-3 py-3 shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 sm:bottom-6 sm:right-6 sm:px-4"
    >
      <WhatsAppIcon />
      <span className="hidden text-sm font-semibold text-white sm:inline">Suporte</span>
    </a>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 text-white"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.535 5.845L.057 23.428a.75.75 0 0 0 .92.92l5.638-1.478A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.518-5.228-1.42l-.374-.219-3.882 1.018 1.018-3.81-.228-.382A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}
