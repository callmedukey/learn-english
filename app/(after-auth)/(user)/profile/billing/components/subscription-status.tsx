"use client";

import { differenceInDays, format, startOfDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { Calendar, CheckCircle2, AlertCircle, Clock } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UserSubscription, Plan, CouponApplication, DiscountCoupon } from "@/prisma/generated/prisma";

interface SubscriptionStatusProps {
  subscription?: UserSubscription & { 
    plan: Plan;
    couponApplications?: (CouponApplication & { coupon: DiscountCoupon })[];
  };
  isKoreanUser: boolean;
}

export default function SubscriptionStatus({
  subscription,
  isKoreanUser,
}: SubscriptionStatusProps) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
          <CardDescription>No active subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <p className="mb-4 text-muted-foreground">
              Start a subscription to access all content
            </p>
            <Button asChild>
              <a href="/profile">View Subscription Plans</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const today = startOfDay(new Date());
  const startDate = startOfDay(new Date(subscription.startDate));
  const endDate = startOfDay(new Date(subscription.endDate));

  const daysRemaining = Math.max(0, differenceInDays(endDate, today));
  const totalDays = differenceInDays(endDate, startDate);
  const daysUsed = Math.max(0, differenceInDays(today, startDate));
  const progressPercentage = Math.min(100, (daysUsed / totalDays) * 100);

  const getStatusConfig = () => {
    if (daysRemaining > 7) {
      return {
        icon: CheckCircle2,
        iconColor: "text-green-600",
        badgeVariant: "default" as const,
        title: "Active",
      };
    } else if (daysRemaining > 0) {
      return {
        icon: AlertCircle,
        iconColor: "text-amber-600",
        badgeVariant: "secondary" as const,
        title: "Expiring Soon",
      };
    } else {
      return {
        icon: AlertCircle,
        iconColor: "text-red-600",
        badgeVariant: "destructive" as const,
        title: "Expired",
      };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>{subscription.plan.name}</CardDescription>
          </div>
          <Badge variant={statusConfig.badgeVariant}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusConfig.title}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subscription Timeline */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subscription Period</span>
            <span className="font-medium">
              {format(subscription.startDate, "MMM dd, yyyy", { locale: enUS })}{" "}
              - {format(subscription.endDate, "MMM dd, yyyy", { locale: enUS })}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{daysUsed} days used</span>
            <span
              className={`font-medium ${daysRemaining <= 7 ? "text-amber-600" : ""}`}
            >
              {daysRemaining > 0
                ? `${daysRemaining} days remaining`
                : "Expired"}
            </span>
          </div>
        </div>

        {/* Auto-renewal Status */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Auto-renewal</span>
            </div>
            {subscription.autoRenew ? (
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                Enabled
              </Badge>
            ) : subscription.recurringStatus === "CANCELLED" ? (
              <Badge variant="destructive" className="text-white">
                Cancelled
              </Badge>
            ) : (
              <Badge variant="outline">Disabled</Badge>
            )}
          </div>
          {subscription.autoRenew && subscription.nextBillingDate && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-muted-foreground">
                Next billing date:{" "}
                {format(subscription.nextBillingDate, "MMMM dd, yyyy", {
                  locale: enUS,
                })}
              </p>
              {/* Show next payment amount */}
              <p className="text-sm">
                Next payment:{" "}
                <span className="font-medium">
                  {(() => {
                    const activeCoupon = subscription.couponApplications?.find(ca => ca.isActive);
                    if (!activeCoupon) {
                      // No active coupon, full price
                      return new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "KRW",
                        minimumFractionDigits: 0,
                      }).format(subscription.plan.price);
                    }
                    
                    // Check if coupon will still be active for next payment
                    if (activeCoupon.remainingMonths === null || activeCoupon.remainingMonths > 0) {
                      // Calculate discounted price
                      let discountAmount = 0;
                      if (activeCoupon.coupon.discount > 0) {
                        discountAmount = Math.floor((subscription.plan.price * activeCoupon.coupon.discount) / 100);
                      } else if (activeCoupon.coupon.flatDiscount > 0) {
                        discountAmount = Math.min(activeCoupon.coupon.flatDiscount, subscription.plan.price);
                      }
                      const discountedPrice = Math.max(0, subscription.plan.price - discountAmount);
                      
                      return (
                        <>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "KRW",
                            minimumFractionDigits: 0,
                          }).format(discountedPrice)}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {activeCoupon.coupon.code}
                          </Badge>
                        </>
                      );
                    } else {
                      // Coupon will expire, show full price
                      return (
                        <>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "KRW",
                            minimumFractionDigits: 0,
                          }).format(subscription.plan.price)}
                          <span className="ml-2 text-xs text-amber-600">
                            (discount expires)
                          </span>
                        </>
                      );
                    }
                  })()}
                </span>
              </p>
            </div>
          )}
          {subscription.recurringStatus === "CANCELLED" && (
            <p className="mt-2 text-sm text-muted-foreground">
              Your subscription will not renew after{" "}
              {format(subscription.endDate, "MMMM dd, yyyy", { locale: enUS })}
            </p>
          )}
        </div>

        {/* Alerts */}
        {subscription.recurringStatus === "CANCELLED" && daysRemaining > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Subscription Cancelled</AlertTitle>
            <AlertDescription>
              You&apos;ve cancelled your subscription. You can continue using
              the service until{" "}
              {format(subscription.endDate, "MMMM dd, yyyy", { locale: enUS })}.
            </AlertDescription>
          </Alert>
        )}

        {daysRemaining <= 7 &&
          daysRemaining > 0 &&
          !subscription.autoRenew &&
          subscription.recurringStatus !== "CANCELLED" && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle>Your subscription is expiring soon</AlertTitle>
              <AlertDescription>
                {isKoreanUser
                  ? "Enable auto-renewal to continue using the service."
                  : "Renew your subscription to continue using the service."}
              </AlertDescription>
            </Alert>
          )}

        {subscription.recurringStatus === "PENDING_PAYMENT" &&
          subscription.gracePeriodEnd && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle>Payment Failed</AlertTitle>
              <AlertDescription>
                Automatic payment failed. Please update your payment method by{" "}
                {format(subscription.gracePeriodEnd, "MMM dd")}.
              </AlertDescription>
            </Alert>
          )}
      </CardContent>
    </Card>
  );
}
