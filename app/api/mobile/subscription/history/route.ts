import { NextResponse } from "next/server";

import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/prisma/prisma-client";

interface PaymentHistoryItem {
  id: string;
  date: string;
  planName: string;
  amount: number;
  currency: string;
  status: string;
  paymentSource: string;
  method: string | null;
}

interface PaymentHistoryResponse {
  payments: PaymentHistoryItem[];
  total: number;
  page: number;
  perPage: number;
}

export async function GET(request: Request): Promise<NextResponse<PaymentHistoryResponse | { error: string }>> {
  const payload = await verifyMobileToken(request);

  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;
  const url = new URL(request.url);

  // Parse query params
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = parseInt(url.searchParams.get("perPage") || "20", 10);
  const dateFilter = url.searchParams.get("dateFilter"); // "30d", "90d", "all"

  try {
    // Build date filter
    let dateCondition = {};
    if (dateFilter === "30d") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateCondition = { requestedAt: { gte: thirtyDaysAgo } };
    } else if (dateFilter === "90d") {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      dateCondition = { requestedAt: { gte: ninetyDaysAgo } };
    }

    // Get total count
    const total = await prisma.payment.count({
      where: {
        userId,
        status: { in: ["PAID", "WAIVED", "REFUNDED"] },
        ...dateCondition,
      },
    });

    // Get payments with pagination
    const payments = await prisma.payment.findMany({
      where: {
        userId,
        status: { in: ["PAID", "WAIVED", "REFUNDED"] },
        ...dateCondition,
      },
      include: {
        plan: true,
      },
      orderBy: {
        requestedAt: "desc",
      },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const formattedPayments: PaymentHistoryItem[] = payments.map((payment) => ({
      id: payment.id,
      date: payment.approvedAt?.toISOString() || payment.requestedAt.toISOString(),
      planName: payment.plan.name,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentSource: payment.paymentSource,
      method: payment.method,
    }));

    return NextResponse.json({
      payments: formattedPayments,
      total,
      page,
      perPage,
    });
  } catch (error) {
    console.error("[Payment History] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}
