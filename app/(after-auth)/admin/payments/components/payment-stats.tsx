interface PaymentStatsProps {
  stats: {
    totalRevenue: number;
    totalPayments: number;
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
    successRate: number;
  };
}

export default function PaymentStats({ stats }: PaymentStatsProps) {
  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Total Revenue */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Total Payments */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-gray-600">Total Payments</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalPayments.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {stats.successfulPayments} successful
          </p>
        </div>
      </div>
    </div>
  );
}
