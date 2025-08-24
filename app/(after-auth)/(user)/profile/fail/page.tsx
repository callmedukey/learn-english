import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

interface FailPageProps {
  searchParams: Promise<{
    code?: string;
    message?: string;
  }>;
}

export default async function FailPage({ searchParams }: FailPageProps) {
  // Check if user has payment access during maintenance
  const hasAccess = await hasPaymentAccess();
  if (!hasAccess) {
    return <PaymentMaintenanceNotice />;
  }
  const params = await searchParams;

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-2xl">
        <Card className="border-red-200 text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">
              Payment Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              We&apos;re sorry, but your payment could not be processed. Please
              try again or contact support if the problem persists.
            </p>

            {params.message && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="mb-1 text-sm font-medium text-red-800">
                  Error Message:
                </p>
                <p className="text-sm text-red-700">{params.message}</p>
                {params.code && (
                  <p className="mt-2 text-xs text-red-600">
                    Error Code: {params.code}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Common reasons for payment failure:
              </p>
              <ul className="space-y-1 text-left text-sm text-gray-600">
                <li>• Insufficient funds in your account</li>
                <li>• Incorrect card information</li>
                <li>• Card expired or blocked</li>
                <li>• Network connection issues</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row">
              <Button
                asChild
                className="flex-1 bg-amber-500 hover:bg-amber-600"
              >
                <Link href="/profile">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Try Again
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/support">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
