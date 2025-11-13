/**
 * Debug script to test Polar webhook signature verification
 * Run with: npx tsx scripts/debug-webhook-signature.ts
 */

import crypto from 'crypto';
import { config } from 'dotenv';

// Load environment variables
config();

// Test data from the logs
const secret = process.env.POLAR_WEBHOOK_SECRET || '';
const webhookId = '210349c1-103d-452e-b586-39398401723e';
const webhookTimestamp = '1763012390';
const signature = 'v1,Lnd9y+yXd+NTkekkaMv8IbKbdMimsZDbiWC9zKY8LSI=';
const body = '{"type":"checkout.created","timestamp":"2025-11-13T05:31:08.621845Z","data":{"id":"096fa14b-5ce8-4466-91d8-3dfc611d56d6","created_at":"2025-11-13T05:31:08.609805Z","modified_at":null,"custom_field_dat';

console.log('🔍 Debug Webhook Signature\n');

if (!secret) {
    console.error('❌ POLAR_WEBHOOK_SECRET not found in environment');
    process.exit(1);
}

console.log('Secret info:');
console.log('  Full length:', secret.length);
console.log('  Has prefix:', secret.startsWith('polar_whs_'));
console.log('  First 20 chars:', secret.substring(0, 20));

// Remove prefix
const secretWithoutPrefix = secret.startsWith('polar_whs_')
    ? secret.slice(10)
    : secret;

console.log('\nSecret without prefix:');
console.log('  Length:', secretWithoutPrefix.length);
console.log('  First 20 chars:', secretWithoutPrefix.substring(0, 20));

// Decode base64 secret
const secretBytes = Buffer.from(secretWithoutPrefix, 'base64');
console.log('\nSecret bytes:');
console.log('  Length:', secretBytes.length);
console.log('  Hex (first 20):', secretBytes.toString('hex').substring(0, 40));

// Construct signed content (Standard Webhooks format)
const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
console.log('\nSigned content:');
console.log('  Length:', signedContent.length);
console.log('  First 100 chars:', signedContent.substring(0, 100));

// Compute HMAC
const hmac = crypto.createHmac('sha256', secretBytes);
hmac.update(signedContent, 'utf-8');
const computedSignature = hmac.digest('base64');

// Extract signature from header (remove v1, prefix)
const receivedSignature = signature.split(',')[1];

console.log('\nSignature comparison:');
console.log('  Received: ', receivedSignature);
console.log('  Computed: ', computedSignature);
console.log('  Match:    ', receivedSignature === computedSignature);

if (receivedSignature === computedSignature) {
    console.log('\n✅ Signature verification successful!');
} else {
    console.log('\n❌ Signature verification failed!');
}
