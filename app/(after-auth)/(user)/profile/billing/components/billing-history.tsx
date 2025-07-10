"use client";

import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Download, CheckCircle, XCircle, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Payment, Plan, BillingHistory } from "@/prisma/generated/prisma";

interface BillingHistoryProps {
  payments: (Payment & { plan: Plan })[];
  billingHistory: BillingHistory[];
}

const statusConfig = {
  PAID: {
    label: "Paid",
    variant: "default" as const,
    icon: CheckCircle,
    className: "text-green-600",
  },
  FAILED: {
    label: "Failed",
    variant: "destructive" as const,
    icon: XCircle,
    className: "text-red-600",
  },
  PENDING: {
    label: "Processing",
    variant: "secondary" as const,
    icon: Clock,
    className: "text-gray-600",
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "outline" as const,
    icon: XCircle,
    className: "text-gray-500",
  },
};

const paymentTypeLabels = {
  ONE_TIME: "One-time Payment",
  RECURRING: "Recurring Payment",
  INITIAL_SUBSCRIPTION: "Initial Subscription",
};

export default function BillingHistoryComponent({
  payments,
  billingHistory,
}: BillingHistoryProps) {
  const allTransactions = [
    ...payments.map((payment) => ({
      id: payment.id,
      type: "payment" as const,
      date: payment.approvedAt || payment.createdAt,
      amount: payment.amount,
      status: payment.status,
      planName: payment.plan.name,
      paymentType: payment.paymentType,
      method: payment.method,
      orderId: payment.orderId,
    })),
    ...billingHistory.map((history) => ({
      id: history.id,
      type: "billing" as const,
      date: history.processedAt,
      amount: history.amount,
      status: history.status === "SUCCESS" ? "PAID" : "FAILED",
      planName: "Recurring Payment",
      paymentType: "RECURRING" as const,
      method: "CARD",
      orderId: null,
      attemptNumber: history.attemptNumber,
      errorMessage: history.errorMessage,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDownloadReceipt = (orderId: string) => {
    // TODO: Implement receipt download
    console.log("Download receipt for order:", orderId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>
          View your payment history for the last 12 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        {allTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTransactions.map((transaction) => {
                  const config = statusConfig[transaction.status as keyof typeof statusConfig];
                  const StatusIcon = config.icon;
                  
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {format(new Date(transaction.date), "MMM dd, yyyy", {
                          locale: enUS,
                        })}
                      </TableCell>
                      <TableCell>
                        {transaction.planName}
                        {"attemptNumber" in transaction && transaction.attemptNumber && transaction.attemptNumber > 1 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (Retry {transaction.attemptNumber})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {paymentTypeLabels[transaction.paymentType] || transaction.paymentType}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₩{transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${config.className}`} />
                          <Badge variant={config.variant}>
                            {config.label}
                          </Badge>
                        </div>
                        {"errorMessage" in transaction && transaction.errorMessage && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {transaction.errorMessage}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.status === "PAID" && transaction.orderId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReceipt(transaction.orderId!)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No payment history</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}