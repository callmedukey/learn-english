# CouponApplication Fix Summary

## The Problem
CouponApplications were not being created during the normal payment flow because the payment confirmation endpoint (`/api/payments/confirm/route.ts`) only considered Korean users as having recurring subscriptions.

## Root Cause
The original logic:
```typescript
const isKoreanUser = payment.user.country?.name === "South Korea";
const isRecurringSetup = isKoreanUser; // Only Korean users get recurring
```

This meant:
- Non-Korean users with billing keys were not recognized as having recurring subscriptions
- CouponApplications were only created when `isRecurringSetup` was true
- Therefore, non-Korean users never got CouponApplications, even with valid billing keys

## The Fix
Updated the logic to check for billing keys:
```typescript
const isKoreanUser = payment.user.country?.name === "South Korea";
const hasBillingKey = tossResult.card?.billingKey || tossResult.billingKey;
const isRecurringSetup = isKoreanUser || hasBillingKey;
```

Now:
- Korean users always get recurring (as before)
- Any user with a billing key gets recurring (new)
- CouponApplications are created for all recurring subscriptions with RECURRING coupons

## Testing the Fix
1. **For new payments**: The fix will automatically apply to any new payments going forward
2. **For existing subscriptions**: Run the retroactive fix script:
   ```bash
   npx tsx scripts/fix-missing-coupon-application.ts test@readingchamp.com
   ```

## Verification
Run the test script to verify the fix:
```bash
npx tsx scripts/test-coupon-application-fix.ts
```

This will show:
- User's country and billing key status
- Whether CouponApplication should be created
- Current state of CouponApplications

## Files Changed
- `/app/api/payments/confirm/route.ts` - Updated recurring subscription detection logic