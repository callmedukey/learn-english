interface CouponStatsProps {
  stats: {
    totalCoupons: number;
    activeCoupons: number;
    usedCoupons: number;
    unusedCoupons: number;
  };
}

export default function CouponStats({ stats }: CouponStatsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Coupons */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <p className="text-base font-medium text-gray-600">Total Coupons</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalCoupons.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Active Coupons */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <p className="text-base font-medium text-gray-600">Active Coupons</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.activeCoupons.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Used Coupons */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <p className="text-base font-medium text-gray-600">Used Coupons</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.usedCoupons.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Unused Coupons */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <p className="text-base font-medium text-gray-600">Unused Coupons</p>
          <p className="text-2xl font-bold text-orange-600">
            {stats.unusedCoupons.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
