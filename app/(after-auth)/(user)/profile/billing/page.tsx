import { redirect } from "next/navigation";

import { auth } from "@/auth";
import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";
import { prisma } from "@/prisma/prisma-client";

import ActiveCouponCard from "./components/active-coupon-card";
import BillingManagementContent from "./components/billing-management-content";
import BillingQuickActions from "./components/billing-quick-actions";
import SubscriptionStatus from "./components/subscription-status";

export default async function BillingManagementPage() {
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
      subscriptions: {
        where: {
          status: "ACTIVE",
        },
        include: {
          plan: true,
          couponApplications: {
            where: {
              isActive: true,
            },
            include: {
              coupon: true,
            },
          },
        },
        orderBy: {
          endDate: "desc",
        },
        take: 1,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Only Korean users can access billing management
  if (user.country?.name !== "South Korea") {
    redirect("/profile");
  }

  const activeSubscription = user.subscriptions[0];

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payment & Billing</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your payment methods and subscription settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Subscription Status */}
        <SubscriptionStatus
          subscription={activeSubscription}
          isKoreanUser={true}
        />

        {/* Active Coupon Information */}
        {activeSubscription && activeSubscription.couponApplications && (
          <ActiveCouponCard
            couponApplications={activeSubscription.couponApplications}
            plan={activeSubscription.plan}
          />
        )}

        {/* Payment Method Management */}
        <BillingManagementContent
          user={user}
          activeSubscription={activeSubscription}
        />

        {/* Quick Actions */}
        <BillingQuickActions
          hasActiveBillingKey={!!user.billingKey}
          hasActiveSubscription={!!activeSubscription}
          isSubscriptionCancelled={
            activeSubscription?.recurringStatus === "CANCELLED"
          }
        />
      </div>
    </div>
  );
}
