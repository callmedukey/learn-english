# Toss Payments Auto-Billing Implementation

## Overview

This document outlines the implementation of subscription payments using Toss Payments for the Reading Camp application, with different payment flows for Korean and international users.

## Current State

- One-time payments only
- Manual renewal required
- No billing key storage
- Basic subscription model

## Target State

- **Korean Users**: Auto-billing with billing keys (KRW)
- **International Users**: One-time payments only (USD)
- Comprehensive billing management
- Clear user communication about payment limitations

## Key Decision: Payment Strategy by User Type

### Korean Users (Country: South Korea)

- **Currency**: KRW (Korean Won)
- **Payment Type**: Recurring payments with billing keys
- **Auto-renewal**: Enabled by default for all Korean subscriptions
- **Payment Methods**: Cards, bank transfers, mobile payments
- **Important**: All Korean subscriptions use auto-renewal with stored billing keys.

### International Users (Country: Not South Korea)

- **Currency**: USD (US Dollars)
- **Payment Type**: One-time payments ONLY
- **Auto-renewal**: NOT SUPPORTED (해외카드 limitation)
- **Payment Methods**: International cards only
- **Important**: Must manually purchase new subscription when current one expires

## Implementation Phases

### Phase 1: Database Schema Updates

#### 1.1 Plan Model Extensions (payments.prisma)

Add USD pricing for international users:

```prisma
model Plan {
  id          String  @id @default(cuid())
  name        String
  price       Int     // Price in KRW for Korean users
  priceUSD    Float?  // Price in USD for international users (required for international support)
  duration    Int     // Duration in days
  description String?
  isActive    Boolean @default(true)
  sortOrder   Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  payments      Payment[]
  subscriptions UserSubscription[]

  @@index([isActive, sortOrder])
}
```

#### 1.2 User Model Extensions (auth.prisma)

For Korean users only - billing key support:

```prisma
model User {
  // ... existing fields

  // Billing key information (Korean users only)
  billingKey         String?
  billingAuthKey     String?   @db.Text // Temporary during auth flow
  billingKeyIssuedAt DateTime?
  billingMethod      String?   // "CARD" for domestic cards
  cardInfo           Json?     // Encrypted card details

  // ... rest of fields
}
```

#### 1.3 Payment Model Extensions (payments.prisma)

```prisma
enum PaymentType {
  ONE_TIME
  RECURRING
  INITIAL_SUBSCRIPTION
}

model Payment {
  // ... existing fields

  paymentType      PaymentType @default(ONE_TIME)
  billingKey       String?     // For recurring payments (Korean users only)
  isInternational  Boolean     @default(false)
  currency         String      @default("KRW") // "KRW" or "USD"
  amount           Int         // Amount in smallest unit (won for KRW, cents for USD)
  recurringCycle   Int?        // Days between payments (Korean users only)

  // ... rest of fields
}
```

#### 1.4 Enhanced Subscription Model

```prisma
enum RecurringStatus {
  ACTIVE
  PAUSED
  CANCELLED
  INACTIVE
  PENDING_PAYMENT
}

model UserSubscription {
  // ... existing fields

  // Billing key reference
  billingKey        String?

  // Recurring payment info
  recurringStatus   RecurringStatus @default(INACTIVE)
  lastBillingDate   DateTime?
  nextBillingDate   DateTime?
  failedAttempts    Int @default(0)
  lastFailureReason String?
  lastFailureDate   DateTime?

  // Grace period handling
  gracePeriodEnd    DateTime?

  // ... rest of fields
}

// New model for billing history
model BillingHistory {
  id               String   @id @default(cuid())
  userId           String
  subscriptionId   String
  billingKey       String
  amount           Int
  status           String
  attemptNumber    Int      @default(1)
  errorCode        String?
  errorMessage     String?
  processedAt      DateTime @default(now())

  user         User             @relation(fields: [userId], references: [id])
  subscription UserSubscription @relation(fields: [subscriptionId], references: [id])

  @@index([userId])
  @@index([subscriptionId])
  @@index([processedAt])
}
```

