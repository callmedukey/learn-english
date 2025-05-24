"use client";

import { Edit } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
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

import { updateCouponAction } from "../actions/coupons.actions";
import { CouponWithStats } from "../queries/coupons.query";

interface EditCouponDialogProps {
  coupon: CouponWithStats;
}

export default function EditCouponDialog({ coupon }: EditCouponDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [discountType, setDiscountType] = useState<
    "percentage" | "flat" | null
  >(null);
  const [isActive, setIsActive] = useState(coupon.active);

  // Set initial discount type based on coupon data
  useEffect(() => {
    if (coupon.discount > 0) {
      setDiscountType("percentage");
    } else if (coupon.flatDiscount > 0) {
      setDiscountType("flat");
    }
  }, [coupon]);

  const handleSubmit = async (formData: FormData) => {
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

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value > 0) {
      setDiscountType("percentage");
      // Clear flat discount field
      const flatDiscountField = document.getElementById(
        "edit-flatDiscount",
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
        "edit-discount",
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
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Coupon</DialogTitle>
          <DialogDescription>
            Update the coupon details. Choose either percentage discount OR flat
            discount amount.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={coupon.id} />

          <div className="space-y-2">
            <Label htmlFor="edit-code">Coupon Code</Label>
            <Input
              id="edit-code"
              name="code"
              defaultValue={coupon.code}
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
                <Label htmlFor="edit-discount">Percentage Discount (%)</Label>
                <Input
                  id="edit-discount"
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={coupon.discount}
                  disabled={isPending}
                  onChange={handlePercentageChange}
                  className={discountType === "flat" ? "bg-gray-100" : ""}
                />
                <p className="text-xs text-gray-500">0-100%</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-flatDiscount">Flat Discount (₩)</Label>
                <Input
                  id="edit-flatDiscount"
                  name="flatDiscount"
                  type="number"
                  min="0"
                  defaultValue={coupon.flatDiscount}
                  disabled={isPending}
                  onChange={handleFlatDiscountChange}
                  className={discountType === "percentage" ? "bg-gray-100" : ""}
                />
                <p className="text-xs text-gray-500">Amount in KRW</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isPending}
            />
            <input type="hidden" name="active" value={isActive.toString()} />
            <Label htmlFor="edit-active">Active</Label>
          </div>

          {coupon._count.payments > 0 && (
            <div className="rounded-md bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ This coupon has been used {coupon._count.payments} time(s).
                Changes may affect existing usage records.
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
