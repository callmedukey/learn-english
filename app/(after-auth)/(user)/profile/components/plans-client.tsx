"use client";

import { useState } from "react";

import { Plan, DiscountCoupon } from "@/prisma/generated/prisma";

import CouponInput from "./coupon-input";
import InternationalPaymentFlow from "./international-payment-flow";
import KoreanPaymentFlow from "./korean-payment-flow";
import PlanCard from "./plan-card";

interface PlansClientProps {
  plans: Plan[];
  userId: string;
  userEmail: string;
  userName: string;
  userCountry: string | null;
}

export default function PlansClient({
  plans,
  userId,
  userEmail,
  userName,
  userCountry,
}: PlansClientProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(
    null,
  );
  
  const isKoreanUser = userCountry === "South Korea";
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleCouponApplied = (coupon: DiscountCoupon | null) => {
    setAppliedCoupon(coupon);
  };

  const getMostPopularPlanId = () => {
    // Assume the 3-month plan (90 days) is most popular
    const popularPlan = plans.find((plan) => plan.duration === 90);
    return popularPlan?.id || plans[1]?.id;
  };

  return (
    <div className="space-y-8">
      {/* Plan Selection */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlanId === plan.id}
            onSelect={handlePlanSelect}
            isPopular={plan.id === getMostPopularPlanId()}
            isKoreanUser={isKoreanUser}
          />
        ))}
      </div>

      {/* Coupon Input */}
      <div className="mx-auto max-w-md">
        <CouponInput
          onCouponApplied={handleCouponApplied}
          appliedCoupon={appliedCoupon}
          isKoreanUser={isKoreanUser}
        />
      </div>

      {/* Payment Flow - Different based on user location */}
      {selectedPlan && (
        isKoreanUser ? (
          <KoreanPaymentFlow
            selectedPlan={selectedPlan}
            appliedCoupon={appliedCoupon}
            userId={userId}
            userEmail={userEmail}
            userName={userName}
          />
        ) : (
          <InternationalPaymentFlow
            selectedPlan={selectedPlan}
            appliedCoupon={appliedCoupon}
            userId={userId}
            userEmail={userEmail}
            userName={userName}
          />
        )
      )}
    </div>
  );
}