### Phase 2: Payment Flow Implementation

#### 2.1 Payment Flow Decision Logic

```typescript
export function getPaymentFlow(user: User) {
  const isKorean = user.country?.name === "South Korea";

  return {
    supportsBillingKey: isKorean,
    currency: isKorean ? "KRW" : "USD",
    paymentType: isKorean ? "RECURRING_CAPABLE" : "ONE_TIME_ONLY",
    message: isKorean
      ? "자동 갱신을 활성화하여 끊김 없는 서비스를 이용하세요"
      : "Note: International cards require manual renewal. We'll send you a reminder email before your subscription expires.",
  };
}
```

#### 2.2 Billing Auth Page Structure (Korean Users Only)

```
/app/(after-auth)/(user)/profile/billing/
     page.tsx              # Main billing management page
     register/page.tsx     # Card registration page
     success/page.tsx      # Registration success
     components/
         billing-key-form.tsx
         card-list.tsx
         billing-history.tsx
```

#### 2.3 Billing Key Registration Flow (Korean Users Only)

For Korean users, billing key registration is done as part of the first payment process:

```typescript
// 1. During payment, check if user has billing key
if (isKoreanUser && !user.billingKey) {
  // First-time payment: Register billing key
  await tossPayments.requestBillingAuth("카드", {
    customerKey: userId,
    successUrl: `${origin}/profile/billing/success?paymentId=${paymentId}`,
    failUrl: `${origin}/profile/billing/fail`,
  });
  // Exit here - billing auth success will continue the payment
  return;
}

// 2. In billing auth success handler, issue billing key
const billingKeyResponse = await fetch("/api/billing/auth/issue", {
  method: "POST",
  body: JSON.stringify({
    authKey: authKey,
    customerKey: customerKey,
  }),
});

// 3. Store billing key securely (encrypted)
await updateUser({
  billingKey: encrypt(billingKeyResponse.billingKey),
  billingKeyIssuedAt: new Date(),
  billingMethod: billingKeyResponse.card.cardType,
  cardInfo: {
    last4: billingKeyResponse.card.number.slice(-4),
    issuer: billingKeyResponse.card.issuerCode,
  },
});

// 4. If there's a pending payment, continue with it
if (paymentId) {
  window.location.href = `/profile/billing/continue-payment?paymentId=${paymentId}`;
}
```

#### 2.4 International Users - One-Time Payment Flow

For non-Korean users:

```typescript
// No billing key support for international cards
const paymentFlow = getPaymentFlow(user);

if (!paymentFlow.supportsBillingKey) {
  // Calculate amount based on user's country
  const amount = plan.priceUSD
    ? Math.round(plan.priceUSD * 100) // Convert USD to cents
    : Math.round(plan.price / 1100); // Fallback: rough KRW to USD conversion

  // Direct payment only
  await paymentWidget.requestPayment({
    method: "CARD",
    amount: {
      currency: "USD",
      value: amount,
    },
    orderId: payment.orderId,
    orderName: payment.orderName,
    successUrl: `${window.location.origin}/profile/success`,
    failUrl: `${window.location.origin}/profile/fail`,
    // No billing auth for international cards
  });

  // After successful payment, create subscription with autoRenew = false
  await createSubscription({
    ...subscriptionData,
    autoRenew: false, // International users cannot auto-renew
  });
}
```

#### 2.5 API Routes

##### `/api/billing/auth/issue/route.ts` (Korean Users Only)

```typescript
export async function POST(request: NextRequest) {
  const { authKey, customerKey } = await request.json();

  // Issue billing key from Toss
  const response = await fetch(
    "https://api.tosspayments.com/v1/billing/authorizations/issue",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(TOSS_CLIENT_SECRET + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authKey,
        customerKey,
      }),
    },
  );

  const billingKeyData = await response.json();

  // Encrypt and store billing key
  await prisma.user.update({
    where: { id: customerKey },
    data: {
      billingKey: encrypt(billingKeyData.billingKey),
      billingKeyIssuedAt: new Date(),
      billingMethod: billingKeyData.card.cardType,
      cardInfo: {
        last4: billingKeyData.card.number.slice(-4),
        issuer: billingKeyData.card.company,
        cardType: billingKeyData.card.cardType,
      },
    },
  });

  return NextResponse.json({ success: true });
}
```

