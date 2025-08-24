# TODO: Payment System Maintenance Mode - Removal Instructions

## Overview
This document tracks all changes made to implement payment system maintenance mode.
Follow these instructions to completely remove the maintenance mode and restore normal payment functionality.

## Test Account Information
- **Allowed Account**: test@readingchamp.com
- **Test Account 2**: test2@readingchamp.com  
- **Password**: test2025@@@
- **Setup Script**: `scripts/setup-test-accounts-maintenance.ts`

## Files to Delete
Remove these files completely:
1. `/lib/utils/payment-access.ts` - Payment access control utility
2. `/components/payment-maintenance-notice.tsx` - Maintenance notice component
3. `/scripts/setup-test-accounts-maintenance.ts` - Test account setup script
4. `/app/(after-auth)/(user)/profile/billing/continue-payment/page-client.tsx` - Client component wrapper
5. This file: `TODO-PAYMENT-MAINTENANCE.md`

## Files to Modify

### 1. Profile Pages

#### `/app/(after-auth)/(user)/profile/page.tsx`
**Remove lines 5-7, 23-27:**
```typescript
// Remove these imports
import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

// Remove this check (lines 23-27)
const hasAccess = await hasPaymentAccess();
if (!hasAccess) {
  return <PaymentMaintenanceNotice />;
}
```

#### `/app/(after-auth)/(user)/profile/billing/page.tsx`
**Remove lines 4-5, 19-23:**
```typescript
// Remove these imports
import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

// Remove this check (lines 19-23)
const hasAccess = await hasPaymentAccess();
if (!hasAccess) {
  return <PaymentMaintenanceNotice />;
}
```

#### `/app/(after-auth)/(user)/profile/billing/register/page.tsx`
**Remove lines 5-6, 17-21:**
```typescript
// Remove these imports
import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

// Remove this check (lines 17-21)
const hasAccess = await hasPaymentAccess();
if (!hasAccess) {
  return <PaymentMaintenanceNotice />;
}
```

#### `/app/(after-auth)/(user)/profile/billing/success/page.tsx`
**Remove lines 4-5, 19-23:**
```typescript
// Remove these imports
import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

// Remove this check (lines 19-23)
const hasAccess = await hasPaymentAccess();
if (!hasAccess) {
  return <PaymentMaintenanceNotice />;
}
```

#### `/app/(after-auth)/(user)/profile/billing/fail/page.tsx`
**Remove lines 4-6, 12-16:**
```typescript
// Remove these imports
import { auth } from "@/auth";
import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

// Remove this check (lines 12-16)
const hasAccess = await hasPaymentAccess();
if (!hasAccess) {
  return <PaymentMaintenanceNotice />;
}

// Also change function from async to regular
export default function BillingAuthFailPage() {
```

#### `/app/(after-auth)/(user)/profile/billing/continue-payment/page.tsx`
**Restore original client component:**
1. Delete the current `page.tsx` file
2. Rename `page-client.tsx` back to `page.tsx`

#### `/app/(after-auth)/(user)/profile/success/page.tsx`
**Remove lines 4-6, 19-23:**
```typescript
// Remove these imports
import { auth } from "@/auth";
import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

// Remove this check (lines 19-23)
const hasAccess = await hasPaymentAccess();
if (!hasAccess) {
  return <PaymentMaintenanceNotice />;
}
```

#### `/app/(after-auth)/(user)/profile/fail/page.tsx`
**Remove lines 4-6, 18-22:**
```typescript
// Remove these imports
import { auth } from "@/auth";
import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

// Remove this check (lines 18-22)
const hasAccess = await hasPaymentAccess();
if (!hasAccess) {
  return <PaymentMaintenanceNotice />;
}
```

#### `/app/(after-auth)/(user)/profile/free-success/page.tsx`
**Remove lines 5-6, 23-27:**
```typescript
// Remove these imports
import PaymentMaintenanceNotice from "@/components/payment-maintenance-notice";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

// Remove this check (lines 23-27)
const hasAccess = await hasPaymentAccess();
if (!hasAccess) {
  return <PaymentMaintenanceNotice />;
}
```

### 2. API Routes

