# Migration 7-9: CouponRecurringType Enum Update

## Date: 2025-07-09

### Issue
Failed to run `npx prisma db push` due to enum type mismatch:
- Database had old enum values: `ONE_TIME_ONLY`, `RECURRING_CAPABLE`, `RECURRING_ONLY`
- Prisma schema had new enum values: `ONE_TIME`, `RECURRING`
- 2 existing coupons were using `ONE_TIME_ONLY`

### Error Message
```
Error: ERROR: invalid input value for enum "CouponRecurringType_new": "ONE_TIME_ONLY"
```

### Solution
Manually migrated the enum type in PostgreSQL by creating a new enum, migrating data, and replacing the old enum.

### Migration Steps

1. **Created new enum type**
   ```sql
   CREATE TYPE "CouponRecurringType_new" AS ENUM ('ONE_TIME', 'RECURRING');
   ```

2. **Added temporary column with new enum type**
   ```sql
   ALTER TABLE "DiscountCoupon" ADD COLUMN "recurringType_new" "CouponRecurringType_new";
   ```

3. **Migrated data with value mapping**
   ```sql
   UPDATE "DiscountCoupon" 
   SET "recurringType_new" = 
       CASE 
           WHEN "recurringType" = 'ONE_TIME_ONLY' THEN 'ONE_TIME'::text::"CouponRecurringType_new"
           WHEN "recurringType" = 'RECURRING_CAPABLE' THEN 'RECURRING'::text::"CouponRecurringType_new"
           WHEN "recurringType" = 'RECURRING_ONLY' THEN 'RECURRING'::text::"CouponRecurringType_new"
       END;
   ```
   - Migrated 2 coupons from `ONE_TIME_ONLY` to `ONE_TIME`

4. **Replaced old column with new column**
   ```sql
   ALTER TABLE "DiscountCoupon" DROP COLUMN "recurringType";
   ALTER TABLE "DiscountCoupon" RENAME COLUMN "recurringType_new" TO "recurringType";
   ```

5. **Replaced old enum type with new enum type**
   ```sql
   DROP TYPE "CouponRecurringType";
   ALTER TYPE "CouponRecurringType_new" RENAME TO "CouponRecurringType";
   ```

6. **Applied constraints**
   ```sql
   ALTER TABLE "DiscountCoupon" ALTER COLUMN "recurringType" SET NOT NULL;
   ALTER TABLE "DiscountCoupon" ALTER COLUMN "recurringType" SET DEFAULT 'ONE_TIME'::"CouponRecurringType";
   ```

### Verification
- Confirmed new enum values: `ONE_TIME`, `RECURRING`
- Verified 2 coupons successfully migrated to `ONE_TIME`
- `npx prisma db push` now runs without errors

### Commands Used
All SQL commands were executed via Docker:
```bash
docker exec learn-english-postgres-1 sh -c 'PGPASSWORD="redisPrismaNaver2025@" psql -U postgres -d my-local-db -c "<SQL_COMMAND>"'
```

### Result
✅ Database schema successfully aligned with Prisma schema
✅ No data loss - all coupons preserved with appropriate new enum values