# Toss Payments Auto-Billing Implementation Status

## Overview

The Toss Payments auto-billing system has been successfully implemented with support for both Korean users (with recurring payments) and international users (one-time payments only).

## Implementation Status

### ✅ Completed Features

#### 1. Database Schema

- ✅ User model has billing key fields (`billingKey`, `billingAuthKey`, `billingKeyIssuedAt`, `billingMethod`, `cardInfo`)
- ✅ Payment model supports recurring payments (`paymentType`, `billingKey`, `isInternational`, `currency`)
- ✅ UserSubscription model has auto-renewal fields (`autoRenew`, `recurringStatus`, `nextBillingDate`, etc.)
- ✅ BillingHistory model tracks all billing attempts
- ✅ Plan model includes `priceUSD` field for international pricing

#### 2. Payment Flow

- ✅ Korean users: Mandatory auto-renewal with billing key registration
- ✅ International users: One-time payments only (no billing key support)
- ✅ Currency detection based on user country (KRW for Korea, USD for others)
- ✅ Proper price display in both currencies

#### 3. Billing Key Registration (Korean Users Only)

- ✅ Billing key registration during first payment
- ✅ Secure encryption of billing keys using AES-256-GCM
- ✅ Continue payment flow after successful registration
- ✅ Card information storage for display purposes

#### 4. Recurring Payment System

- ✅ BillingService with complete payment execution logic
- ✅ Automatic retry logic with grace period (3 days)
- ✅ Failure handling and history tracking
- ✅ PM2 cron job configuration (daily at 10 AM)
- ✅ Billing cron wrapper script

#### 5. API Routes

- ✅ `/api/billing/auth/issue` - Issue billing key after authorization
- ✅ `/api/payments/confirm` - Confirm payment and create subscription
- ✅ `/api/payments/[paymentId]` - Get payment details
- ✅ `/api/billing/cancel-subscription` - Cancel subscription
- ✅ `/api/billing/remove` - Remove billing key

#### 6. User Interface

- ✅ Plan selection with currency-specific pricing
- ✅ Payment summary with proper formatting
- ✅ Billing management page (Korean users only)
- ✅ Clear messaging about payment limitations
- ✅ Auto-renewal notices

#### 7. Security & Configuration

- ✅ Environment variable configuration
- ✅ Encryption key generation script
- ✅ Proper error handling and logging
- ✅ Webhook signature verification ready

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```env
# Toss Payments
NEXT_PUBLIC_TOSS_CLIENT_ID="your-toss-client-key"
TOSS_CLIENT_SECRET="your-toss-secret-key"
TOSS_WEBHOOK_SECRET="your-webhook-secret"

# Encryption Keys (generate using the script below)
BILLING_KEY_ENCRYPTION_KEY="64-character-hex-string"
CRON_SECRET="your-cron-secret"
```

### 2. Generate Encryption Keys

Run the utility script to generate secure keys:

```bash
npx tsx scripts/generate-billing-keys.ts
```

### 3. Database Migration

Ensure your database is up to date:

```bash
npm run db:generate
npm run db:push  # or npm run db:migrate for production
```

### 4. Start Cron Jobs

The billing cron job is configured in `ecosystem.config.js`. Start it with PM2:

```bash
pm2 start ecosystem.config.js --only billing-cron
```

## Testing Checklist

### For Korean Users (Auto-Renewal)

- [ ] First payment triggers billing key registration
- [ ] Card is saved successfully after registration
- [ ] Subscription shows as auto-renewing
- [ ] Can view and manage billing methods
- [ ] Can cancel auto-renewal

### For International Users (One-Time)

- [ ] Prices shown in USD
- [ ] No billing key registration offered
- [ ] Clear message about manual renewal
- [ ] Cannot access billing management page
- [ ] Payment completes successfully

### Cron Job Testing

- [ ] Run billing job manually: `npm run billing-job`
- [ ] Check logs: `pm2 logs billing-cron`
- [ ] Verify subscriptions are charged on schedule

## Important Notes

### Korean Users

- **Auto-renewal is MANDATORY** - they cannot opt out
- All payments use billing keys for recurring charges
- Currency: KRW (Korean Won)
- Payment methods: Cards, bank transfers, mobile payments

### International Users

- **One-time payments ONLY** - 해외카드 (international cards) don't support billing keys
- Must manually renew when subscription expires
- Currency: USD (US Dollars)
- Payment methods: International cards only

### Toss Payments Billing Keys

- Toss does NOT automatically schedule recurring payments
- We must actively check and charge subscriptions daily
- Billing keys are just stored payment methods
- Our cron job handles the scheduling

## Remaining Tasks

### High Priority

- [ ] Implement email notifications for payment success/failure
- [ ] Set up webhook handlers for real-time payment status updates
- [ ] Add admin dashboard for monitoring billing health

### Medium Priority

- [ ] Implement subscription reminder emails for international users
- [ ] Add billing key update/rotation functionality
- [ ] Create detailed billing reports

### Low Priority

- [ ] Add more payment method options
- [ ] Implement promotional pricing
- [ ] Add usage-based billing support

## Troubleshooting

### Common Issues

1. **Billing key registration fails**

   - Check TOSS_CLIENT_SECRET is correct
   - Verify user country is "South Korea"
   - Check browser console for errors

2. **Cron job not running**

   - Check PM2 status: `pm2 status`
   - View logs: `pm2 logs billing-cron`
   - Verify working directory in ecosystem.config.js

3. **Encryption/Decryption errors**

   - Ensure BILLING_KEY_ENCRYPTION_KEY is set
   - Key must be 64 characters (32 bytes in hex)
   - Check for key rotation issues

4. **International payments fail**
   - Verify USD pricing is set on plans
   - Check currency conversion logic
   - Review Toss payment logs

## Support Resources

- [Toss Payments Documentation](https://docs.tosspayments.com)
- [Billing Key Guide](https://docs.tosspayments.com/guides/payment-widget/integration#빌링키-발급)
- [International Payments](https://docs.tosspayments.com/guides/payment-widget/foreign-card)

## Contact

For issues or questions, please contact the development team.
