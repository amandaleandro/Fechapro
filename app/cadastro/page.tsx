import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthPageClient } from "../auth/AuthPageClient";

export const metadata: Metadata = {
  title: "Criar conta gratis para fazer orcamentos e propostas",
  description: "Crie sua conta no FechaPro e teste propostas comerciais online com link, PDF, aceite e acompanhamento pelo WhatsApp.",
  alternates: {
    canonical: "/cadastro",
  },
};

export default function CadastroPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageClient mode="signup" />
    </Suspense>
  );
}
