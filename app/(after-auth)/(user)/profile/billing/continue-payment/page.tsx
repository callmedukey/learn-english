"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_ID!;

export default function ContinuePaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");

  useEffect(() => {
    if (!paymentId) {
      toast.error("결제 정보를 찾을 수 없습니다");
      router.push("/profile");
      return;
    }

    const continuePayment = async () => {
      try {
        // Get payment details
        const paymentResponse = await fetch(`/api/payments/${paymentId}`);
        if (!paymentResponse.ok) {
          throw new Error("결제 정보를 불러올 수 없습니다");
        }

        const paymentData = await paymentResponse.json();
        const { payment } = paymentData;

        // Initialize TossPayments
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        const paymentWidget = tossPayments.payment({
          customerKey: payment.userId,
        });

        // Continue with the payment
        await paymentWidget.requestPayment({
          method: "CARD",
          amount: {
            currency: payment.currency || "KRW",
            value: payment.amount,
          },
          orderId: payment.orderId,
          orderName: payment.orderName,
          successUrl: `${window.location.origin}/profile/success`,
          failUrl: `${window.location.origin}/profile/fail`,
          customerEmail: payment.customerEmail,
          customerName: payment.customerName,
          card: {
            useEscrow: false,
            flowMode: "DEFAULT",
            useCardPoint: false,
            useAppCardOnly: false,
          },
        });
      } catch (error) {
        console.error("Payment continuation error:", error);
        toast.error("결제를 계속할 수 없습니다");
        router.push("/profile");
      }
    };

    continuePayment();
  }, [paymentId, router]);

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <CardTitle>결제를 계속 진행하고 있습니다</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              잠시만 기다려주세요...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}