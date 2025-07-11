"use client";

import { Calendar, CreditCard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plan, DiscountCoupon } from "@/prisma/generated/prisma";

interface PaymentSummaryProps {
  selectedPlan: Plan;
  appliedCoupon: DiscountCoupon | null;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  isKoreanUser?: boolean;
}

export default function PaymentSummary({
  selectedPlan,
  appliedCoupon,
  originalPrice,
  discountAmount,
  finalPrice,
  isKoreanUser = true,
}: PaymentSummaryProps) {
  const formatPrice = (price: number) => {
    if (isKoreanUser) {
      return new Intl.NumberFormat("ko-KR", {
        style: "currency",
        currency: "KRW",
      }).format(price);
    } else {
      // Price is in cents for USD
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price / 100);
    }
  };

  const getExpirationDate = () => {
    const now = new Date();
    const expirationDate = new Date(
      now.getTime() + selectedPlan.duration * 24 * 60 * 60 * 1000,
    );
    return expirationDate.toLocaleDateString("en-US", {
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
            <>
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
              
              {/* Show discount duration for recurring coupons */}
              {appliedCoupon.recurringType === "RECURRING" && isKoreanUser && (
                <div className="ml-4 text-sm text-green-600">
                  {appliedCoupon.recurringMonths ? (
                    <span>
                      Discount applies for {appliedCoupon.recurringMonths} month{appliedCoupon.recurringMonths > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span>Discount applies forever</span>
                  )}
                </div>
              )}
            </>
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
        
        {/* Note about future payments for recurring coupons with limited duration */}
        {appliedCoupon && 
         appliedCoupon.recurringType === "RECURRING" && 
         appliedCoupon.recurringMonths && 
         appliedCoupon.recurringMonths > 0 &&
         isKoreanUser && (
          <div className="rounded-md bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              ℹ️ After {appliedCoupon.recurringMonths} month{appliedCoupon.recurringMonths > 1 ? "s" : ""}, 
              your subscription will renew at the full price of {formatPrice(originalPrice)} per {getDurationText(selectedPlan.duration).toLowerCase()}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
