import { PlanStats } from "../queries/plans.query";

interface PlanStatsProps {
  stats: PlanStats;
}

export default function PlanStatsComponent({ stats }: PlanStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-base font-medium text-gray-500">
                Total Plans
              </dt>
              <dd className="text-xl font-medium text-gray-900">
                {stats.totalPlans}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-base font-medium text-gray-500">
                Active Plans
              </dt>
              <dd className="text-xl font-medium text-gray-900">
                {stats.activePlans}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-500">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-base font-medium text-gray-500">
                Inactive Plans
              </dt>
              <dd className="text-xl font-medium text-gray-900">
                {stats.inactivePlans}
              </dd>
            </dl>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-base font-medium text-gray-500">
                Total Revenue
              </dt>
              <dd className="text-xl font-medium text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
