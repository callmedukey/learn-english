import { redirect } from "next/navigation";
import { Suspense } from "react";

import SuccessContent from "./components/success-content";

interface SuccessPageProps {
  searchParams: Promise<{
    paymentKey?: string;
    orderId?: string;
    amount?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;

  if (!params.paymentKey || !params.orderId || !params.amount) {
    redirect("/profile");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-2xl">
        <Suspense fallback={<div>Processing payment...</div>}>
          <SuccessContent
            paymentKey={params.paymentKey}
            orderId={params.orderId}
            amount={params.amount}
          />
        </Suspense>
      </div>
    </div>
  );
}