### Phase 3: Recurring Payment Execution (Korean Users Only)

**Important**:

- Recurring payments are only available for Korean users with domestic cards
- Toss Payments does NOT automatically schedule recurring payments
- We must implement our own cron job to check and process due payments daily

#### 3.1 Billing Service (`/lib/services/billing.service.ts`)

```typescript
export class BillingService {
  async executeBillingPayment(
    subscription: UserSubscription & { user: User; plan: Plan },
  ): Promise<PaymentResult> {
    const { user, plan } = subscription;

    if (!user.billingKey) {
      throw new Error("No billing key found");
    }

    const decryptedBillingKey = decrypt(user.billingKey);
    const orderId = generateOrderId();

    try {
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
            amount: plan.price,
            currency: "KRW", // Always charge in KRW
            orderId,
            orderName: `${plan.name} - Recurring Payment`,
            customerEmail: user.email,
            customerName: user.name || user.nickname,
            // Toss automatically handles international cards
          }),
        },
      );

      const paymentResult = await response.json();

      if (response.ok) {
        // Success - update subscription
        await this.handlePaymentSuccess(subscription, paymentResult);
        return { success: true, payment: paymentResult };
      } else {
        // Failure - handle retry logic
        await this.handlePaymentFailure(subscription, paymentResult);
        return { success: false, error: paymentResult };
      }
    } catch (error) {
      await this.handlePaymentFailure(subscription, error);
      throw error;
    }
  }

  private async handlePaymentSuccess(
    subscription: UserSubscription,
    paymentResult: any,
  ) {
    const nextBillingDate = new Date();
    nextBillingDate.setDate(
      nextBillingDate.getDate() + subscription.plan.duration,
    );

    await prisma.$transaction([
      // Create payment record
      prisma.payment.create({
        data: {
          userId: subscription.userId,
          planId: subscription.planId,
          paymentKey: paymentResult.paymentKey,
          orderId: paymentResult.orderId,
          orderName: paymentResult.orderName,
          amount: paymentResult.amount,
          status: "PAID",
          paymentType: "RECURRING",
          billingKey: subscription.user.billingKey,
          method: paymentResult.method,
          approvedAt: new Date(paymentResult.approvedAt),
          tossResponse: paymentResult,
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
          amount: paymentResult.amount,
          status: "SUCCESS",
        },
      }),
    ]);
  }

  private async handlePaymentFailure(
    subscription: UserSubscription,
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
          lastFailureReason: error.message || error.code,
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
          errorCode: error.code,
          errorMessage: error.message,
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
}
```

#### 3.2 Cron Job Setup

**Important**: Since Toss Payments only provides the billing key API and does NOT handle scheduling, we must implement our own cron job system.

##### PM2 Cron Configuration

```javascript
// ecosystem.config.js - Add this to the apps array
{
  name: "billing-cron",
  script: "npx",
  args: "tsx scripts/billing-cron-wrapper.ts",
  cron_restart: "0 10 * * *", // Every day at 10:00 AM KST
  autorestart: false,
  instances: 1,
  exec_mode: "fork",
  watch: false,
  env: {
    NODE_ENV: "production",
  },
  error_file: "logs/billing-cron-error.log",
  out_file: "logs/billing-cron-out.log",
}
```

##### Billing Cron Wrapper

```typescript
// /scripts/billing-cron-wrapper.ts
import { toZonedTime } from "date-fns-tz";
import { processRecurringBilling } from "../jobs/subscription-billing.job";

async function main() {
  const now = new Date();
  const koreaTime = toZonedTime(now, "Asia/Seoul");

  console.log(`[Billing Cron] Starting at ${koreaTime.toISOString()}`);

  try {
    await processRecurringBilling();
    console.log("[Billing Cron] Completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("[Billing Cron] Failed:", error);
    process.exit(1);
  }
}

main();
```

