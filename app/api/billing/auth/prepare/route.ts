import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has payment access during maintenance
    const { hasPaymentAccessByEmail } = await import("@/lib/utils/payment-access");
    if (!hasPaymentAccessByEmail(session.user.email!)) {
      return NextResponse.json(
        { error: "Payment system is under maintenance" },
        { status: 503 }
      );
    }

    const { userId } = await request.json();

    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Return the client key for Toss Payments initialization
    return NextResponse.json({
      clientKey: TOSS_CLIENT_KEY,
    });
  } catch (error) {
    console.error("Billing auth prepare error:", error);
    return NextResponse.json(
      { error: "Failed to prepare billing auth" },
      { status: 500 }
    );
  }
}