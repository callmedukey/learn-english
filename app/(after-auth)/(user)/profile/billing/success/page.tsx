import { redirect } from "next/navigation";

import { auth } from "@/auth";
import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

import BillingAuthSuccess from "../components/billing-auth-success";

export default async function BillingAuthSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ authKey?: string; customerKey?: string; paymentId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if user has payment access during maintenance
  const hasAccess = await hasPaymentAccess();
  if (!hasAccess) {
    return <PaymentMaintenanceNotice />;
  }

  const params = await searchParams;
  const { authKey, customerKey, paymentId } = params;

  if (!authKey || !customerKey || customerKey !== session.user.id) {
    redirect("/profile/billing");
  }

  return (
    <div className="container max-w-2xl py-6">
      <BillingAuthSuccess 
        authKey={authKey} 
        customerKey={customerKey} 
        paymentId={paymentId}
      />
    </div>
  );
}