#### 3.3 Subscription Job Implementation

```typescript
// /jobs/subscription-billing.job.ts
export async function processRecurringBilling() {
  const billingService = new BillingService();

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
      },
    },
    include: {
      user: true,
      plan: true,
    },
  });

  // Process each subscription
  for (const subscription of subscriptionsDue) {
    try {
      await billingService.executeBillingPayment(subscription);
    } catch (error) {
      console.error(
        `Billing failed for subscription ${subscription.id}:`,
        error,
      );
    }
  }

  // Retry failed payments in grace period
  const failedSubscriptions = await prisma.userSubscription.findMany({
    where: {
      recurringStatus: "PENDING_PAYMENT",
      gracePeriodEnd: {
        gt: new Date(),
      },
      failedAttempts: {
        lt: 3,
      },
    },
    include: {
      user: true,
      plan: true,
    },
  });

  for (const subscription of failedSubscriptions) {
    try {
      await billingService.executeBillingPayment(subscription);
    } catch (error) {
      console.error(`Retry failed for subscription ${subscription.id}:`, error);
    }
  }
}
```

### Phase 4: Payment Processing by User Type

#### 4.1 Payment Configuration Logic

```typescript
export function getPaymentConfig(user: User, plan: Plan) {
  const isKorean = user.country?.name === "South Korea";

  return {
    // Different currencies based on user location
    currency: isKorean ? "KRW" : "USD",
    amount: isKorean ? plan.price : Math.round((plan.priceUSD || 0) * 100), // priceUSD should be set by admin
    // Billing key support
    supportsBillingKey: isKorean,
    supportsAutoRenewal: isKorean,
    // Payment methods available
    supportedMethods: isKorean ? ["CARD", "TRANSFER", "MOBILE"] : ["CARD"], // International users can only use cards
    // UI messaging
    renewalMessage: isKorean
      ? "자동 갱신을 활성화하여 끊김 없는 서비스를 이용하세요"
      : "Note: International cards require manual renewal when subscription expires",
  };
}
```

#### 4.2 Payment Implementation by User Type

##### Korean Users - Full Payment Flow

```typescript
// 1. Initial payment with option to save card
const payment = await createPayment({
  userId: user.id,
  planId: plan.id,
  amount: plan.price,
  currency: "KRW",
  paymentType: "INITIAL_SUBSCRIPTION",
});

// 2. Payment widget with billing key option
await paymentWidget.requestPayment({
  method: "CARD",
  amount: {
    currency: "KRW",
    value: payment.amount,
  },
  orderId: payment.orderId,
  orderName: payment.orderName,
  // Korean users can save card for auto-renewal
  billingKeyMethod: "CARD",
});

// 3. After payment, offer billing key registration
if (paymentSuccess && !user.billingKey) {
  // Redirect to billing key registration
  router.push("/profile/billing/register");
}
```

##### International Users - One-Time Payment Only

```typescript
// 1. Create payment with USD amount (priceUSD must be set by admin)
const payment = await createPayment({
  userId: user.id,
  planId: plan.id,
  amount: Math.round(plan.priceUSD * 100), // Convert to cents
  currency: "USD",
  paymentType: "ONE_TIME",
  isInternational: true,
});

// 2. Payment widget for one-time payment
await paymentWidget.requestPayment({
  method: "CARD",
  amount: {
    currency: "USD",
    value: payment.amount,
  },
  orderId: payment.orderId,
  orderName: payment.orderName,
  // No billing key option for international cards
});

// 3. Create subscription with autoRenew disabled
const subscription = await createSubscription({
  userId: user.id,
  planId: plan.id,
  paymentId: payment.id,
  autoRenew: false, // Always false for international users
  status: "ACTIVE",
});
```

#### 4.3 User Interface Considerations

