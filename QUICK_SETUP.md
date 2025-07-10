# Quick Setup for Toss Payments Billing

## 🚨 Immediate Fix for Your Error

You're getting the error because `BILLING_KEY_ENCRYPTION_KEY` is not set in your `.env` file.

### Step 1: Generate Encryption Keys

```bash
npx tsx scripts/generate-billing-keys.ts
```

This will output something like:

```
BILLING_KEY_ENCRYPTION_KEY="a1b2c3d4e5f6..."
BILLING_KEY_SECRET="..."
CRON_SECRET="..."
```

### Step 2: Add to Your .env File

Copy the `BILLING_KEY_ENCRYPTION_KEY` line and add it to your `.env` file:

```env
# Existing Toss keys
NEXT_PUBLIC_TOSS_CLIENT_ID=test_ck_...
TOSS_CLIENT_SECRET=test_sk_...

# Add this new line (use your generated key, not this example!)
BILLING_KEY_ENCRYPTION_KEY="your-generated-key-here"
```

### Step 3: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

### Step 4: Test Again

Now try the billing key registration flow again. It should work!

## 📝 Complete .env Setup

Your `.env` file should have at least these Toss-related variables:

```env
# Toss Payments (required)
NEXT_PUBLIC_TOSS_CLIENT_ID=test_ck_DpexMgkW36xqXaWKDbQJrGbR5ozO  # Your test client key
TOSS_CLIENT_SECRET=test_sk_...                                      # Your test secret key
BILLING_KEY_ENCRYPTION_KEY=...                                   # Generated from script

# Optional but recommended
TOSS_WEBHOOK_SECRET=...      # For webhook verification
ENABLE_AUTO_BILLING=true     # Feature flag
```

## 🧪 Testing the Fix

1. Make sure you're testing with a Korean user (country = "South Korea")
2. Go to Profile → Plans
3. Select a plan and click Subscribe
4. Use test card: `4330-1234-1234-1234`
5. You should be redirected to Toss billing auth page
6. Complete the process and check if billing key is saved

## ⚠️ Common Issues

### "BILLING_KEY_ENCRYPTION_KEY is not set"

- Make sure you added it to `.env`
- Make sure you restarted the dev server
- Check there are no typos in the variable name

### "TOSS_CLIENT_SECRET is not set"

- Add your Toss test secret key to `.env`
- Format: `TOSS_CLIENT_SECRET=test_sk_...`

### Still getting errors?

Check the console output - it will show which environment variable is missing.

Need your test keys? Get them from:
https://developers.tosspayments.com/
