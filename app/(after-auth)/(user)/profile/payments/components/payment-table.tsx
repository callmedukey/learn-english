import { format } from "date-fns";
import { CreditCard, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/payment-config";
import { PaymentStatus } from "@/prisma/generated/prisma";

import { UserPaymentWithDetails } from "../../queries/payments.query";

interface PaymentTableProps {
  payments: UserPaymentWithDetails[];
  userCountry: string | null;
}

// function getStatusBadgeVariant(status: PaymentStatus) {
//   switch (status) {
//     case "PAID":
//       return "default"; // Green
//     case "PENDING":
//       return "secondary"; // Gray
//     case "FAILED":
//       return "destructive"; // Red
//     case "CANCELLED":
//       return "outline"; // Gray outline
//     case "REFUNDED":
//       return "secondary"; // Gray
//     default:
//       return "secondary";
//   }
// }

function getStatusColor(status: PaymentStatus) {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800 border-green-200";
    case "PENDING":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "FAILED":
      return "bg-red-100 text-red-800 border-red-200";
    case "CANCELLED":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "REFUNDED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getPaymentTypeIcon(paymentType: string) {
  if (paymentType === "RECURRING") {
    return <RefreshCw className="h-4 w-4" />;
  }
  return <CreditCard className="h-4 w-4" />;
}

function getPaymentTypeLabel(paymentType: string, isKoreanUser: boolean) {
  if (paymentType === "RECURRING") {
    return "Auto-renewal";
  }
  if (paymentType === "INITIAL_SUBSCRIPTION") {
    return isKoreanUser ? "Initial Payment" : "Subscription";
  }
  return "One-time";
}

export default function PaymentTable({ payments, userCountry }: PaymentTableProps) {
  const isKoreanUser = userCountry === "South Korea";
  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">No payments found</p>
            <p className="mt-1 text-sm">
              Try adjusting your filters or make your first payment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="font-medium text-gray-700">
                  Date
                </TableHead>
                <TableHead className="font-medium text-gray-700">
                  Transaction ID
                </TableHead>
                <TableHead className="font-medium text-gray-700">
                  Plan
                </TableHead>
                <TableHead className="font-medium text-gray-700">
                  Type
                </TableHead>
                <TableHead className="font-medium text-gray-700">
                  Amount
                </TableHead>
                <TableHead className="font-medium text-gray-700">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow
                  key={payment.id}
                  className="border-gray-100 hover:bg-gray-50"
                >
                  <TableCell className="text-gray-900">
                    {format(new Date(payment.requestedAt), "MMM dd, yyyy")}
                    <div className="text-xs text-gray-500">
                      {format(new Date(payment.requestedAt), "HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-700">
                    {payment.orderId}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    <div className="font-medium">{payment.plan.name}</div>
                    <div className="text-xs text-gray-500">
                      {payment.plan.duration} days
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPaymentTypeIcon(payment.paymentType)}
                      <span className="text-sm">
                        {getPaymentTypeLabel(payment.paymentType, isKoreanUser)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {formatCurrency(payment.amount, isKoreanUser ? "KRW" : "USD")}
                    {payment.discountAmount && payment.discountAmount > 0 && (
                      <div className="text-xs text-green-600">
                        -{formatCurrency(payment.discountAmount, isKoreanUser ? "KRW" : "USD")} discount
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(payment.status)} border`}
                      variant="outline"
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
