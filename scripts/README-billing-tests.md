# Billing Test Scripts

This directory contains scripts for testing the TOSS Payments billing integration, particularly focusing on recurring payments and coupon discount functionality.

## Scripts Overview

### 1. **check-subscription-coupon.ts**
Diagnostic tool to check why coupons might not be applying during billing.

```bash
npx tsx scripts/check-subscription-coupon.ts [email]
npx tsx scripts/check-subscription-coupon.ts test@readingchamp.com
```

Features:
- Shows all active subscriptions for a user
- Lists all coupon applications and their status
- Calculates expected payment amounts
- Shows recent billing history
- Provides recommendations if coupons are missing

### 2. **apply-test-coupon.ts**
Apply or reset a test coupon to a user's active subscription.

```bash
npx tsx scripts/apply-test-coupon.ts [email] [coupon-code]
npx tsx scripts/apply-test-coupon.ts test@readingchamp.com TEST_3MONTH_50OFF
```

Features:
- Creates coupon if it doesn't exist
- Applies coupon to active subscription
- Can reset existing coupon applications
- Shows expected payment calculations

### 3. **test-billing-single-user.ts**
Run a single billing cycle for a specific user (mimics the cron job).

```bash
npx tsx scripts/test-billing-single-user.ts [email]
npx tsx scripts/test-billing-single-user.ts test@readingchamp.com
```

Features:
- Shows subscription details
- Displays active coupons and expected discounts
- Executes actual payment via TOSS API
- Verifies if charged amount matches expectations
- Shows if coupon was properly applied

### 4. **test-recurring-billing-with-coupon.ts**
Comprehensive test that runs 4 consecutive billing cycles to verify coupon expiration.

```bash
# Dry run (mock TOSS API)
npx tsx scripts/test-recurring-billing-with-coupon.ts --dry-run

# Real API test
npx tsx scripts/test-recurring-billing-with-coupon.ts

# Skip confirmation
npx tsx scripts/test-recurring-billing-with-coupon.ts --yes
```

Features:
- Sets up complete test environment
- Runs 4 billing cycles sequentially
- Verifies discount applies for first 3 payments
- Confirms 4th payment charges full price
- Provides detailed summary and verification

### 5. **test-recurring-billing-robust.ts**
More robust version of the recurring billing test with better error handling.

```bash
npx tsx scripts/test-recurring-billing-robust.ts --yes
```

Features:
- Better error recovery
- Checks database for successful payments even if API returns error
- More detailed status reporting
- Handles edge cases better

## Common Test Scenarios

### Testing a 3-month 50% discount coupon:

1. **Check current status:**
   ```bash
   npx tsx scripts/check-subscription-coupon.ts test@readingchamp.com
   ```

2. **Apply the coupon if missing:**
   ```bash
   npx tsx scripts/apply-test-coupon.ts test@readingchamp.com TEST_3MONTH_50OFF
   ```

3. **Run a single billing test:**
   ```bash
   npx tsx scripts/test-billing-single-user.ts test@readingchamp.com
   ```
   - Should charge ₩20,000 instead of ₩40,000 (50% discount)

4. **Run the full 4-cycle test:**
   ```bash
   npx tsx scripts/test-recurring-billing-with-coupon.ts
   ```
   - Cycles 1-3: ₩20,000 (discounted)
   - Cycle 4: ₩40,000 (full price)

## Troubleshooting

### Coupon not applying?

1. Run the diagnostic script to check status
2. Ensure CouponApplication exists and is active
3. Check remainingMonths is > 0
4. Verify coupon type is RECURRING

### Payment charging full price?

1. Check BillingService logs for "Applying coupon" message
2. If missing, no active coupon was found
3. Use apply-test-coupon.ts to set up the coupon
4. Ensure the subscription has autoRenew enabled

### Database Connections

- All scripts properly disconnect from the database
- Use Ctrl+C if a script hangs to force exit

## Test Data

Default test values:
- User: test@readingchamp.com
- Coupon: TEST_3MONTH_50OFF (50% discount for 3 months)
- Plan: 1 Month Plan (₩40,000)
- Expected discounted price: ₩20,000