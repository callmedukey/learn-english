# Payment Schema Documentation

This document explains the payment and subscription system for the learn-english app, designed to work with Toss-Payment integration.

## Overview

The payment system supports flexible subscription plans with customizable durations. Default plans include:

- **1 Month Plan**: 9,900원 (30 days)
- **3 Month Plan**: 24,900원 (90 days) - 17% discount
- **1 Year Plan**: 89,900원 (365 days) - 25% discount

Admins can create custom plans with any duration and pricing.

## Schema Models

### 1. Plan Model

Defines flexible subscription plans with any duration.

```prisma
model Plan {
  id          String   @id @default(cuid())
  name        String   // "1 Month Plan", "Custom 45-Day Plan", etc.
  price       Int      // Price in KRW (e.g., 9900 for 9,900원)
  duration    Int      // Duration in days (30, 90, 365, or any custom value)
  description String?
  isActive    Boolean  @default(true)
  category    String?  // "monthly", "quarterly", "yearly", "custom", etc.
  sortOrder   Int      @default(0) // For display ordering
  // ... relations and timestamps
}
```

### 2. Payment Model

Records all payment transactions from Toss-Payment.

Key fields:

- `paymentKey`: Unique identifier from Toss-Payment
- `orderId`: Generated order ID for the transaction
- `amount`: Payment amount in KRW
- `status`: Payment status (PENDING, PAID, FAILED, etc.)
- `tossResponse`: Full JSON response from Toss-Payment API
- `customerEmail`, `customerName`, `customerMobilePhone`: Customer information

### 3. UserSubscription Model

Tracks user subscription status and expiration.

Key fields:

- `status`: Subscription status (ACTIVE, EXPIRED, CANCELLED, PENDING)
- `startDate`: When the subscription starts
- `endDate`: When the subscription expires
- `autoRenew`: Whether to auto-renew (future feature)

### 4. PaymentWebhook Model

Logs webhook events from Toss-Payment for debugging and audit purposes.

## Enums

### PaymentStatus

- `PENDING`: Payment initiated but not confirmed
- `PAID`: Payment successfully completed
- `FAILED`: Payment failed
- `CANCELLED`: Payment cancelled by user
- `REFUNDED`: Payment refunded

### PaymentMethod

Supported payment methods from Toss-Payment:

- `CARD`: Credit/Debit card
- `TRANSFER`: Bank transfer
- `VIRTUAL_ACCOUNT`: Virtual account
- `MOBILE_PHONE`: Mobile phone billing
- `GIFT_CERTIFICATE`: Gift certificate
- `EASY_PAY`: Easy payment services
- `FOREIGN_EASY_PAY`: Foreign easy payment services

### SubscriptionStatus

- `ACTIVE`: Subscription is currently active
- `EXPIRED`: Subscription has expired
- `CANCELLED`: Subscription was cancelled
- `PENDING`: Subscription is pending payment confirmation

## Usage Flow

### 1. Creating Custom Plans (Admin)

```typescript
// Admin can create any custom plan
const customPlan = await prisma.plan.create({
  data: {
    name: "45-Day Special Plan",
    price: 15000, // 15,000원
    duration: 45, // 45 days
    description: "Special promotional plan",
    category: "custom",
    sortOrder: 10,
    isActive: true,
  },
});
```

### 2. Payment Initiation

```typescript
// Create a payment record when user initiates payment
const payment = await prisma.payment.create({
  data: {
    userId: user.id,
    planId: selectedPlan.id,
    orderId: generateOrderId(),
    orderName: `${selectedPlan.name} - Learn English`,
    amount: selectedPlan.price,
    customerEmail: user.email,
    customerName: user.name,
    status: "PENDING",
  },
});
```

### 3. Payment Confirmation (from Toss-Payment webhook)

