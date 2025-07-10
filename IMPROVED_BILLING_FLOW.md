# Improved Billing Flow for Korean Users

## Previous Flow (Problematic)
1. User selects plan
2. User registers billing key (enters card info)
3. After successful registration, user is asked to make a manual payment
4. This is confusing - why register a card for auto-payment and then manually pay?

## New Flow (Fixed)
1. User selects plan
2. User registers billing key (enters card info)
3. **Immediately after registration, we automatically charge the first payment using the billing key**
4. User sees success page - subscription is active
5. Future payments are automatic

## Benefits
- **Better UX**: No confusing double-payment step
- **Higher conversion**: Users complete purchase in one flow
- **Consistent**: Aligns with how other subscription services work
- **Secure**: Payment is processed server-side using encrypted billing key

## Implementation Details

### When user registers billing key:
```typescript
// In billing-auth-success.tsx
if (paymentId) {
  // Execute first payment immediately
  const response = await fetch("/api/billing/execute-first-payment", {
    method: "POST",
    body: JSON.stringify({ paymentId }),
  });
  
  // Redirect to success page
  router.push("/profile/success?orderId=" + data.orderId);
}
```

### API endpoint executes payment:
```typescript
// /api/billing/execute-first-payment/route.ts
// 1. Decrypt billing key
// 2. Call Toss billing API
// 3. Create subscription with auto-renewal
// 4. Return success
```

## For International Users
No change - they still use one-time payments as billing keys aren't supported for international cards.

## Testing
1. Sign up as Korean user
2. Select a plan
3. Enter test card: `4330-1234-1234-1234`
4. Complete billing auth
5. Should see payment success immediately
6. Check database - subscription should be active with nextBillingDate set