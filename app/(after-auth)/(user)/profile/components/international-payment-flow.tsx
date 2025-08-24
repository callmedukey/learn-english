"use client";

import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Plan, DiscountCoupon } from "@/prisma/generated/prisma";

import PaymentSummary from "./payment-summary";
import { calculatePriceWithCouponAction } from "../actions/coupon.actions";
import {
  createPaymentAction,
  deletePaymentAction,
  createFreeSubscriptionAction,
} from "../actions/payment.actions";

interface InternationalPaymentFlowProps {
  selectedPlan: Plan;
  appliedCoupon: DiscountCoupon | null;
  userId: string;
  userEmail: string;
  userName: string;
}

const WIDGET_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_WIDGET_CLIENT_ID!;

export default function InternationalPaymentFlow({
  selectedPlan,
  appliedCoupon,
  userId,
  userEmail,
  userName,
}: InternationalPaymentFlowProps) {
  const router = useRouter();
  const [priceCalculation, setPriceCalculation] = useState({
    originalPrice: 0,
    discountAmount: 0,
    finalPrice: 0,
  });
  const [isPending, startTransition] = useTransition();
  const [paymentWidgetRef, setPaymentWidgetRef] = useState<any>(null);
  const [widgetsReady, setWidgetsReady] = useState(false);

  // Initialize Payment Widget when component mounts and price is calculated
  useEffect(() => {
    if (!selectedPlan || priceCalculation.finalPrice === undefined) return;

    const initPaymentWidget = async () => {
      try {
        // Dynamically import the Payment Widget SDK
        const { loadPaymentWidget } = await import(
          "@tosspayments/payment-widget-sdk"
        );

        // Calculate amount in USD (cents)
        const amountInCents =
          priceCalculation.finalPrice ||
          Math.round(
            (selectedPlan.priceUSD || selectedPlan.price / 1300) * 100,
          );

        // Load the payment widget
        const paymentWidget = await loadPaymentWidget(
          WIDGET_CLIENT_KEY,
          userId,
        );

        // Render payment methods for international payments
        paymentWidget.renderPaymentMethods(
          "#payment-method",
          { value: amountInCents, currency: "USD" },
          {
            variantKey: "DEFAULT",
          },
        );

        // Render agreement
        paymentWidget.renderAgreement("#agreement", {
          variantKey: "AGREEMENT",
        });

        setPaymentWidgetRef(paymentWidget);
        setWidgetsReady(true);
      } catch (error) {
        console.error("Failed to load Payment Widget:", error);
        toast.error("Failed to initialize payment system");
      }
    };

    initPaymentWidget();
  }, [userId, selectedPlan, priceCalculation.finalPrice]);

  // Calculate price when plan or coupon changes
  useEffect(() => {
    if (selectedPlan) {
      startTransition(async () => {
        const basePrice = Math.round(
          (selectedPlan.priceUSD || selectedPlan.price / 1300) * 100,
        );
        const result = await calculatePriceWithCouponAction(
          basePrice,
          appliedCoupon?.code,
          "USD",
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

  const handleConfirmPayment = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan and try again");
      return;
    }

    if (!paymentWidgetRef) {
      toast.error(
        "Payment system not initialized. Please refresh and try again.",
      );
      return;
    }

    startTransition(async () => {
      try {
        // Check if this is a free subscription (full discount)
        if (priceCalculation.finalPrice === 0) {
          if (!appliedCoupon) {
            toast.error("A coupon is required for free subscriptions");
            return;
          }

          // Handle free subscription flow
          const freeSubResult = await createFreeSubscriptionAction({
            userId,
            planId: selectedPlan.id,
            couponCode: appliedCoupon.code,
            customerEmail: userEmail,
            customerName: userName,
          });

          if (!freeSubResult.success) {
            toast.error(
              freeSubResult.error || "Failed to create free subscription",
            );
            return;
          }

          // Redirect to free success page
          router.push(
            `/profile/free-success?orderId=${freeSubResult.payment!.orderId}`,
          );
          return;
        }

        // Create payment record
        const paymentResult = await createPaymentAction({
          userId,
          planId: selectedPlan.id,
          couponCode: appliedCoupon?.code,
          customerEmail: userEmail,
          customerName: userName,
          isRecurring: false, // International payments are not recurring
        });

        if (!paymentResult.success) {
          toast.error(paymentResult.error || "Failed to create payment");
          return;
        }

        const payment = paymentResult.payment!;

        try {
          // Request payment using Payment Widget for international cards
          await paymentWidgetRef.requestPayment({
            orderId: payment.orderId,
            orderName: payment.orderName,
            currency: "USD",
            country: "US",
            successUrl: `${window.location.origin}/profile/success`,
            failUrl: `${window.location.origin}/profile/fail`,
            customerEmail: userEmail,
            customerName: userName,
          });
        } catch (error: any) {
          console.error("Payment widget error:", error);

          // Delete the payment record since payment failed
          const deleteResult = await deletePaymentAction(payment.id);
          if (!deleteResult.success) {
            console.error(
              "Failed to delete payment record:",
              deleteResult.error,
            );
          }

          if (error.code === "USER_CANCEL") {
            toast.error("Payment was cancelled");
          } else {
            toast.error(error.message || "Payment failed. Please try again.");
          }
        }
      } catch (error) {
        console.error("Payment error:", error);
        toast.error("Payment failed. Please try again.");
      }
    });
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <PaymentSummary
        selectedPlan={selectedPlan}
        appliedCoupon={appliedCoupon}
        originalPrice={priceCalculation.originalPrice}
        discountAmount={priceCalculation.discountAmount}
        finalPrice={priceCalculation.finalPrice}
        isKoreanUser={false}
      />

      {/* Payment Widget Container */}
      {priceCalculation.finalPrice > 0 && (
        <div className="space-y-4">
          {/* Payment Methods */}
          <div id="payment-method" className="w-full" />

          {/* Agreement */}
          <div id="agreement" className="w-full" />
        </div>
      )}

      {/* International user notice */}
      {priceCalculation.finalPrice > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            International cards require manual renewal. We&apos;ll send you a
            reminder email before your subscription expires.
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleConfirmPayment}
        disabled={isPending || !widgetsReady}
        className="w-full bg-amber-500 py-3 text-lg font-semibold text-white hover:bg-amber-600"
        size="lg"
      >
        {isPending ? "Processing..." : "Proceed to Payment"}
      </Button>

      <p className="text-center text-xs text-gray-500">
        By confirming payment, you agree to our terms of service and privacy
        policy. Your subscription will start immediately after successful
        payment.
      </p>
    </div>
  );
}