```typescript
// When payment is confirmed by Toss-Payment
const updatedPayment = await prisma.payment.update({
  where: { orderId },
  data: {
    paymentKey: tossResponse.paymentKey,
    status: "PAID",
    method: tossResponse.method,
    approvedAt: new Date(),
    tossResponse: tossResponse,
  },
});

// Create user subscription with flexible duration
const subscription = await prisma.userSubscription.create({
  data: {
    userId: payment.userId,
    planId: payment.planId,
    paymentId: payment.id,
    status: "ACTIVE",
    startDate: new Date(),
    endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
  },
});
```

### 4. Check User Access

```typescript
// Check if user has active subscription
const activeSubscription = await prisma.userSubscription.findFirst({
  where: {
    userId: user.id,
    status: "ACTIVE",
    endDate: {
      gt: new Date(),
    },
  },
  include: {
    plan: true,
  },
});

const hasAccess = !!activeSubscription;
```

### 5. Admin Dashboard Queries

#### View All Plans (with sorting)

```typescript
const plans = await prisma.plan.findMany({
  where: {
    isActive: true,
  },
  orderBy: {
    sortOrder: "asc",
  },
});
```

#### View Plans by Category

```typescript
const monthlyPlans = await prisma.plan.findMany({
  where: {
    category: "monthly",
    isActive: true,
  },
});
```

#### View All Payments

```typescript
const payments = await prisma.payment.findMany({
  include: {
    user: {
      select: {
        email: true,
        name: true,
        nickname: true,
      },
    },
    plan: true,
    subscription: true,
  },
  orderBy: {
    createdAt: "desc",
  },
});
```

#### Revenue Analytics by Plan Duration

```typescript
// Revenue by plan duration ranges
const revenueByDuration = await prisma.payment.groupBy({
  by: ["planId"],
  where: {
    status: "PAID",
  },
  _sum: {
    amount: true,
  },
  _count: {
    id: true,
  },
});

// Get plan details for each group
const plansWithRevenue = await Promise.all(
  revenueByDuration.map(async (item) => {
    const plan = await prisma.plan.findUnique({
      where: { id: item.planId },
    });
    return {
      ...item,
      plan,
    };
  }),
);
```

## Flexible Plan Management

### Benefits of Removing Enum Constraints:

1. **Custom Durations**: Create plans for any number of days (7, 14, 45, 180, etc.)
2. **Seasonal Promotions**: Easy to create limited-time offers
3. **A/B Testing**: Test different pricing and duration combinations
4. **Market Adaptation**: Adjust to market demands without schema changes

### Plan Categories:

Use the `category` field for grouping and filtering:

- `"monthly"` - Plans around 30 days
- `"quarterly"` - Plans around 90 days
- `"yearly"` - Plans around 365 days
- `"weekly"` - Short-term plans (7-14 days)
- `"custom"` - Special or promotional plans
- `"trial"` - Free trial periods

### Display Ordering:

Use `sortOrder` to control how plans appear in the UI:

- Lower numbers appear first
- Allows highlighting preferred plans
- Easy reordering without changing IDs

## Database Indexes

The schema includes optimized indexes for common queries:

- `Plan`: isActive, sortOrder (compound index)
- `Payment`: userId, status, requestedAt
- `UserSubscription`: userId, status, endDate
- `PaymentWebhook`: paymentKey, orderId, processed

## Security Considerations

1. **Payment Verification**: Always verify payment amounts and order IDs with Toss-Payment
2. **Webhook Security**: Validate webhook signatures from Toss-Payment
3. **User Access**: Check subscription status on every protected route
4. **Data Privacy**: Store minimal customer information, comply with privacy laws
5. **Plan Validation**: Validate plan duration and pricing in business logic

## Migration Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name flexible-subscription-plans

# Seed the database with initial plans
npx prisma db seed
```

## Environment Variables

Make sure to set these environment variables:

```env
# Toss-Payment
TOSS_CLIENT_KEY=test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm
TOSS_CLIENT_SECRET=test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6

# For production, replace with actual keys from Toss-Payment dashboard
```

## Testing

Use Toss-Payment's test environment for development:

- Test card numbers and scenarios are available in Toss-Payment documentation
- All test payments will have `test_` prefix in keys
- No real money is charged in test mode