#### `/app/api/payments/confirm/route.ts`
**Remove lines 3-4, 11-18:**
```typescript
// Remove these imports
import { auth } from "@/auth";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

// Remove this check (lines 11-18)
const hasAccess = await hasPaymentAccess();
if (!hasAccess) {
  return NextResponse.json(
    { success: false, error: "Payment system is under maintenance" },
    { status: 503 },
  );
}
```

#### `/app/api/payments/free-confirm/route.ts`
**Remove lines 3-4, 9-16:**
```typescript
// Remove these imports
import { auth } from "@/auth";
import { hasPaymentAccess } from "@/lib/utils/payment-access";

// Remove this check (lines 9-16)
const hasAccess = await hasPaymentAccess();
if (!hasAccess) {
  return NextResponse.json(
    { success: false, error: "Payment system is under maintenance" },
    { status: 503 },
  );
}
```

#### `/app/api/billing/execute-first-payment/route.ts`
**Remove lines 41-48:**
```typescript
// Remove this check
const { hasPaymentAccessByEmail } = await import("@/lib/utils/payment-access");
if (!hasPaymentAccessByEmail(session.user.email!)) {
  return NextResponse.json(
    { error: "Payment system is under maintenance" },
    { status: 503 },
  );
}
```

#### `/app/api/billing/auth/prepare/route.ts`
**Remove lines 17-24:**
```typescript
// Remove this check
const { hasPaymentAccessByEmail } = await import("@/lib/utils/payment-access");
if (!hasPaymentAccessByEmail(session.user.email!)) {
  return NextResponse.json(
    { error: "Payment system is under maintenance" },
    { status: 503 }
  );
}
```

#### `/app/api/billing/auth/issue/route.ts`
**Remove lines 50-57:**
```typescript
// Remove this check
const { hasPaymentAccessByEmail } = await import("@/lib/utils/payment-access");
if (!hasPaymentAccessByEmail(session.user.email!)) {
  return NextResponse.json(
    { error: "Payment system is under maintenance" },
    { status: 503 }
  );
}
```

#### `/app/api/billing/cancel-subscription/route.ts`
**Remove lines 16-23:**
```typescript
// Remove this check
const { hasPaymentAccessByEmail } = await import("@/lib/utils/payment-access");
if (!hasPaymentAccessByEmail(session.user.email!)) {
  return NextResponse.json(
    { error: "Payment system is under maintenance" },
    { status: 503 }
  );
}
```

#### `/app/api/billing/auto-renew/route.ts`
**Remove lines 16-23:**
```typescript
// Remove this check
const { hasPaymentAccessByEmail } = await import("@/lib/utils/payment-access");
if (!hasPaymentAccessByEmail(session.user.email!)) {
  return NextResponse.json(
    { error: "Payment system is under maintenance" },
    { status: 503 }
  );
}
```

#### `/app/api/billing/remove/route.ts`
**Remove lines 17-24:**
```typescript
// Remove this check
const { hasPaymentAccessByEmail } = await import("@/lib/utils/payment-access");
if (!hasPaymentAccessByEmail(session.user.email!)) {
  return NextResponse.json(
    { error: "Payment system is under maintenance" },
    { status: 503 }
  );
}
```

## Verification Checklist
After removing maintenance mode:

- [ ] Delete all new files listed above
- [ ] Remove all maintenance checks from pages
- [ ] Remove all maintenance checks from API routes  
- [ ] Test payment flow with regular user account
- [ ] Verify billing key registration works
- [ ] Verify subscription purchase works
- [ ] Verify auto-renewal settings work
- [ ] Delete this TODO-PAYMENT-MAINTENANCE.md file

## Quick Removal Script
You can use this bash script to help with removal:

```bash
#!/bin/bash
# Remove maintenance mode files
rm -f lib/utils/payment-access.ts
rm -f components/payment-maintenance-notice.tsx
rm -f scripts/setup-test-accounts-maintenance.ts
rm -f app/\(after-auth\)/\(user\)/profile/billing/continue-payment/page-client.tsx
rm -f TODO-PAYMENT-MAINTENANCE.md

echo "Files deleted. Now manually update the modified files as listed above."
```

## Notes
- All changes are server-side for security
- No client-side bypassing is possible
- Test thoroughly after removal
- Consider keeping test accounts for future testing