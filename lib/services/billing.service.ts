import * as crypto from "crypto";

import { UserSubscription, User, Plan, CouponApplication, DiscountCoupon } from "@/prisma/generated/prisma";
import { prisma } from "@/prisma/prisma-client";

const TOSS_CLIENT_SECRET = process.env.TOSS_CLIENT_SECRET!;

// Encryption setup
const algorithm = "aes-256-gcm";
const BILLING_KEY_ENCRYPTION_KEY = process.env.BILLING_KEY_ENCRYPTION_KEY!;
const key = Buffer.from(BILLING_KEY_ENCRYPTION_KEY, "hex");

interface PaymentResult {
  success: boolean;
  payment?: any;
  error?: any;
}

export class BillingService {
  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `AUTO_${timestamp}_${random}`;
  }

  async executeBillingPayment(
    subscription: UserSubscription & { user: User; plan: Plan },
  ): Promise<PaymentResult> {
    const { user, plan } = subscription;

    console.log(
      `[BillingService] Processing payment for subscription ${subscription.id}, user ${user.id}`,
    );

    if (!user.billingKey) {
      console.error(
        `[BillingService] No billing key found for user ${user.id}`,
      );
      throw new Error("No billing key found");
    }

    // Check for active coupon applications
    const activeCouponApplications = await prisma.couponApplication.findMany({
      where: {
        subscriptionId: subscription.id,
        isActive: true,
      },
      include: {
        coupon: true,
      },
    });

    // Calculate the final amount after applying coupons
    let finalAmount = plan.price;
    let appliedCoupon: CouponApplication & { coupon: DiscountCoupon } | null = null;
    let discountAmount = 0;

    if (activeCouponApplications.length > 0) {
      // Apply the first active coupon (typically there should only be one)
      const couponApp = activeCouponApplications[0];
      const { coupon } = couponApp;

      // Check if coupon is still within its recurring months limit
      if (couponApp.remainingMonths === null || couponApp.remainingMonths > 0) {
        if (coupon.discount > 0) {
          // Percentage discount
          discountAmount = Math.floor((plan.price * coupon.discount) / 100);
        } else if (coupon.flatDiscount > 0) {
          // Flat discount in KRW
          discountAmount = Math.min(coupon.flatDiscount, plan.price);
        }

        finalAmount = Math.max(0, plan.price - discountAmount);
        appliedCoupon = couponApp;

        console.log(
          `[BillingService] Applying coupon ${coupon.code}: discount=₩${discountAmount}, finalAmount=₩${finalAmount}`,
        );
      }
    }

    // Check if this is a 100% discount (free) payment
    if (finalAmount === 0 && appliedCoupon) {
      console.log(
        `[BillingService] Processing waived payment due to 100% discount coupon: ${appliedCoupon.coupon.code}`,
      );
      
      const orderId = this.generateOrderId();
      
      // Create a mock payment result for waived payments
      const waivedPaymentResult = {
        paymentKey: `WAIVED_${orderId}`,
        orderId,
        orderName: `${plan.name} - 자동 결제 (${appliedCoupon.coupon.code} 100% 할인 적용)`,
        amount: 0,
        totalAmount: 0,
        method: "WAIVED",
        status: "WAIVED",
        approvedAt: new Date().toISOString(),
        customerKey: user.id,
        customerEmail: user.email,
        customerName: user.nickname || user.email.split("@")[0],
      };
      
      // Process as successful payment without charging
      await this.handlePaymentSuccess(subscription, waivedPaymentResult, appliedCoupon, discountAmount);
      return { success: true, payment: waivedPaymentResult };
    }

    const decryptedBillingKey = this.decrypt(user.billingKey);
    const orderId = this.generateOrderId();

    try {
      console.log(
        `[BillingService] Executing payment: orderId=${orderId}, amount=₩${finalAmount}`,
      );

      // Execute payment using billing key
      const response = await fetch(
        `https://api.tosspayments.com/v1/billing/${decryptedBillingKey}`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(TOSS_CLIENT_SECRET + ":").toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerKey: user.id,
            amount: finalAmount,
            currency: "KRW", // Always charge in KRW for Korean users
            orderId,
            orderName: `${plan.name} - 자동 결제${appliedCoupon ? ` (${appliedCoupon.coupon.code} 할인 적용)` : ""}`,
            customerEmail: user.email,
            customerName: user.nickname || user.email.split("@")[0],
          }),
        },
      );

      const paymentResult = await response.json();

      if (response.ok) {
        console.log(
          `[BillingService] Payment successful: paymentKey=${paymentResult.paymentKey}`,
        );
        // Success - update subscription and coupon application
        await this.handlePaymentSuccess(subscription, paymentResult, appliedCoupon, discountAmount);
        return { success: true, payment: paymentResult };
      } else {
        console.error(
          `[BillingService] Payment failed: ${paymentResult.code} - ${paymentResult.message}`,
        );
        // Failure - handle retry logic
        await this.handlePaymentFailure(subscription, paymentResult);
        return { success: false, error: paymentResult };
      }
    } catch (error) {
      console.error(`[BillingService] Payment exception:`, error);
      await this.handlePaymentFailure(subscription, error);
      throw error;
    }
  }

  private async handlePaymentSuccess(
    subscription: UserSubscription & { user: User; plan: Plan },
    paymentResult: any,
    appliedCoupon: (CouponApplication & { coupon: DiscountCoupon }) | null = null,
    discountAmount: number = 0,
  ) {
    const nextBillingDate = new Date();
    nextBillingDate.setDate(
      nextBillingDate.getDate() + subscription.plan.duration,
    );

    const transactionOperations: any[] = [
      // Create payment record
      prisma.payment.create({
        data: {
          userId: subscription.userId,
          planId: subscription.planId,
          paymentKey: paymentResult.paymentKey,
          orderId: paymentResult.orderId,
          orderName: paymentResult.orderName,
          amount: paymentResult.amount || paymentResult.totalAmount,
          status: paymentResult.status === "WAIVED" ? "WAIVED" : "PAID",
          paymentType: "RECURRING",
          billingKey: subscription.user.billingKey,
          method: paymentResult.method || "CARD",
          approvedAt: new Date(paymentResult.approvedAt),
          tossResponse: paymentResult,
          // Add coupon information if applicable
          couponId: appliedCoupon?.couponId || null,
          couponCode: appliedCoupon?.coupon.code || null,
          originalAmount: appliedCoupon ? subscription.plan.price : paymentResult.amount,
          discountAmount: discountAmount || null,
        },
      }),

      // Update subscription
      prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          endDate: nextBillingDate,
          lastBillingDate: new Date(),
          nextBillingDate,
          failedAttempts: 0,
          lastFailureReason: null,
          recurringStatus: "ACTIVE",
        },
      }),

      // Log billing history
      prisma.billingHistory.create({
        data: {
          userId: subscription.userId,
          subscriptionId: subscription.id,
          billingKey: subscription.user.billingKey!,
          amount: paymentResult.amount || paymentResult.totalAmount,
          status: "SUCCESS",
        },
      }),
    ];

    // Update coupon application if one was used
    if (appliedCoupon) {
      const newAppliedCount = appliedCoupon.appliedCount + 1;
      const newRemainingMonths = appliedCoupon.remainingMonths !== null 
        ? appliedCoupon.remainingMonths - 1 
        : null;

      // Check if coupon should be deactivated (only based on remaining months)
      const shouldDeactivate = 
        (appliedCoupon.remainingMonths !== null && newRemainingMonths !== null && newRemainingMonths <= 0);

      transactionOperations.push(
        prisma.couponApplication.update({
          where: { id: appliedCoupon.id },
          data: {
            appliedCount: newAppliedCount,
            remainingMonths: newRemainingMonths,
            isActive: !shouldDeactivate,
          },
        })
      );

      console.log(
        `[BillingService] Updated coupon application: appliedCount=${newAppliedCount}, remainingMonths=${newRemainingMonths}, isActive=${!shouldDeactivate}`,
      );
    }

    await prisma.$transaction(transactionOperations);

    // Send success notification
    await this.sendPaymentSuccessNotification(subscription);
  }

  private async handlePaymentFailure(
    subscription: UserSubscription & { user: User; plan: Plan },
    error: any,
  ) {
    const failedAttempts = subscription.failedAttempts + 1;
    const isLastAttempt = failedAttempts >= 3;

    await prisma.$transaction([
      // Update subscription with failure info
      prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          failedAttempts,
          lastFailureReason: error.message || error.code || "Unknown error",
          lastFailureDate: new Date(),
          recurringStatus: isLastAttempt ? "CANCELLED" : "PENDING_PAYMENT",
          // Set grace period (3 days)
          gracePeriodEnd: isLastAttempt
            ? null
            : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      }),

      // Log failure
      prisma.billingHistory.create({
        data: {
          userId: subscription.userId,
          subscriptionId: subscription.id,
          billingKey: subscription.user.billingKey!,
          amount: subscription.plan.price,
          status: "FAILED",
          attemptNumber: failedAttempts,
          errorCode: error.code || null,
          errorMessage: error.message || "Payment failed",
        },
      }),
    ]);

    // Send notification
    await this.sendPaymentFailureNotification(
      subscription,
      error,
      failedAttempts,
    );
  }

  private async sendPaymentSuccessNotification(
    subscription: UserSubscription & { user: User; plan: Plan },
  ) {
    // TODO: Implement email notification
    console.log(
      `Payment success notification for user ${subscription.user.email}`,
    );
  }

  private async sendPaymentFailureNotification(
    subscription: UserSubscription & { user: User; plan: Plan },
    error: any,
    attemptNumber: number,
  ) {
    // TODO: Implement email notification
    console.log(
      `Payment failure notification for user ${subscription.user.email}, attempt ${attemptNumber}`,
    );
  }

  // Method to check and process subscriptions due for billing
  async processSubscriptionsDue(): Promise<void> {
    console.log(
      "[BillingService] Starting to process subscriptions due for billing...",
    );

    // Find subscriptions due for billing
    const subscriptionsDue = await prisma.userSubscription.findMany({
      where: {
        recurringStatus: "ACTIVE",
        autoRenew: true,
        nextBillingDate: {
          lte: new Date(),
        },
        user: {
          billingKey: {
            not: null,
          },
          country: {
            name: "South Korea", // Only Korean users support auto-renewal
          },
        },
      },
      include: {
        user: true,
        plan: true,
      },
    });

    console.log(
      `[BillingService] Found ${subscriptionsDue.length} subscriptions due for billing`,
    );

    // Process each subscription
    let successCount = 0;
    let failureCount = 0;

    for (const subscription of subscriptionsDue) {
      try {
        console.log(
          `[BillingService] Processing billing for subscription ${subscription.id}`,
        );
        await this.executeBillingPayment(subscription);
        successCount++;
      } catch (error) {
        console.error(
          `[BillingService] Billing failed for subscription ${subscription.id}:`,
          error,
        );
        failureCount++;
      }
    }

    console.log(
      `[BillingService] Billing complete: ${successCount} successful, ${failureCount} failed`,
    );
  }

  // Method to retry failed payments in grace period
  async retryFailedPayments(): Promise<void> {
    const failedSubscriptions = await prisma.userSubscription.findMany({
      where: {
        recurringStatus: "PENDING_PAYMENT",
        gracePeriodEnd: {
          gt: new Date(),
        },
        failedAttempts: {
          lt: 3,
        },
        user: {
          billingKey: {
            not: null,
          },
        },
      },
      include: {
        user: true,
        plan: true,
      },
    });

    for (const subscription of failedSubscriptions) {
      try {
        console.log(`Retrying payment for subscription ${subscription.id}`);
        await this.executeBillingPayment(subscription);
      } catch (error) {
        console.error(
          `Retry failed for subscription ${subscription.id}:`,
          error,
        );
      }
    }
  }
}
