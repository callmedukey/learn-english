"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Plan, DiscountCoupon } from "@/prisma/generated/prisma";

import CouponInput from "./coupon-input";
import PaymentSummary from "./payment-summary";
import PlanCard from "./plan-card";
import { calculatePriceWithCouponAction } from "../actions/coupon.actions";
import { createPaymentAction } from "../actions/payment.actions";

interface PlansClientProps {
  plans: Plan[];
  userId: string;
  userEmail: string;
  userName: string;
}

// TODO: Replace with your actual TossPayments client key
const TOSS_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

export default function PlansClient({
  plans,
  userId,
  userEmail,
  userName,
}: PlansClientProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(
    null,
  );
  const [priceCalculation, setPriceCalculation] = useState({
    originalPrice: 0,
    discountAmount: 0,
    finalPrice: 0,
  });
  const [isPending, startTransition] = useTransition();
  const [tossPayments, setTossPayments] = useState<any>(null);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  // Initialize TossPayments SDK
  useEffect(() => {
    const initTossPayments = async () => {
      try {
        const toss = await loadTossPayments(TOSS_CLIENT_KEY);
        setTossPayments(toss);
      } catch (error) {
        console.error("Failed to load TossPayments:", error);
        toast.error("Failed to initialize payment system");
      }
    };

    initTossPayments();
  }, []);

  // Calculate price when plan or coupon changes
  useEffect(() => {
    if (selectedPlan) {
      startTransition(async () => {
        const result = await calculatePriceWithCouponAction(
          selectedPlan.price,
          appliedCoupon?.code,
        );

        if (result.success) {
          setPriceCalculation({
            originalPrice: result.originalPrice,
            discountAmount: result.discountAmount,
            finalPrice: result.finalPrice,
          });
        }
      });
    }
  }, [selectedPlan, appliedCoupon]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleCouponApplied = (coupon: DiscountCoupon | null) => {
    setAppliedCoupon(coupon);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlan || !tossPayments) {
      toast.error("Please select a plan and try again");
      return;
    }

    startTransition(async () => {
      try {
        // Create payment record
        const paymentResult = await createPaymentAction({
          userId,
          planId: selectedPlan.id,
          couponCode: appliedCoupon?.code,
          customerEmail: userEmail,
          customerName: userName,
        });

        if (!paymentResult.success) {
          toast.error(paymentResult.error || "Failed to create payment");
          return;
        }

        // Initialize TossPayments widget
        const widgets = tossPayments.widgets({
          customerKey: userId,
        });

        // Set payment amount
        await widgets.setAmount({
          currency: "KRW",
          value: paymentResult.payment!.amount,
        });

        // Request payment
        await widgets.requestPayment({
          orderId: paymentResult.payment!.orderId,
          orderName: paymentResult.payment!.orderName,
          successUrl: `${window.location.origin}/plans/success`,
          failUrl: `${window.location.origin}/plans/fail`,
          customerEmail: userEmail,
          customerName: userName,
        });
      } catch (error) {
        console.error("Payment error:", error);
        toast.error("Payment failed. Please try again.");
      }
    });
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
          />
        ))}
      </div>

      {/* Coupon Input */}
      <div className="mx-auto max-w-md">
        <CouponInput
          onCouponApplied={handleCouponApplied}
          appliedCoupon={appliedCoupon}
        />
      </div>

      {/* Payment Summary and Confirm */}
      {selectedPlan && (
        <div className="mx-auto max-w-md space-y-6">
          <PaymentSummary
            selectedPlan={selectedPlan}
            appliedCoupon={appliedCoupon}
            originalPrice={priceCalculation.originalPrice}
            discountAmount={priceCalculation.discountAmount}
            finalPrice={priceCalculation.finalPrice}
          />

          <Button
            onClick={handleConfirmPayment}
            disabled={isPending || !tossPayments}
            className="w-full bg-amber-500 py-3 text-lg font-semibold text-white hover:bg-amber-600"
            size="lg"
          >
            {isPending ? "Processing..." : "Confirm Payment"}
          </Button>

          <p className="text-center text-xs text-gray-500">
            By confirming payment, you agree to our terms of service and privacy
            policy. Your subscription will start immediately after successful
            payment.
          </p>
        </div>
      )}
    </div>
  );
}
