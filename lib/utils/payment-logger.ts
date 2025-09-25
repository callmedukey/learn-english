import * as fs from "fs";
import * as path from "path";

const PAYMENTS_LOG_PATH = path.join(process.cwd(), "payments", "payments_log.txt");

interface PaymentLogEntry {
  timestamp: string;
  type: "PAYMENT_ATTEMPT" | "PAYMENT_SUCCESS" | "PAYMENT_FAILED" | "PAYMENT_WAIVED" | "BILLING_JOB_START" | "BILLING_JOB_COMPLETE" | "BILLING_JOB_ERROR";
  userId?: string;
  subscriptionId?: string;
  paymentKey?: string;
  orderId?: string;
  amount?: number;
  originalAmount?: number;
  discountAmount?: number;
  couponCode?: string;
  status?: string;
  error?: string;
  attemptNumber?: number;
  successCount?: number;
  failureCount?: number;
  totalProcessed?: number;
  message?: string;
}

export class PaymentLogger {
  private static ensureLogDirectory(): void {
    const logDir = path.dirname(PAYMENTS_LOG_PATH);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private static formatLogEntry(entry: PaymentLogEntry): string {
    const { timestamp, type, ...data } = entry;
    const dataString = Object.entries(data)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");

    return `[${timestamp}] ${type} - ${dataString}\n`;
  }

  private static writeToLog(entry: PaymentLogEntry): void {
    try {
      this.ensureLogDirectory();
      const logLine = this.formatLogEntry(entry);
      fs.appendFileSync(PAYMENTS_LOG_PATH, logLine, "utf8");
    } catch (error) {
      console.error("Failed to write to payment log:", error);
    }
  }

  static logPaymentAttempt(userId: string, subscriptionId: string, amount: number): void {
    this.writeToLog({
      timestamp: new Date().toISOString(),
      type: "PAYMENT_ATTEMPT",
      userId,
      subscriptionId,
      amount,
    });
  }

  static logPaymentSuccess(
    userId: string,
    subscriptionId: string,
    paymentKey: string,
    orderId: string,
    amount: number,
    originalAmount?: number,
    discountAmount?: number,
    couponCode?: string,
  ): void {
    this.writeToLog({
      timestamp: new Date().toISOString(),
      type: "PAYMENT_SUCCESS",
      userId,
      subscriptionId,
      paymentKey,
      orderId,
      amount,
      originalAmount,
      discountAmount,
      couponCode,
    });
  }

  static logPaymentWaived(
    userId: string,
    subscriptionId: string,
    orderId: string,
    couponCode: string,
    originalAmount: number,
  ): void {
    this.writeToLog({
      timestamp: new Date().toISOString(),
      type: "PAYMENT_WAIVED",
      userId,
      subscriptionId,
      orderId,
      amount: 0,
      originalAmount,
      discountAmount: originalAmount,
      couponCode,
    });
  }

  static logPaymentFailure(
    userId: string,
    subscriptionId: string,
    amount: number,
    error: string,
    attemptNumber: number,
  ): void {
    this.writeToLog({
      timestamp: new Date().toISOString(),
      type: "PAYMENT_FAILED",
      userId,
      subscriptionId,
      amount,
      error,
      attemptNumber,
    });
  }

  static logBillingJobStart(): void {
    this.writeToLog({
      timestamp: new Date().toISOString(),
      type: "BILLING_JOB_START",
      message: "Starting daily billing job",
    });
  }

  static logBillingJobComplete(successCount: number, failureCount: number, totalProcessed: number): void {
    this.writeToLog({
      timestamp: new Date().toISOString(),
      type: "BILLING_JOB_COMPLETE",
      successCount,
      failureCount,
      totalProcessed,
      message: `Billing job completed: ${successCount} successful, ${failureCount} failed`,
    });
  }

  static logBillingJobError(error: string): void {
    this.writeToLog({
      timestamp: new Date().toISOString(),
      type: "BILLING_JOB_ERROR",
      error,
      message: "Billing job encountered an error",
    });
  }
}