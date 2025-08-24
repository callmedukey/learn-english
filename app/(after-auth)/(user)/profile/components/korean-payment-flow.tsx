"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { Info } from "lucide-react";
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
} from "../actions/payment.actions";

interface KoreanPaymentFlowProps {
  selectedPlan: Plan;
  appliedCoupon: DiscountCoupon | null;
  userId: string;
  userEmail: string;
  userName: string;
}

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_ID!;

export default function KoreanPaymentFlow({
  selectedPlan,
  appliedCoupon,
  userId,
  userEmail,
  userName,
}: KoreanPaymentFlowProps) {
  const [priceCalculation, setPriceCalculation] = useState({
    originalPrice: 0,
    discountAmount: 0,
    finalPrice: 0,
  });
  const [isPending, startTransition] = useTransition();
  const [tossPayments, setTossPayments] = useState<any>(null);

  // Korean users always have auto-renewal
  const enableAutoRenewal = true;

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
          "KRW",
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

    startTransition(async () => {
      try {
        // For Korean users, we always use the regular payment flow
        // even with 100% discount coupons to ensure billing key is set up

        if (!tossPayments) {
          toast.error("Payment system not initialized. Please refresh and try again.");
          return;
        }

        // Create payment record
        const paymentResult = await createPaymentAction({
          userId,
          planId: selectedPlan.id,
          couponCode: appliedCoupon?.code,
          customerEmail: userEmail,
          customerName: userName,
          isRecurring: enableAutoRenewal,
        });

        if (!paymentResult.success) {
          toast.error(paymentResult.error || "Failed to create payment");
          const deleteResult = await deletePaymentAction(
            paymentResult.payment!.id,
          );
          if (!deleteResult.success) {
            console.error(
              "Failed to delete payment record:",
              deleteResult.error,
            );
          }
          return;
        }

        // If we reach here, payment was created successfully
        const payment = paymentResult.payment!;

        try {
          // Initialize TossPayments payment
          const paymentWidget = tossPayments.payment({
            customerKey: userId,
          });

          // Check if billing key exists
          if (enableAutoRenewal && !paymentResult.hasBillingKey) {
            // First, register billing key for Korean users
            try {
              await paymentWidget.requestBillingAuth({
                method: "CARD",
                successUrl: `${window.location.origin}/profile/billing/success?paymentId=${payment.id}`,
                failUrl: `${window.location.origin}/profile/billing/fail`,
                customerEmail: userEmail,
                customerName: userName,
              });
              return; // Exit here, billing auth success will continue the payment
            } catch (billingError: any) {
              console.error("Billing auth error:", billingError);
              
              // Delete the payment record since billing auth failed
              const deleteResult = await deletePaymentAction(payment.id);
              if (!deleteResult.success) {
                console.error("Failed to delete payment record:", deleteResult.error);
              }
              
              if (billingError.code === "USER_CANCEL") {
                toast.error("카드 등록이 취소되었습니다");
              } else {
                toast.error(billingError.message || "카드 등록에 실패했습니다");
              }
              return;
            }
          }

          // Regular payment (or payment after billing key is registered)
          const paymentOptions: any = {
            method: "CARD",
            amount: {
              currency: "KRW",
              value: payment.amount,
            },
            orderId: payment.orderId,
            orderName: payment.orderName,
            successUrl: `${window.location.origin}/profile/success`,
            failUrl: `${window.location.origin}/profile/fail`,
            customerEmail: userEmail,
            customerName: userName,
            card: {
              useEscrow: false,
              flowMode: "DEFAULT",
              useCardPoint: false,
              useAppCardOnly: false,
            },
          };

          await paymentWidget.requestPayment(paymentOptions);
        } catch (paymentError) {
          // If TossPayments fails, delete the created payment record
          console.error("Payment widget error:", paymentError);

          // Delete the payment record since the payment flow failed
          const deleteResult = await deletePaymentAction(payment.id);
          if (!deleteResult.success) {
            console.error(
              "Failed to delete payment record:",
              deleteResult.error,
            );
          }

          toast.error("Payment failed. Please try again.");
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
        isKoreanUser={true}
      />

      {/* Auto-renewal notice for Korean users */}
      {priceCalculation.finalPrice > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Auto-Renewal Subscription
              </p>
              <p className="text-xs text-muted-foreground">
                Your subscription will automatically renew. Your card information is securely saved, 
                and you can cancel your subscription anytime from your profile page.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleConfirmPayment}
        disabled={isPending || !tossPayments}
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