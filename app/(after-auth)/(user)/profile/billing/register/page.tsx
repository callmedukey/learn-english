import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";
import { prisma } from "@/prisma/prisma-client";

import BillingKeyRegistration from "../components/billing-key-registration";

export default async function RegisterPaymentMethodPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if user has payment access during maintenance
  const hasAccess = await hasPaymentAccess();
  if (!hasAccess) {
    return <PaymentMaintenanceNotice />;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      country: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Only Korean users can register billing keys
  if (user.country?.name !== "South Korea") {
    redirect("/profile");
  }

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <div className="mb-6">
        <Link 
          href="/profile/billing" 
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Billing
        </Link>
        <h1 className="text-2xl font-bold">Register Payment Method</h1>
        <p className="mt-1 text-muted-foreground">
          Register a card for automatic payments
        </p>
      </div>

      <BillingKeyRegistration userId={user.id} userEmail={user.email!} />
    </div>
  );
}
