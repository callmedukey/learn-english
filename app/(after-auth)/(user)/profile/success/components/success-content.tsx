"use client";

import { CheckCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SuccessContentProps {
  paymentKey: string;
  orderId: string;
  amount: string;
}

interface PaymentResult {
  success: boolean;
  payment?: {
    id: string;
    orderId: string;
    amount: number;
    planName: string;
    expirationDate: string;
  };
  error?: string;
}

export default function SuccessContent({
  paymentKey,
  orderId,
  amount,
}: SuccessContentProps) {
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setPaymentResult(result);
          toast.success("Payment confirmed successfully!");
        } else {
          throw new Error(result.error || "Payment confirmation failed");
        }
      } catch (error) {
        console.error("Payment confirmation error:", error);
        setPaymentResult({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        toast.error("Payment confirmation failed");
      } finally {
        setIsLoading(false);
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(price);
  };

  if (isLoading) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-amber-500"></div>
          <p className="text-gray-600">Confirming your payment...</p>
        </CardContent>
      </Card>
    );
  }

  if (!paymentResult?.success) {
    return (
      <Card className="border-red-200 text-center">
        <CardContent className="pt-6">
          <div className="mb-4 text-red-500">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-red-800">
            Payment Confirmation Failed
          </h2>
          <p className="mb-4 text-red-600">
            {paymentResult?.error || "Something went wrong"}
          </p>
          <Button
            onClick={() => router.push("/plans")}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            Back to Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200 text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Thank you for your subscription. Your payment has been processed
            successfully.
          </p>

          <div className="space-y-2 rounded-lg bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-green-800">Plan:</span>
              <span className="text-green-700">
                {paymentResult.payment?.planName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-green-800">Amount Paid:</span>
              <span className="text-green-700">
                {formatPrice(paymentResult.payment?.amount || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-green-800">Order ID:</span>
              <span className="font-mono text-sm text-green-700">
                {paymentResult.payment?.orderId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-green-800">Expires On:</span>
              <span className="text-green-700">
                {paymentResult.payment?.expirationDate}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          onClick={() => router.push("/dashboard")}
          className="flex-1 bg-amber-500 text-white hover:bg-amber-600"
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button
          onClick={() => router.push("/profile")}
          variant="outline"
          className="flex-1"
        >
          View Profile
        </Button>
      </div>
    </div>
  );
}
