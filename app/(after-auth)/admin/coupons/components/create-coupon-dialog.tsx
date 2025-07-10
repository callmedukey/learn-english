"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CouponRecurringType } from "@/prisma/generated/prisma";

import { createCouponAction } from "../actions/coupons.actions";

export default function CreateCouponDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"one-time" | "recurring">("one-time");
  
  // Common fields
  const [code, setCode] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  
  // One-time coupon fields
  const [oneTimeDiscountType, setOneTimeDiscountType] = useState<"percentage" | "flat">("percentage");
  const [oneTimePercentage, setOneTimePercentage] = useState("");
  const [oneTimeFlatUSD, setOneTimeFlatUSD] = useState("");
  const [maxOneTimeUses, setMaxOneTimeUses] = useState("");
  
  // Recurring coupon fields
  const [recurringDiscountType, setRecurringDiscountType] = useState<"percentage" | "flat">("percentage");
  const [recurringPercentage, setRecurringPercentage] = useState("");
  const [recurringFlatKRW, setRecurringFlatKRW] = useState("");
  const [recurringMonths, setRecurringMonths] = useState("");
  const [maxInitialUses, setMaxInitialUses] = useState("");

  const resetForm = () => {
    setCode("");
    setIsActive(true);
    setDeadline(undefined);
    setOneTimeDiscountType("percentage");
    setOneTimePercentage("");
    setOneTimeFlatUSD("");
    setMaxOneTimeUses("");
    setRecurringDiscountType("percentage");
    setRecurringPercentage("");
    setRecurringFlatKRW("");
    setRecurringMonths("");
    setMaxInitialUses("");
    setActiveTab("one-time");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("code", code.toUpperCase());
    formData.append("active", isActive.toString());
    
    if (deadline) {
      formData.append("deadline", deadline.toISOString());
    }
    
    if (activeTab === "one-time") {
      formData.append("recurringType", CouponRecurringType.ONE_TIME);
      formData.append("oneTimeUse", "false"); // Always false, we use maxRecurringUses instead
      
      if (oneTimeDiscountType === "percentage") {
        formData.append("discount", oneTimePercentage || "0");
        formData.append("flatDiscount", "0");
        formData.append("flatDiscountUSD", "0");
      } else {
        formData.append("discount", "0");
        formData.append("flatDiscount", "0");
        formData.append("flatDiscountUSD", oneTimeFlatUSD || "0");
      }
      
      if (maxOneTimeUses) {
        formData.append("maxRecurringUses", maxOneTimeUses);
      }
    } else {
      formData.append("recurringType", CouponRecurringType.RECURRING);
      formData.append("oneTimeUse", "false");
      
      if (recurringDiscountType === "percentage") {
        formData.append("discount", recurringPercentage || "0");
        formData.append("flatDiscount", "0");
        formData.append("flatDiscountUSD", "0");
      } else {
        formData.append("discount", "0");
        formData.append("flatDiscount", recurringFlatKRW || "0");
        formData.append("flatDiscountUSD", "0");
      }
      
      if (recurringMonths) {
        formData.append("recurringMonths", recurringMonths);
      }
      if (maxInitialUses) {
        formData.append("maxRecurringUses", maxInitialUses);
      }
    }

    startTransition(async () => {
      const result = await createCouponAction(formData);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        resetForm();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Coupon</DialogTitle>
          <DialogDescription>
            Create discount coupons for one-time or recurring payments.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common Fields */}
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., SAVE20"
              required
              disabled={isPending}
              className="uppercase"
            />
            <p className="text-xs text-gray-500">
              Use uppercase letters, numbers, hyphens, and underscores only
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "one-time" | "recurring")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="one-time">One-Time Payment</TabsTrigger>
              <TabsTrigger value="recurring">Recurring Payment</TabsTrigger>
            </TabsList>
            
            {/* One-Time Payment Tab */}
            <TabsContent value="one-time" className="space-y-4">
              <div className="rounded-md bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  💡 For international users and one-time purchases. Discount in USD only.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={oneTimeDiscountType === "percentage" ? "default" : "outline"}
                      onClick={() => setOneTimeDiscountType("percentage")}
                      disabled={isPending}
                    >
                      Percentage
                    </Button>
                    <Button
                      type="button"
                      variant={oneTimeDiscountType === "flat" ? "default" : "outline"}
                      onClick={() => setOneTimeDiscountType("flat")}
                      disabled={isPending}
                    >
                      Flat Amount
                    </Button>
                  </div>
                </div>
                
                {oneTimeDiscountType === "percentage" ? (
                  <div className="space-y-2">
                    <Label htmlFor="oneTimePercentage">Discount Percentage</Label>
                    <Input
                      id="oneTimePercentage"
                      type="number"
                      min="1"
                      max="100"
                      value={oneTimePercentage}
                      onChange={(e) => setOneTimePercentage(e.target.value)}
                      placeholder="e.g., 20"
                      required
                      disabled={isPending}
                    />
                    <p className="text-xs text-gray-500">Enter 1-100%</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="oneTimeFlatUSD">Discount Amount (USD)</Label>
                    <Input
                      id="oneTimeFlatUSD"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={oneTimeFlatUSD}
                      onChange={(e) => setOneTimeFlatUSD(e.target.value)}
                      placeholder="e.g., 10.00"
                      required
                      disabled={isPending}
                    />
                    <p className="text-xs text-gray-500">Amount in US Dollars</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="maxOneTimeUses">Max Total Uses</Label>
                  <Input
                    id="maxOneTimeUses"
                    type="number"
                    min="1"
                    value={maxOneTimeUses}
                    onChange={(e) => setMaxOneTimeUses(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    disabled={isPending}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum total times this coupon can be used
                  </p>
                </div>
              </div>
            </TabsContent>
            
            {/* Recurring Payment Tab */}
            <TabsContent value="recurring" className="space-y-4">
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-sm text-green-800">
                  💡 For Korean users with auto-renewal. Discount in KRW only.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={recurringDiscountType === "percentage" ? "default" : "outline"}
                      onClick={() => setRecurringDiscountType("percentage")}
                      disabled={isPending}
                    >
                      Percentage
                    </Button>
                    <Button
                      type="button"
                      variant={recurringDiscountType === "flat" ? "default" : "outline"}
                      onClick={() => setRecurringDiscountType("flat")}
                      disabled={isPending}
                    >
                      Flat Amount
                    </Button>
                  </div>
                </div>
                
                {recurringDiscountType === "percentage" ? (
                  <div className="space-y-2">
                    <Label htmlFor="recurringPercentage">Discount Percentage</Label>
                    <Input
                      id="recurringPercentage"
                      type="number"
                      min="1"
                      max="100"
                      value={recurringPercentage}
                      onChange={(e) => setRecurringPercentage(e.target.value)}
                      placeholder="e.g., 20"
                      required
                      disabled={isPending}
                    />
                    <p className="text-xs text-gray-500">Enter 1-100%</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="recurringFlatKRW">Discount Amount (KRW)</Label>
                    <Input
                      id="recurringFlatKRW"
                      type="number"
                      min="100"
                      step="100"
                      value={recurringFlatKRW}
                      onChange={(e) => setRecurringFlatKRW(e.target.value)}
                      placeholder="e.g., 5000"
                      required
                      disabled={isPending}
                    />
                    <p className="text-xs text-gray-500">Amount in Korean Won</p>
                  </div>
                )}
                
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
                  <p className="text-xs text-gray-500">
                    How many months the discount lasts (empty = forever)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxInitialUses">Max Customers</Label>
                  <Input
                    id="maxInitialUses"
                    type="number"
                    min="1"
                    value={maxInitialUses}
                    onChange={(e) => setMaxInitialUses(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    disabled={isPending}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum customers who can start subscriptions with this coupon
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
            <Label htmlFor="active">Active immediately</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
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