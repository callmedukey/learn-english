"use client";

import { Tag, Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  CouponApplication, 
  DiscountCoupon,
  Plan,
} from "@/prisma/generated/prisma";

interface ActiveCouponCardProps {
  couponApplications: (CouponApplication & { coupon: DiscountCoupon })[];
  plan: Plan;
}

export default function ActiveCouponCard({ 
  couponApplications, 
  plan 
}: ActiveCouponCardProps) {
  if (!couponApplications || couponApplications.length === 0) {
    return null;
  }

  const activeCoupon = couponApplications[0]; // Should only be one active coupon
  const { coupon } = activeCoupon;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "KRW",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDiscountAmount = () => {
    if (coupon.discount > 0) {
      return Math.floor((plan.price * coupon.discount) / 100);
    } else if (coupon.flatDiscount > 0) {
      return Math.min(coupon.flatDiscount, plan.price);
    }
    return 0;
  };

  const discountAmount = getDiscountAmount();
  const discountedPrice = Math.max(0, plan.price - discountAmount);

  const getRemainingMonthsText = () => {
    if (activeCoupon.remainingMonths === null) {
      return "Forever";
    } else if (activeCoupon.remainingMonths === 1) {
      return "Last month";
    } else {
      return `${activeCoupon.remainingMonths} months remaining`;
    }
  };

  const getRemainingMonthsBadgeVariant = () => {
    if (activeCoupon.remainingMonths === null) {
      return "default" as const;
    } else if (activeCoupon.remainingMonths <= 2) {
      return "secondary" as const;
    }
    return "default" as const;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-green-600" />
              Active Discount
            </CardTitle>
            <CardDescription>
              Your subscription includes an active discount
            </CardDescription>
          </div>
          <Badge 
            variant={getRemainingMonthsBadgeVariant()}
            className={
              activeCoupon.remainingMonths === 1 
                ? "bg-amber-100 text-amber-800" 
                : activeCoupon.remainingMonths === null
                ? "bg-green-100 text-green-800"
                : ""
            }
          >
            {getRemainingMonthsText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coupon Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Coupon Code</span>
            <Badge variant="outline" className="font-mono">
              {coupon.code}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Discount Amount</span>
            <span className="font-medium text-green-600">
              {coupon.discount > 0 
                ? `${coupon.discount}% off` 
                : formatPrice(discountAmount) + " off"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Times Applied</span>
            <span className="text-sm">
              {activeCoupon.appliedCount} time{activeCoupon.appliedCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Regular Price</span>
            <span className="line-through text-muted-foreground">
              {formatPrice(plan.price)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Your Price</span>
            <span className="font-medium text-green-600">
              {formatPrice(discountedPrice)}
            </span>
          </div>
        </div>

        {/* Expiration Notice */}
        {activeCoupon.remainingMonths !== null && activeCoupon.remainingMonths > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-800 font-medium">
                  Discount expires after {activeCoupon.remainingMonths} more payment
                  {activeCoupon.remainingMonths > 1 ? "s" : ""}
                </p>
                <p className="text-muted-foreground mt-1">
                  After that, your subscription will renew at {formatPrice(plan.price)} 
                  per {plan.duration === 30 ? "month" : plan.duration === 90 ? "3 months" : "year"}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}