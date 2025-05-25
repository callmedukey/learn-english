"use client";

import { Edit } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plan } from "@/prisma/generated/prisma";

import { updatePlanAction } from "../actions/plans.actions";

interface EditPlanDialogProps {
  plan: Plan & {
    _count: {
      payments: number;
      subscriptions: number;
    };
  };
}

export default function EditPlanDialog({ plan }: EditPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: plan.name,
    price: plan.price.toString(),
    duration: plan.duration.toString(),
    description: plan.description || "",
    sortOrder: plan.sortOrder.toString(),
    isActive: plan.isActive,
  });

  // Reset form data when plan changes
  useEffect(() => {
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      duration: plan.duration.toString(),
      description: plan.description || "",
      sortOrder: plan.sortOrder.toString(),
      isActive: plan.isActive,
    });
  }, [plan]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const result = await updatePlanAction({
          id: plan.id,
          name: formData.name,
          price: parseInt(formData.price),
          duration: parseInt(formData.duration),
          description: formData.description || undefined,
          sortOrder: parseInt(formData.sortOrder),
          isActive: formData.isActive,
        });

        if (result.success) {
          toast.success("Plan updated successfully!");
          setOpen(false);
        } else {
          toast.error(result.error || "Failed to update plan");
        }
      } catch (error) {
        console.error(error);
        toast.error("An unexpected error occurred");
      }
    });
  };

  const formatCurrency = (value: string) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, ""));
    if (isNaN(numValue)) return "";
    return new Intl.NumberFormat("ko-KR").format(numValue);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setFormData((prev) => ({ ...prev, price: value }));
  };

  const hasPaymentsOrSubscriptions =
    plan._count.payments > 0 || plan._count.subscriptions > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Plan</DialogTitle>
          <DialogDescription>
            Update the plan details.{" "}
            {hasPaymentsOrSubscriptions &&
              "Note: This plan has existing payments or subscriptions."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., 1 Month Plan"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (KRW) *</Label>
              <div className="relative">
                <Input
                  id="price"
                  name="price"
                  value={formatCurrency(formData.price)}
                  onChange={handlePriceChange}
                  placeholder="9,900"
                  required
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">
                  원
                </span>
              </div>
              {hasPaymentsOrSubscriptions && (
                <p className="text-xs text-amber-600">
                  ⚠️ Changing price affects new purchases only
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Days) *</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="30"
                min="1"
                required
              />
              {hasPaymentsOrSubscriptions && (
                <p className="text-xs text-amber-600">
                  ⚠️ Changing duration affects new purchases only
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional description for this plan..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="isActive">Active Plan</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isPending ? "Updating..." : "Update Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