```tsx
// Show appropriate messaging based on user type
function PaymentMethodInfo({ user, plan }: { user: User; plan: Plan }) {
  const isInternational = user.country?.name !== "South Korea";

  return (
    <div className="payment-info">
      {isInternational ? (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle>International Payment Notice</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Price: ${plan.priceUSD} USD</li>
              <li>• One-time payment only (no auto-renewal)</li>
              <li>• You'll need to manually renew before expiration</li>
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Domestic Payment Benefits</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Price: ₩{plan.price.toLocaleString()} KRW</li>
              <li>• Auto-renewal available</li>
              <li>• Save your card for automatic payments</li>
              <li>• Never worry about subscription expiration</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

#### 4.4 Error Handling for International Cards

```typescript
// Common international card error codes
const INTERNATIONAL_CARD_ERRORS = {
  FOREIGN_CARD_NOT_SUPPORTED:
    "This card is not supported for international transactions",
  INVALID_CARD_COUNTRY: "Card country not supported",
  "3D_SECURE_FAILED": "3D Secure authentication failed",
  RISK_DETECTED: "Transaction blocked for security reasons",
  FX_LIMIT_EXCEEDED: "Foreign exchange limit exceeded",
};

// Handle international card specific errors
function handlePaymentError(error: any) {
  const errorMessage = INTERNATIONAL_CARD_ERRORS[error.code] || error.message;

  if (error.code && error.code.startsWith("FOREIGN_")) {
    // Log international card specific errors
    console.error("International card error:", error);
  }

  return errorMessage;
}
```

### Phase 5: Payment Failure Notifications

Implement notifications for users when their recurring payments fail:

#### 5.1 Update Notification Types

```prisma
// Add to NotificationType enum in notifications.prisma
enum NotificationType {
  // ... existing types
  PAYMENT_FAILED
  PAYMENT_RETRY_FAILED
}
```

#### 5.2 Send Notifications in BillingService

```typescript
// In billing.service.ts handlePaymentFailure() method
private async sendPaymentFailureNotification(
  subscription: UserSubscription & { user: User; plan: Plan },
  error: any,
  attemptNumber: number,
) {
  const isLastAttempt = attemptNumber >= 3;
  
  await prisma.notification.create({
    data: {
      userId: subscription.userId,
      type: isLastAttempt ? "PAYMENT_RETRY_FAILED" : "PAYMENT_FAILED",
      title: isLastAttempt 
        ? "Subscription Cancelled - Payment Failed" 
        : "Payment Failed - Action Required",
      message: isLastAttempt
        ? `Your subscription has been cancelled after 3 failed payment attempts. Please update your payment method to continue.`
        : `Payment failed for your ${subscription.plan.name}. We'll retry in 24 hours. Grace period ends on ${subscription.gracePeriodEnd?.toLocaleDateString()}.`,
      actionUrl: "/profile/billing"
    }
  });
  
  // Also send email notification
  // TODO: Implement email sending
}
```

### Phase 6: Webhook Integration

#### 6.1 Webhook Handler

The webhook handler is already implemented at `/app/api/webhooks/toss-billing/route.ts` and handles all necessary billing events including:
- Payment confirmations
- Payment failures
- Billing key issued/updated/removed events

The webhook implementation includes:
- Signature verification for security
- Event processing for all payment and billing key events
- Automatic billing key encryption and storage
- Subscription status updates
- Webhook event logging for auditing

### Phase 7: User Interface Components

#### 7.1 Billing Management Page (Korean Users)

```tsx
// /app/(after-auth)/(user)/profile/billing/page.tsx
export default function BillingManagementPage() {
  return (
    <div className="space-y-6">
      <h1>Billing & Payment Methods</h1>

      {/* Current Payment Method */}
      <PaymentMethodCard />

      {/* Auto-Renewal Settings */}
      <AutoRenewalSettings />

      {/* Billing History */}
      <BillingHistoryTable />

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={updatePaymentMethod}>Update Payment Method</Button>
        <Button variant="outline" onClick={cancelAutoRenewal}>
          Cancel Auto-Renewal
        </Button>
      </div>
    </div>
  );
}
```

#### 7.2 Payment Method Registration (Korean Users Only)

```tsx
// /app/(after-auth)/(user)/profile/billing/register/page.tsx
export default function RegisterPaymentMethod() {
  const handleBillingAuth = async () => {
    const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

    try {
      await tossPayments.requestBillingAuth("카드", {
        customerKey: userId,
        successUrl: `${window.location.origin}/profile/billing/success`,
        failUrl: `${window.location.origin}/profile/billing/fail`,
      });
    } catch (error) {
      toast.error("Failed to register payment method");
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Register Payment Method</CardTitle>
          <CardDescription>
            Save your card for automatic subscription renewal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleBillingAuth} className="w-full">
            Register Card
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 7.3 Plans Page - Different UI by User Type

```tsx
// /app/(after-auth)/(user)/profile/plans/page.tsx
export default function PlansPage({ user }: { user: User }) {
  const isKorean = user.country?.code === "KR";

  return (
    <div>
      <h1>Choose Your Plan</h1>

      {/* Show different messaging based on user type */}
      {!isKorean && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            International payments are processed in USD. Auto-renewal is not
            available for international cards, so you'll need to manually renew
            your subscription.
          </AlertDescription>
        </Alert>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currency={isKorean ? "KRW" : "USD"}
            price={isKorean ? plan.price : plan.priceUSD}
            showAutoRenewal={isKorean}
          />
        ))}
      </div>
    </div>
  );
}
```

## Production Deployment & Scheduling

### Understanding Toss Payments Billing Keys

**Critical Point**: Toss Payments billing keys are NOT auto-recurring subscriptions. They are simply stored payment methods that allow you to charge customers without re-authentication. You must:

1. Store the billing key securely (encrypted)
2. Implement your own scheduling system
3. Call the Toss billing API at the appropriate time
4. Handle failures and retries yourself

### Scheduling Options

#### 1. PM2 Cron (Recommended for VPS/Dedicated Servers)

- Already implemented in our ecosystem.config.js
- Runs on the same server as the application
- Simple to monitor and manage with PM2 commands

#### 2. Vercel Cron (For Vercel Deployments)

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/billing",
      "schedule": "0 1 * * *" // 10:00 AM KST (1:00 AM UTC)
    }
  ]
}
```

#### 3. External Cron Services

- cron-job.org
- EasyCron
- AWS CloudWatch Events
- Google Cloud Scheduler

### Monitoring & Alerts

1. **Failed Payment Alerts**

   - Email notifications after each failure
   - Slack/Discord webhooks for critical failures
   - Dashboard to monitor payment health

2. **Cron Job Monitoring**

   - Use services like UptimeRobot or Pingdom
   - Health check endpoint: `/api/health/billing`
   - PM2 logs: `pm2 logs billing-cron`
   - Log all billing attempts

3. **Testing Commands**

   ```bash
   # Test billing job locally
   npm run billing-job

   # Test billing wrapper (with timezone check)
   npm run billing-wrapper-test

   # View PM2 logs
   npm run logs

   # Check PM2 status
   npm run status
   ```

## Security Considerations

### Encryption

```typescript
// Billing key encryption using AES-256-GCM
import crypto from "crypto";

