import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/auth";

import FreeSuccessContent from "./components/free-success-content";

interface FreeSuccessPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function FreeSuccessPage({
  searchParams,
}: FreeSuccessPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const params = await searchParams;
  const orderId = params.orderId;

  if (!orderId) {
    redirect("/profile");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
            <p className="text-gray-600">Processing your subscription...</p>
          </div>
        }
      >
        <FreeSuccessContent orderId={orderId} userId={session.user.id!} />
      </Suspense>
    </div>
  );
}