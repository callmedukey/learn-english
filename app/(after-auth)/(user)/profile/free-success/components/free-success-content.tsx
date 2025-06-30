"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FreeSuccessContentProps {
  orderId: string;
  userId: string;
}

interface PaymentData {
  orderId: string;
  planName: string;
  couponCode: string;
  originalAmount: number;
  discountAmount: number;
  endDate: Date;
}

export default function FreeSuccessContent({
  orderId,
  userId,
}: FreeSuccessContentProps) {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        // Fetch payment details from the database
        const response = await fetch(`/api/payments/free-confirm?orderId=${orderId}&userId=${userId}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || "Failed to confirm subscription");
          return;
        }

        setPaymentData(result.payment);
      } catch (err) {
        console.error("Error fetching payment data:", err);
        setError("An error occurred while confirming your subscription");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [orderId, userId]);

  if (loading) {
    return (
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
        <p className="text-gray-600">Confirming your subscription...</p>
      </div>
    );
  }

  if (error || !paymentData) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-12 text-center">
          <div className="mb-4 text-4xl">❌</div>
          <h3 className="mb-2 text-lg font-medium text-red-600">
            Subscription Error
          </h3>
          <p className="mb-6 text-gray-600">{error || "Failed to confirm subscription"}</p>
          <Button onClick={() => router.push("/profile")}>
            Back to Plans
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          Subscription Activated! 🎉
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg bg-green-50 p-6 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 p-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Your Free Subscription is Active!
          </h3>
          <p className="text-sm text-gray-600">
            Thanks to your coupon <strong>{paymentData.couponCode}</strong>, you&apos;ve received a 100% discount!
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 font-semibold text-gray-900">Subscription Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{paymentData.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-xs">{paymentData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Original Price:</span>
                <span className="font-medium">
                  ₩{paymentData.originalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Discount Applied:</span>
                <span className="font-medium">
                  -₩{paymentData.discountAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-900 font-semibold">Final Price:</span>
                <span className="text-lg font-bold text-green-600">₩0</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              <strong>Subscription Active Until:</strong><br />
              {new Date(paymentData.endDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-amber-500 text-white hover:bg-amber-600"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => router.push("/profile")}
            variant="outline"
            className="w-full"
          >
            View My Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}