const algorithm = "aes-256-gcm";
const key = Buffer.from(process.env.BILLING_KEY_ENCRYPTION_KEY!, "hex");

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
```

### Environment Variables

```env
# Toss Payments Keys
TOSS_CLIENT_KEY=test_ck_... # Public client key
TOSS_CLIENT_SECRET=test_sk_... # Secret key for server-side
TOSS_WEBHOOK_SECRET=...     # Webhook signature verification

# Encryption
BILLING_KEY_ENCRYPTION_KEY=... # 32-byte hex key for AES-256

# Feature Flags
ENABLE_AUTO_BILLING=true
ENABLE_INTERNATIONAL_PAYMENTS=true
```

## Testing with Toss Test Environment

### Test Card Numbers

For testing in the Toss test environment, use these card numbers:

#### Domestic Cards (Korean)

- Success: `4330-1234-1234-1234` (Any future expiry date, any CVC)
- Insufficient funds: `4330-1234-1234-1235`
- Card expired: `4330-1234-1234-1236`

#### International Cards (해외카드)

- Success: `4242-4242-4242-4242` (Visa)
- Success: `5555-5555-5555-4444` (Mastercard)
- 3D Secure required: `4000-0025-0000-3155`
- Declined: `4000-0000-0000-9995`

### Testing Billing Keys

1. Use test card numbers above for registration
2. Billing keys work immediately in test environment
3. Test recurring payments with various scenarios

## Testing Checklist

### Billing Key Registration

- [ ] Successful card registration (domestic)
- [ ] Successful card registration (international)
- [ ] Failed registration handling
- [ ] Duplicate card prevention
- [ ] Card update flow

### Recurring Payments

- [ ] Successful recurring payment
- [ ] Failed payment with retry
- [ ] Grace period handling
- [ ] Subscription cancellation
- [ ] Payment method expiration

### International Cards (해외카드)

- [ ] USD payment processing for international users
- [ ] One-time payment only (no billing key)
- [ ] Proper currency conversion (USD to cents)
- [ ] Manual renewal required messaging
- [ ] Renewal reminder emails
- [ ] International card error handling

### Edge Cases

- [ ] Expired cards
- [ ] Insufficient funds
- [ ] Network failures
- [ ] Webhook replay handling
- [ ] Concurrent payment prevention

## Migration Strategy

1. **Phase 1**: Deploy database changes
2. **Phase 2**: Deploy billing key registration (opt-in)
3. **Phase 3**: Migrate existing users (optional registration)
4. **Phase 4**: Enable auto-billing for new subscriptions
5. **Phase 5**: Full rollout with existing user migration

## Monitoring & Analytics

### Key Metrics

- Billing key registration rate
- Payment success rate
- Retry success rate
- Churn due to payment failures
- International vs domestic payment stats

### Alerts

- Payment failure rate > 5%
- Webhook processing delays
- Billing job failures
- Unusual transaction patterns

## Support Documentation

### User FAQs

1. How to register a payment method
2. How to update card information
3. How to cancel auto-renewal
4. Understanding billing cycles
5. International card requirements

### Admin Tools

- View user billing status
- Manually retry failed payments
- Cancel/refund subscriptions
- Billing history export
- Manage USD pricing for plans

## Coupon System for Recurring Payments

### Overview

The coupon system has been enhanced to support both one-time and recurring payment discounts, with special consideration for Korean users' mandatory auto-renewal system.

### Coupon Types

#### 1. CouponRecurringType Enum

```prisma
enum CouponRecurringType {
  ONE_TIME   // Can only be used on one-time payments
  RECURRING  // Can only be used on recurring payments
}
```

#### 2. Coupon Fields

- **recurringType**: Determines how the coupon can be used
- **recurringMonths**: Number of months the discount applies (null = forever)
- **maxRecurringUses**: Maximum number of new subscriptions that can use this coupon (NOT per-payment limit)
- **flatDiscountUSD**: USD discount amount for international users

### How Coupons Work

#### 1. Coupon Type Enforcement
- **ONE_TIME coupons**: Can ONLY be used on one-time payments (international users, non-recurring Korean payments)
- **RECURRING coupons**: Can ONLY be used on recurring/auto-renewal payments (Korean users only)

#### 2. Initial Payment
When a user makes their first payment with a coupon:
- System checks if the coupon type matches the payment type
- For recurring payments with RECURRING coupons, a `CouponApplication` record is automatically created
- The discount is applied to the initial payment

#### 3. Recurring Payments (Korean Users Only)
During auto-renewal:
- BillingService checks for active `CouponApplication` records
- Applies discount based on remaining months and usage limits
- Updates the application record after successful payment
- Deactivates the coupon when limits are reached

#### 4. Examples

**Example 1: One-Time Payment Coupon (International/Non-recurring)**
```javascript
{
  code: "WELCOME50",
  discount: 50,
  recurringType: "ONE_TIME",
  active: true
}
```

**Example 2: Recurring Payment Coupon - First 3 Months 50% Off**
```javascript
{
  code: "RECURRING3MONTHS50",
  discount: 50,
  recurringType: "RECURRING",
  recurringMonths: 3,
  active: true
}
```

**Example 3: Recurring Payment Coupon - Permanent 20% Discount**
```javascript
{
  code: "FOREVER20",
  discount: 20,
  recurringType: "RECURRING",
  recurringMonths: null, // Forever
  active: true
}
```

**Example 4: $10 Off for International Users (One-time only)**
```javascript
{
  code: "GLOBAL10OFF",
  flatDiscount: 13000, // ~$10 in KRW for Korean users
  flatDiscountUSD: 10.00, // $10 for international users
  recurringType: "ONE_TIME", // International users can't auto-renew
  active: true
}
```

### Implementation Details

#### CouponApplication Model
Tracks the relationship between coupons and subscriptions:
- **appliedCount**: Number of times the discount has been applied
- **remainingMonths**: Months left for the discount (null = unlimited)
- **isActive**: Whether the coupon is still applicable

#### Billing Process
1. BillingService queries active CouponApplications for the subscription
2. Calculates discount based on coupon type and currency
3. Applies discount to the payment amount
4. Updates CouponApplication after successful payment
5. Deactivates coupon when limits are reached

### Currency Support

#### Korean Users (KRW)
- Use `flatDiscount` field for flat amount discounts
- Percentage discounts work normally
- Support full recurring discount capabilities

#### International Users (USD)
- Use `flatDiscountUSD` field for flat amount discounts
- Percentage discounts work normally
- Only ONE_TIME coupons since auto-renewal isn't supported

### Admin Considerations

When creating coupons:
1. Set `recurringType` based on intended usage (ONE_TIME or RECURRING)
2. For time-limited discounts, set `recurringMonths` (e.g., 3 for "first 3 months")
3. For international support, set both `flatDiscount` and `flatDiscountUSD`
4. Use `maxRecurringUses` to limit how many customers can start subscriptions with this coupon

### API Usage

#### Automatic Coupon Application
For recurring payments with RECURRING coupons, the system automatically creates a CouponApplication during payment confirmation. No manual action required.

#### Manual Coupon Application (deprecated)
The `createCouponApplicationAction` is now rarely needed as the system handles this automatically based on coupon type.

## Summary

### Payment Flow Comparison

| Feature         | Korean Users           | International Users |
| --------------- | ---------------------- | ------------------- |
| Currency        | KRW                    | USD                 |
| Payment Type    | Recurring              | One-time only       |
| Billing Keys    | Supported              | Not supported       |
| Auto-renewal    | Enabled by default     | Not available       |
| Payment Methods | Card, Transfer, Mobile | Card only           |
| Renewal Process | Automatic              | Manual              |
| Coupon Support  | Full recurring support | One-time only       |

### Key Implementation Points

1. **Database**: Add `priceUSD` field to Plan model (admin must set this for international support)
2. **Payment Flow**: Check user's country name to determine payment flow
3. **Billing Key Registration**: For Korean users, done during first payment using `requestBillingAuth`
4. **UI/UX**: Clear messaging about payment types
5. **Notifications**: System for payment failure alerts
6. **Admin**: Must set both KRW and USD prices when creating plans
7. **Coupons**: Enhanced system supporting recurring discounts with time limits

### Important Notes

- International cards (해외카드) do NOT support billing keys in Toss Payments
- USD amounts must be converted to cents (multiply by 100)
- Always set `autoRenew = false` for international users
- Korean users get `autoRenew = true` by default
- Billing key registration uses `requestBillingAuth` method, NOT payment parameters
- After billing key registration, payment continues automatically
- Admins must set priceUSD for plans to support international users
- Recurring coupons only work for Korean users with auto-renewal enabled
