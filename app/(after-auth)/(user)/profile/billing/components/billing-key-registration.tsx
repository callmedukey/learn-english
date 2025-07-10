"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { Info, Shield, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_ID!;

interface BillingKeyRegistrationProps {
  userId: string;
  userEmail: string;
}

export default function BillingKeyRegistration({ 
  userId,
  userEmail
}: BillingKeyRegistrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tossPayments, setTossPayments] = useState<any>(null);

  // Initialize TossPayments SDK
  useEffect(() => {
    const initTossPayments = async () => {
      try {
        const toss = await loadTossPayments(TOSS_CLIENT_KEY);
        setTossPayments(toss);
      } catch (error) {
        console.error("Failed to load TossPayments:", error);
        toast.error("Failed to initialize payment system");
      }
    };

    initTossPayments();
  }, []);

  const handleBillingAuth = async () => {
    if (!tossPayments) {
      toast.error("Payment system not initialized. Please refresh and try again.");
      return;
    }

    setIsLoading(true);
    
    try {
      // Initialize TossPayments payment widget
      const paymentWidget = tossPayments.payment({
        customerKey: userId,
      });

      // Request billing auth for card registration
      await paymentWidget.requestBillingAuth({
        method: "CARD",
        successUrl: `${window.location.origin}/profile/billing/success?register=true`,
        failUrl: `${window.location.origin}/profile/billing/fail`,
        customerEmail: userEmail,
        customerName: userId, // Using userId as a fallback for name
      });
      
    } catch (error: any) {
      console.error("Billing auth error:", error);
      
      if (error.code === "USER_CANCEL") {
        toast.error("Card registration was cancelled");
      } else {
        toast.error(error.message || "Failed to register card");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Card Registration
          </CardTitle>
          <CardDescription>
            Register a card for automatic payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Secure Payment</AlertTitle>
            <AlertDescription>
              Your card information is securely managed by Toss Payments. 
              We only store encrypted billing keys.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-2">
              <h3 className="font-medium">Supported Cards</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Domestic credit cards</li>
                <li>• Domestic debit cards</li>
                <li>• Corporate cards (some restrictions)</li>
              </ul>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                After registering your card, your subscription will automatically renew each month.
                You can cancel anytime from your billing settings.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleBillingAuth}
              disabled={isLoading || !tossPayments}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Processing..." : "Register Card for Auto-Renewal"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Can I register international cards?</h4>
            <p className="text-sm text-muted-foreground">
              Sorry, currently only domestically issued cards can be registered for automatic payments.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Can I change my registered card?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, you can delete your existing card and register a new one at any time.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">When does automatic payment occur?</h4>
            <p className="text-sm text-muted-foreground">
              Automatic payment is processed in the morning on your subscription expiration date.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}