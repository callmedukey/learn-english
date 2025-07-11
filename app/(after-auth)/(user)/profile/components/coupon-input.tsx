"use client";

import { Check, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DiscountCoupon } from "@/prisma/generated/prisma";

import { validateCouponAction } from "../actions/coupon.actions";

interface CouponInputProps {
  onCouponApplied: (coupon: DiscountCoupon | null) => void;
  appliedCoupon: DiscountCoupon | null;
  isKoreanUser?: boolean;
}

export default function CouponInput({
  onCouponApplied,
  appliedCoupon,
  isKoreanUser = true,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    startTransition(async () => {
      const result = await validateCouponAction(couponCode.trim(), isKoreanUser);

      if (result.success && result.coupon) {
        toast.success("Coupon applied successfully!");
        onCouponApplied(result.coupon);
        setCouponCode("");
      } else {
        toast.error(result.error || "Invalid coupon code");
      }
    });
  };

  const handleRemoveCoupon = () => {
    onCouponApplied(null);
    setCouponCode("");
    toast.success("Coupon removed");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApplyCoupon();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="coupon-code">Coupon Code</Label>
        <div className="flex space-x-2">
          <Input
            id="coupon-code"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            disabled={isPending || !!appliedCoupon}
            className="flex-1"
          />
          <Button
            onClick={handleApplyCoupon}
            disabled={isPending || !couponCode.trim() || !!appliedCoupon}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            {isPending ? "Applying..." : "Apply"}
          </Button>
        </div>
      </div>

      {appliedCoupon && (
        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Coupon &quot;{appliedCoupon.code}&quot; applied
            </span>
            <span className="text-sm text-green-600">
              {appliedCoupon.discount > 0
                ? `${appliedCoupon.discount}% off`
                : appliedCoupon.flatDiscount > 0
                ? `₩${appliedCoupon.flatDiscount.toLocaleString()} off`
                : appliedCoupon.flatDiscountUSD && appliedCoupon.flatDiscountUSD > 0
                ? `$${appliedCoupon.flatDiscountUSD.toFixed(2)} off`
                : "Invalid discount"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveCoupon}
            className="text-green-600 hover:bg-green-100 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
