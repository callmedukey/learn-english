import { XCircle } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingAuthFailPage() {
  return (
    <div className="container max-w-2xl py-6">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <CardTitle>Card Registration Failed</CardTitle>
          <CardDescription>
            There was a problem registering your card
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Please check your card information and try again. 
              If the problem persists, please try a different card.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/profile/billing/register">
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/profile/billing">
                Go Back
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}