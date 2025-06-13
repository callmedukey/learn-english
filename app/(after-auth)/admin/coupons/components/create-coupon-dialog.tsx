"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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

import { createCouponAction } from "../actions/coupons.actions";

export default function CreateCouponDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [discountType, setDiscountType] = useState<
    "percentage" | "flat" | null
  >(null);
  const [isActive, setIsActive] = useState(true);
  const [isOneTimeUse, setIsOneTimeUse] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createCouponAction(formData);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setDiscountType(null);
        setIsActive(true);
        setIsOneTimeUse(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value > 0) {
      setDiscountType("percentage");
      // Clear flat discount field
      const flatDiscountField = document.getElementById(
        "flatDiscount",
      ) as HTMLInputElement;
      if (flatDiscountField) {
        flatDiscountField.value = "0";
      }
    } else if (value === 0) {
      setDiscountType(null);
    }
  };

  const handleFlatDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value > 0) {
      setDiscountType("flat");
      // Clear percentage discount field
      const percentageField = document.getElementById(
        "discount",
      ) as HTMLInputElement;
      if (percentageField) {
        percentageField.value = "0";
      }
    } else if (value === 0) {
      setDiscountType(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Coupon</DialogTitle>
          <DialogDescription>
            Create a new discount coupon. Choose either percentage discount OR
            flat discount amount.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code</Label>
            <Input
              id="code"
              name="code"
              placeholder="e.g., SAVE20"
              required
              disabled={isPending}
              className="uppercase"
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
            <p className="text-xs text-gray-500">
              Use uppercase letters, numbers, hyphens, and underscores only
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                💡 Choose ONE discount type: Either percentage OR flat amount
                (not both)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Percentage Discount (%)</Label>
                <Input
                  id="discount"
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g., 20"
                  disabled={isPending}
                  defaultValue="0"
                  onChange={handlePercentageChange}
                  className={discountType === "flat" ? "bg-gray-100" : ""}
                />
                <p className="text-xs text-gray-500">0-100%</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="flatDiscount">Flat Discount (₩)</Label>
                <Input
                  id="flatDiscount"
                  name="flatDiscount"
                  type="number"
                  min="0"
                  placeholder="e.g., 5000"
                  disabled={isPending}
                  defaultValue="0"
                  onChange={handleFlatDiscountChange}
                  className={discountType === "percentage" ? "bg-gray-100" : ""}
                />
                <p className="text-xs text-gray-500">Amount in KRW</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isPending}
            />
            <input type="hidden" name="active" value={isActive.toString()} />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="oneTimeUse"
              checked={isOneTimeUse}
              onCheckedChange={setIsOneTimeUse}
              disabled={isPending}
            />
            <input
              type="hidden"
              name="oneTimeUse"
              value={isOneTimeUse.toString()}
            />
            <Label htmlFor="oneTimeUse">One-time use only</Label>
          </div>
          <p className="text-xs text-gray-500">
            If enabled, this coupon will be automatically deactivated after a
            single successful use
          </p>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setDiscountType(null);
                setIsActive(true);
                setIsOneTimeUse(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Coupon"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
