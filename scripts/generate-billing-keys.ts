#!/usr/bin/env tsx
/**
 * Script to generate secure encryption keys for billing system
 * Run with: npx tsx scripts/generate-billing-keys.ts
 */

import crypto from 'crypto';

function generateEncryptionKey(): string {
  // Generate a 32-byte (256-bit) random key for AES-256
  return crypto.randomBytes(32).toString('hex');
}

function generateSecretKey(): string {
  // Generate a random secret key
  return crypto.randomBytes(32).toString('base64');
}

console.log('=== Billing System Encryption Keys ===\n');

console.log('Add these to your .env file:\n');

// Generate billing key encryption key
const billingKeyEncryptionKey = generateEncryptionKey();
console.log(`BILLING_KEY_ENCRYPTION_KEY="${billingKeyEncryptionKey}"`);
console.log('# This is a 256-bit key in hex format for AES-256-GCM encryption\n');

// Generate billing key secret (alternative if needed)
const billingKeySecret = generateSecretKey();
console.log(`BILLING_KEY_SECRET="${billingKeySecret}"`);
console.log('# This is a base64-encoded secret key (optional)\n');

// Generate cron secret
const cronSecret = crypto.randomBytes(24).toString('base64');
console.log(`CRON_SECRET="${cronSecret}"`);
console.log('# This is used to secure cron job endpoints\n');

console.log('=== IMPORTANT SECURITY NOTES ===');
console.log('1. Keep these keys secure and never commit them to version control');
console.log('2. Use different keys for each environment (dev, staging, prod)');
console.log('3. Back up these keys securely - losing them means losing access to encrypted data');
console.log('4. Rotate keys periodically for better security');
console.log('\n=== Key Rotation Instructions ===');
console.log('If you need to rotate keys:');
console.log('1. Generate new keys using this script');
console.log('2. Decrypt all billing keys with the old key');
console.log('3. Re-encrypt with the new key');
console.log('4. Update the environment variable');
console.log('5. Test thoroughly before removing the old key');