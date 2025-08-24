export default function PaymentMaintenanceNotice() {
  return (
    <div className="container mx-auto py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-8 text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-orange-100 p-5">
            <svg
              className="h-10 w-10 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          
          <h2 className="mb-3 text-2xl font-bold text-gray-900">
            Payment System Under Maintenance
          </h2>
          
          <p className="mb-6 text-gray-600">
            We&apos;re currently updating our payment system to serve you better.
            <br />
            Please check back later to access payment features.
          </p>
          
          <div className="rounded-lg bg-white p-4">
            <p className="text-sm text-gray-500">
              We apologize for any inconvenience.
              <br />
              Our team is working to restore service as quickly as possible.
            </p>
          </div>
          
          <div className="mt-6">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}