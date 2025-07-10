"use client";

import { CreditCard, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QuickActionsProps {
  hasActiveBillingKey: boolean;
  hasActiveSubscription: boolean;
  isSubscriptionCancelled?: boolean;
}

export default function BillingQuickActions({
  hasActiveBillingKey,
  hasActiveSubscription,
  isSubscriptionCancelled = false,
}: QuickActionsProps) {
  const router = useRouter();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch("/api/billing/cancel-subscription", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to cancel subscription");
      }
    } catch {
      toast.error("An error occurred while canceling subscription");
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const actions = [
    {
      icon: CreditCard,
      title: hasActiveBillingKey ? "Change Card" : "Register Card",
      description: hasActiveBillingKey
        ? "Change your registered payment method"
        : "Register a card for automatic payments",
      action: () => router.push("/profile/billing/register"),
      disabled: false,
    },
    {
      icon: XCircle,
      title: isSubscriptionCancelled ? "Subscription Cancelled" : "Cancel Subscription",
      description: isSubscriptionCancelled 
        ? "Your subscription is already cancelled" 
        : "Cancel your current subscription",
      action: () => setShowCancelDialog(true),
      disabled: !hasActiveSubscription || isSubscriptionCancelled,
      variant: "outline" as const,
      className: isSubscriptionCancelled ? "" : "hover:border-red-500 hover:text-red-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used billing features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant || "outline"}
                className={`flex h-auto flex-col items-start gap-2 p-4 text-left ${action.className || ""}`}
                onClick={action.action}
                disabled={action.disabled}
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
              <AlertDialogDescription>
                If you cancel your subscription, it will not automatically renew
                on the next billing date. You can continue using the service
                until the end of your current subscription period.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isCancelling}>
                Go Back
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isCancelling ? "Canceling..." : "Cancel Subscription"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
