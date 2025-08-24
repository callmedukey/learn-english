import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { PaymentStatus } from "@/prisma/generated/prisma";

import { PaymentWithDetails } from "../queries/payments.query";

interface PaymentTableProps {
  payments: PaymentWithDetails[];
}

export default function PaymentTable({ payments }: PaymentTableProps) {
  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      [PaymentStatus.PAID]: {
        variant: "default" as const,
        color: "bg-green-100 text-green-800",
      },
      [PaymentStatus.PENDING]: {
        variant: "secondary" as const,
        color: "bg-orange-100 text-orange-800",
      },
      [PaymentStatus.FAILED]: {
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800",
      },
      [PaymentStatus.CANCELLED]: {
        variant: "outline" as const,
        color: "bg-gray-100 text-gray-800",
      },
      [PaymentStatus.REFUNDED]: {
        variant: "outline" as const,
        color: "bg-purple-100 text-purple-800",
      },
      [PaymentStatus.WAIVED]: {
        variant: "secondary" as const,
        color: "bg-blue-100 text-blue-800",
      },
    };

    const config = statusConfig[status];
    return <Badge className={config.color}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  if (payments.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500">
          No payments found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Subscription
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                  {payment.orderId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {payment.user.name || payment.user.nickname || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.user.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {payment.plan.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.plan.duration} days
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                  {payment.method}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(payment.status)}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                  <div>{format(payment.requestedAt, "MMM dd, yyyy")}</div>
                  <div className="text-xs text-gray-400">
                    {format(payment.requestedAt, "HH:mm")}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.subscription ? (
                    <div className="text-sm">
                      <div className="text-gray-900">
                        {payment.subscription.status}
                      </div>
                      <div className="text-xs text-gray-500">
                        Until{" "}
                        {format(payment.subscription.endDate, "MMM dd, yyyy")}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">
                      No subscription
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
