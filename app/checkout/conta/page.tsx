import { Suspense } from "react";
import { plans, type PlanCode } from "@/lib/plans";
import { ContaSetupClient } from "./ContaSetupClient";

export default async function ContaSetupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const checkoutId = params.checkout ?? "";
  const planCode = params.plan ?? "";

  const planMeta = planCode && planCode in plans ? plans[planCode as PlanCode] : null;
  const planName = planMeta?.name ?? "Fundador";
  const planPriceCents = planMeta?.priceCents ?? 0;

  return (
    <Suspense fallback={null}>
      <ContaSetupClient
        checkoutId={checkoutId}
        planName={planName}
        planCode={planCode}
        planPriceCents={planPriceCents}
      />
    </Suspense>
  );
}
