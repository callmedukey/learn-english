# Toss Payments Billing Testing Guide

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Generate secure encryption keys
npx tsx scripts/generate-billing-keys.ts

# Add to your .env file:
TOSS_CLIENT_KEY=test_ck_...  # Your Toss test client key
TOSS_CLIENT_SECRET=test_sk_...  # Your Toss test secret key
BILLING_KEY_ENCRYPTION_KEY=  # Generated from script above
```

### 2. Database Setup

```bash
npm run db:generate
npm run db:push
```

### 3. Start Services

```bash
# Development server
npm run dev

# Billing cron job (in another terminal)
pm2 start ecosystem.config.js --only billing-cron

# Monitor logs
pm2 logs billing-cron
```

## 🧪 Testing Scenarios

### A. Korean User - Billing Key Registration

1. Sign up/login as a Korean user (country: KR)
2. Go to Profile → Plans
3. Select a plan and click "Subscribe"
4. Use test card: `4330-1234-1234-1234`
5. Complete billing auth → redirected to success page
6. Check database: user should have `billingKey` populated

### B. Korean User - Recurring Payment

1. With billing key registered, wait for next billing cycle
2. Or manually trigger: `npx tsx jobs/subscription-billing.job.ts`
3. Check logs for successful payment
4. Verify subscription `endDate` is extended

### C. International User - One-Time Payment

1. Sign up with country != KR
2. Go to Profile → Plans
3. Price should show in USD
4. Use test card: `4242-4242-4242-4242`
5. Complete one-time payment
6. Verify: no billing key, `autoRenew = false`

### D. Payment Failure Scenarios

Test cards for failures:

- Insufficient funds: `4330-1234-1234-1235`
- Expired card: `4330-1234-1234-1236`
- International decline: `4000-0000-0000-9995`

## 📊 Monitoring

### Check PM2 Status

```bash
pm2 status
pm2 logs billing-cron --lines 100
```

### Database Queries

```sql
-- Check users with billing keys
SELECT id, email, billingKey IS NOT NULL as has_billing_key
FROM "User"
WHERE billingKey IS NOT NULL;

-- Check due subscriptions
SELECT s.*, u.email, p.name as plan_name
FROM "UserSubscription" s
JOIN "User" u ON s.userId = u.id
JOIN "Plan" p ON s.planId = p.id
WHERE s.nextBillingDate <= NOW()
AND s.recurringStatus = 'ACTIVE';

-- Check billing history
SELECT * FROM "BillingHistory"
ORDER BY processedAt DESC
LIMIT 10;
```

## ⚠️ Common Issues

### 1. "No billing key found"

- User hasn't registered payment method
- Billing key registration failed
- Check user's `billingKey` field in database

### 2. "FOREIGN_CARD_NOT_SUPPORTED"

- International card trying to register billing key
- Only Korean cards support billing keys

### 3. Payment timing issues

- Ensure cron job is running: `pm2 status`
- Check timezone settings (should be Asia/Seoul)
- Verify `nextBillingDate` in subscriptions

## 🔐 Security Checklist

- [ ] Never commit real API keys
- [ ] Billing keys are encrypted in database
- [ ] Use test keys for development
- [ ] Rotate encryption keys periodically
- [ ] Monitor failed payment attempts

## 📞 Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs billing-cron`
2. Check application logs: `npm run dev`
3. Verify environment variables are set
4. Test with Toss test cards only

Remember: Toss Payments billing keys are NOT auto-recurring. The cron job must run daily to process payments!
