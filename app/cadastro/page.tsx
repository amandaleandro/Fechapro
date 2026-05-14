import { Suspense } from "react";
import { AuthPageClient } from "../auth/AuthPageClient";

export default function CadastroPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageClient mode="signup" />
    </Suspense>
  );
}
