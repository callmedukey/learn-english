import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

import ContinuePaymentClient from "./page-client";

export default async function ContinuePaymentPage() {
  // Check if user has payment access during maintenance
  const hasAccess = await hasPaymentAccess();
  if (!hasAccess) {
    return <PaymentMaintenanceNotice />;
  }

  return <ContinuePaymentClient />;
}