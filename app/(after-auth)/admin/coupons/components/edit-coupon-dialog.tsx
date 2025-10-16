"use client";

import { Edit } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";

import DayPicker from "@/components/custom-ui/day-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CouponRecurringType } from "@/prisma/generated/prisma";

import { updateCouponAction } from "../actions/coupons.actions";
import { CouponWithStats } from "../queries/coupons.query";

interface EditCouponDialogProps {
  coupon: CouponWithStats;
}

export default function EditCouponDialog({ coupon }: EditCouponDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isOneTimeCoupon = coupon.recurringType === CouponRecurringType.ONE_TIME;
  
  // Common fields
  const [code, setCode] = useState(coupon.code);
  const [isActive, setIsActive] = useState(coupon.active);
  const [deadline, setDeadline] = useState<Date | undefined>(
    coupon.deadline ? new Date(coupon.deadline) : undefined
  );
  
  // Discount type and values
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [percentage, setPercentage] = useState("");
  const [flatAmount, setFlatAmount] = useState("");
  
  // Usage limits
  const [maxUses, setMaxUses] = useState(coupon.maxRecurringUses?.toString() || "");
  const [recurringMonths, setRecurringMonths] = useState(coupon.recurringMonths?.toString() || "");

  // Initialize discount values based on coupon data
  useEffect(() => {
    if (coupon.discount > 0) {
      setDiscountType("percentage");
      setPercentage(coupon.discount.toString());
    } else if (isOneTimeCoupon && coupon.flatDiscountUSD && coupon.flatDiscountUSD > 0) {
      setDiscountType("flat");
      setFlatAmount(coupon.flatDiscountUSD.toString());
    } else if (!isOneTimeCoupon && coupon.flatDiscount > 0) {
      setDiscountType("flat");
      setFlatAmount(coupon.flatDiscount.toString());
    }
  }, [coupon, isOneTimeCoupon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("id", coupon.id);
    formData.append("code", code.toUpperCase());
    formData.append("active", isActive.toString());
    formData.append("oneTimeUse", "false"); // Always false, we use maxRecurringUses
    formData.append("recurringType", coupon.recurringType); // Keep original type
    
    if (deadline) {
      formData.append("deadline", deadline.toISOString());
    } else {
      formData.append("deadline", "");
    }
    
    // Set discount values based on coupon type
    if (isOneTimeCoupon) {
      if (discountType === "percentage") {
        formData.append("discount", percentage || "0");
        formData.append("flatDiscount", "0");
        formData.append("flatDiscountUSD", "0");
      } else {
        formData.append("discount", "0");
        formData.append("flatDiscount", "0");
        formData.append("flatDiscountUSD", flatAmount || "0");
      }
    } else {
      if (discountType === "percentage") {
        formData.append("discount", percentage || "0");
        formData.append("flatDiscount", "0");
        formData.append("flatDiscountUSD", "0");
      } else {
        formData.append("discount", "0");
        formData.append("flatDiscount", flatAmount || "0");
        formData.append("flatDiscountUSD", "0");
      }
      
      if (recurringMonths) {
        formData.append("recurringMonths", recurringMonths);
      }
    }
    
    if (maxUses) {
      formData.append("maxRecurringUses", maxUses);
    }

    startTransition(async () => {
      const result = await updateCouponAction(formData);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit {isOneTimeCoupon ? "One-Time" : "Recurring"} Coupon</DialogTitle>
          <DialogDescription>
            Update the coupon details for {isOneTimeCoupon ? "one-time payments" : "recurring subscriptions"}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coupon type indicator */}
          <div className={`rounded-md p-3 ${isOneTimeCoupon ? "bg-blue-50" : "bg-green-50"}`}>
            <p className={`text-base ${isOneTimeCoupon ? "text-blue-800" : "text-green-800"}`}>
              {isOneTimeCoupon 
                ? "💡 One-time payment coupon - For international users. Discount in USD only."
                : "💡 Recurring payment coupon - For Korean users with auto-renewal. Discount in KRW only."}
            </p>
          </div>

          {/* Common Fields */}
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              disabled={isPending}
              className="uppercase"
            />
            <p className="text-sm text-gray-500">
              Use uppercase letters, numbers, hyphens, and underscores only
            </p>
          </div>

          {/* Discount Type Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={discountType === "percentage" ? "default" : "outline"}
                  onClick={() => setDiscountType("percentage")}
                  disabled={isPending}
                >
                  Percentage
                </Button>
                <Button
                  type="button"
                  variant={discountType === "flat" ? "default" : "outline"}
                  onClick={() => setDiscountType("flat")}
                  disabled={isPending}
                >
                  Flat Amount
                </Button>
              </div>
            </div>
            
            {discountType === "percentage" ? (
              <div className="space-y-2">
                <Label htmlFor="percentage">Discount Percentage</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder="e.g., 20"
                  required
                  disabled={isPending}
                />
                <p className="text-sm text-gray-500">Enter 1-100%</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="flatAmount">
                  Discount Amount ({isOneTimeCoupon ? "USD" : "KRW"})
                </Label>
                <Input
                  id="flatAmount"
                  type="number"
                  min={isOneTimeCoupon ? "0.01" : "100"}
                  step={isOneTimeCoupon ? "0.01" : "100"}
                  value={flatAmount}
                  onChange={(e) => setFlatAmount(e.target.value)}
                  placeholder={isOneTimeCoupon ? "e.g., 10.00" : "e.g., 5000"}
                  required
                  disabled={isPending}
                />
                <p className="text-sm text-gray-500">
                  Amount in {isOneTimeCoupon ? "US Dollars" : "Korean Won"}
                </p>
              </div>
            )}
          </div>

          {/* Usage Limits */}
          <div className="space-y-2">
            <Label htmlFor="maxUses">
              {isOneTimeCoupon ? "Max Total Uses" : "Max Customers"}
            </Label>
            <Input
              id="maxUses"
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Leave empty for unlimited"
              disabled={isPending}
            />
            <p className="text-sm text-gray-500">
              {isOneTimeCoupon 
                ? "Maximum total times this coupon can be used"
                : "Maximum customers who can start subscriptions with this coupon"}
            </p>
          </div>

          {/* Recurring-specific fields */}
          {!isOneTimeCoupon && (
            <div className="space-y-2">
              <Label htmlFor="recurringMonths">Duration (Months)</Label>
              <Input
                id="recurringMonths"
                type="number"
                min="1"
                value={recurringMonths}
                onChange={(e) => setRecurringMonths(e.target.value)}
                placeholder="Leave empty for unlimited"
                disabled={isPending}
              />
              <p className="text-sm text-gray-500">
                How many months the discount lasts (empty = forever)
              </p>
            </div>
          )}

          {/* Common Fields Continued */}
          <DayPicker
            label="Expiration Date (Optional)"
            date={deadline}
            setDate={setDeadline}
            placeholder="Select expiration date"
          />

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isPending}
            />
            <Label htmlFor="active">Active</Label>
          </div>

          {/* Usage warnings */}
          {coupon._count.payments > 0 && (
            <div className="rounded-md bg-yellow-50 p-3">
              <p className="text-base text-yellow-800">
                ⚠️ This coupon has been used {coupon._count.payments} time(s).
                Changes may affect existing usage records.
              </p>
            </div>
          )}

          {coupon._count.couponApplications > 0 && (
            <div className="rounded-md bg-orange-50 p-3">
              <p className="text-base text-orange-800">
                ⚠️ This coupon has {coupon._count.couponApplications} active
                recurring application(s). Changes to recurring settings will
                affect future payments.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Coupon"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}