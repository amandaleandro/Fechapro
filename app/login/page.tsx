import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthPageClient } from "../auth/AuthPageClient";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta FechaPro.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageClient mode="login" />
    </Suspense>
  );
}
