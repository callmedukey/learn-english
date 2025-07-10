import { NextResponse } from "next/server";

// Test endpoint to verify webhook URL is accessible
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Toss Payments webhook endpoint is ready",
    timestamp: new Date().toISOString(),
  });
}