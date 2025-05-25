"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DiscountCoupon } from "@/prisma/generated/prisma";
import { validateCouponAction } from "../actions/coupon.actions";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

interface CouponInputProps {
  onCouponApplied: (coupon: DiscountCoupon | null) => void;
  appliedCoupon: DiscountCoupon | null;
}

export default function CouponInput({
  onCouponApplied,
  appliedCoupon,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    startTransition(async () => {
      const result = await validateCouponAction(couponCode.trim());

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
              Coupon "{appliedCoupon.code}" applied
            </span>
            <span className="text-sm text-green-600">
              {appliedCoupon.discount > 0
                ? `${appliedCoupon.discount}% off`
                : `₩${appliedCoupon.flatDiscount.toLocaleString()} off`}
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
