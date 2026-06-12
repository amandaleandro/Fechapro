import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consultoria para vender mais com propostas comerciais",
  description: "Fale com o FechaPro para organizar orcamentos, propostas comerciais, aceite online e acompanhamento de vendas pelo WhatsApp.",
  alternates: {
    canonical: "/interesse",
  },
};

export default function InteresseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
