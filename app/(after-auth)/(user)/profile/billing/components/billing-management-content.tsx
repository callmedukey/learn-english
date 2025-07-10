"use client";

import { format } from "date-fns";
import { CreditCard, Plus, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { User, UserSubscription, Plan } from "@/prisma/generated/prisma";

interface BillingManagementContentProps {
  user: User & { country: { name: string } | null };
  activeSubscription?: UserSubscription & { plan: Plan };
}

export default function BillingManagementContent({
  user,
  activeSubscription,
}: BillingManagementContentProps) {
  const router = useRouter();
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const hasActiveBillingKey = !!user.billingKey;
  const cardInfo = user.cardInfo as { last4?: string; issuer?: string } | null;

  const handleRegisterCard = () => {
    router.push("/profile/billing/register");
  };

  const handleRemoveCard = async () => {
    setIsRemoving(true);
    try {
      const response = await fetch("/api/billing/remove", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove card");
      }

      toast.success("Card removed successfully");
      router.refresh();
    } catch {
      toast.error("Failed to remove card");
    } finally {
      setIsRemoving(false);
      setShowRemoveDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Card information for automatic payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasActiveBillingKey && cardInfo ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <CreditCard className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {cardInfo.issuer || "Card"} •••• {cardInfo.last4}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Registered:{" "}
                      {format(user.billingKeyIssuedAt!, "MMMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRemoveDialog(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <CreditCard className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mb-4 text-muted-foreground">
                No payment method registered
              </p>
              <Button onClick={handleRegisterCard}>
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* No Active Subscription Alert */}
      {!activeSubscription && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Active Subscription</AlertTitle>
          <AlertDescription>
            Subscribe to a plan to enable auto-renewal.
            <Button
              variant="link"
              className="ml-1 px-0"
              onClick={() => router.push("/profile")}
            >
              Subscribe Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Remove Card Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                Removing your payment method will cancel your subscription and disable auto-renewal.
              </span>
              <span className="block">
                <strong>Note:</strong> If you want to change your payment method instead, you can{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 font-semibold text-primary"
                  onClick={() => {
                    setShowRemoveDialog(false);
                    router.push("/profile/billing/register");
                  }}
                >
                  register a new card
                </Button>{" "}
                without removing the current one.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Keep Card</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCard}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? "Removing..." : "Yes, Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
