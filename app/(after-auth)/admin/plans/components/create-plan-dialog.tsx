"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";

import { createPlanAction } from "../actions/plans.actions";

export default function CreatePlanDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    priceUSD: "",
    duration: "",
    description: "",
    sortOrder: "0",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const result = await createPlanAction({
          name: formData.name,
          price: parseInt(formData.price),
          priceUSD: formData.priceUSD ? parseFloat(formData.priceUSD) : undefined,
          duration: parseInt(formData.duration),
          description: formData.description || undefined,
          sortOrder: parseInt(formData.sortOrder),
        });

        if (result.success) {
          toast.success("Plan created successfully!");
          setOpen(false);
          setFormData({
            name: "",
            price: "",
            priceUSD: "",
            duration: "",
            description: "",
            sortOrder: "0",
          });
        } else {
          toast.error(result.error || "Failed to create plan");
        }
      } catch (e) {
        console.error(e);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Plan</DialogTitle>
          <DialogDescription>
            Create a new subscription plan for your customers.
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceUSD">Price (USD) - For International Users</Label>
            <div className="relative">
              <Input
                id="priceUSD"
                name="priceUSD"
                type="number"
                step="0.01"
                value={formData.priceUSD}
                onChange={handleInputChange}
                placeholder="9.99"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">
                $
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty if you don&apos;t want to accept international payments
            </p>
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
              className="bg-primary hover:bg-primary/90"
            >
              {isPending ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
