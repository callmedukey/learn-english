"use client";

import { Plan, DiscountCoupon } from "@/prisma/generated/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard } from "lucide-react";

interface PaymentSummaryProps {
  selectedPlan: Plan;
  appliedCoupon: DiscountCoupon | null;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}

export default function PaymentSummary({
  selectedPlan,
  appliedCoupon,
  originalPrice,
  discountAmount,
  finalPrice,
}: PaymentSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(price);
  };

  const getExpirationDate = () => {
    const now = new Date();
    const expirationDate = new Date(
      now.getTime() + selectedPlan.duration * 24 * 60 * 60 * 1000,
    );
    return expirationDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDurationText = (duration: number) => {
    if (duration === 30) return "1 Month";
    if (duration === 90) return "3 Months";
    if (duration === 365) return "1 Year";
    if (duration < 30) return `${duration} Days`;
    if (duration < 365) return `${Math.round(duration / 30)} Months`;
    return `${Math.round(duration / 365)} Years`;
  };

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-amber-500" />
          <span>Payment Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Plan</span>
            <span className="text-gray-700">{selectedPlan.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Duration</span>
            <span className="text-gray-700">
              {getDurationText(selectedPlan.duration)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Pricing Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Original Price</span>
            <span className="text-gray-700">{formatPrice(originalPrice)}</span>
          </div>

          {appliedCoupon && discountAmount > 0 && (
            <div className="flex items-center justify-between text-green-600">
              <div className="flex items-center space-x-2">
                <span>Discount</span>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  {appliedCoupon.code}
                </Badge>
              </div>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Final Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">Total</span>
          <span className="text-lg font-bold text-amber-600">
            {formatPrice(finalPrice)}
          </span>
        </div>

        <Separator />

        {/* Expiration Date */}
        <div className="flex items-center space-x-2 rounded-md bg-amber-50 p-3">
          <Calendar className="h-4 w-4 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Plan expires on
            </p>
            <p className="text-sm text-amber-700">{getExpirationDate()}</p>
          </div>
        </div>

        {selectedPlan.description && (
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-600">{selectedPlan.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
