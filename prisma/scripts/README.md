# Prisma Scripts

This directory contains utility scripts for database maintenance and migrations.

## fix-referrals.ts

This script fixes referral data inconsistencies caused by a bug in the social signup flow.

### What it does:

1. **Fixes circular references**: Removes cases where a user's `referrerId` points to someone they referred
2. **Updates isReferred flags**: Sets `isReferred = true` for users with a valid `referrerId`
3. **Recalculates referrerCount**: Ensures each user's `referrerCount` matches their actual number of referrals

### How to run:

```bash
# Make sure you have the latest Prisma client generated
npm run db:generate

# Run the fix script
npx tsx prisma/scripts/fix-referrals.ts
```

### When to run:

- Run once after deploying the referral bug fix
- Can be run multiple times safely (idempotent)
- Run in a maintenance window if you have many users

### Output:

The script will show:
- Number of circular references fixed
- Number of users with updated `isReferred` flags
- Number of users with corrected `referrerCount`
- Final verification stats