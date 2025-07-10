"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";


interface BillingAuthSuccessProps {
  authKey: string;
  customerKey: string;
  paymentId?: string;
}

export default function BillingAuthSuccess({ 
  authKey, 
  customerKey,
  paymentId 
}: BillingAuthSuccessProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const issueBillingKey = async () => {
      try {
        const response = await fetch("/api/billing/auth/issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authKey, customerKey }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to issue billing key");
        }

        setStatus("success");
        toast.success("Card successfully registered");
        
        // If there's a pending payment, execute it immediately using the billing key
        if (paymentId) {
          try {
            // Execute the first payment using the billing key
            const paymentResponse = await fetch("/api/billing/execute-first-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            });

            const paymentData = await paymentResponse.json();

            if (!paymentResponse.ok) {
              throw new Error(paymentData.error || "Failed to execute payment");
            }

            toast.success("Payment completed!");
            // Redirect to success page
            setTimeout(() => {
              router.push("/profile/success?orderId=" + paymentData.orderId);
            }, 1500);
          } catch (paymentError) {
            console.error("Payment execution error:", paymentError);
            toast.error("Card registered but payment failed. Please try again.");
            setTimeout(() => {
              router.push("/profile/plans");
            }, 2000);
          }
        } else {
          // Otherwise, redirect to billing management page
          setTimeout(() => {
            router.push("/profile/billing");
          }, 2000);
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to register card"
        );
        toast.error("Failed to register card");
      }
    };

    issueBillingKey();
  }, [authKey, customerKey, router, paymentId]);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        {status === "processing" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <CardTitle>Registering Card...</CardTitle>
            <CardDescription>
              Please wait a moment
            </CardDescription>
          </>
        )}
        
        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <CardTitle>Card Registration Complete!</CardTitle>
            <CardDescription>
              Your card has been registered for automatic payments
            </CardDescription>
          </>
        )}
        
        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <CardTitle>Registration Failed</CardTitle>
            <CardDescription>
              There was a problem registering your card
            </CardDescription>
          </>
        )}
      </CardHeader>
      
      <CardContent>
        {status === "error" && (
          <>
            <Alert className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Button 
                onClick={() => router.push("/profile/billing/register")}
                className="w-full"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => router.push("/profile/billing")}
                variant="outline"
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </>
        )}
        
        {status === "success" && (
          <p className="text-center text-sm text-muted-foreground">
            {paymentId ? "Continuing with payment..." : "Redirecting to billing management..."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}