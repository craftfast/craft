/**
 * Razorpay Environment Variables Verification Script
 * 
 * Run this script to verify your Razorpay configuration:
 * pnpm razorpay:verify
 */

import { config } from "dotenv";
import { validateRazorpayConfig, getRazorpayConfigStatus } from "../src/lib/razorpay-config";

// Load environment variables from .env file
config();

console.log("\n🔍 Verifying Razorpay Configuration...\n");

const status = getRazorpayConfigStatus();

console.log("Configuration Status:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`RAZORPAY_KEY_ID:        ${status.keyId}`);
console.log(`RAZORPAY_KEY_SECRET:    ${status.keySecret}`);
console.log(`RAZORPAY_WEBHOOK_SECRET: ${status.webhookSecret}`);
console.log(`Currency:                ${status.currency}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

if (status.configured) {
    console.log("✅ Razorpay is properly configured!\n");
    process.exit(0);
} else {
    console.log("❌ Razorpay configuration incomplete!\n");
    console.log("Missing environment variables:");
    status.errors.forEach((error) => {
        console.log(`  - ${error}`);
    });
    console.log("\nPlease add these to your .env file:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("RAZORPAY_KEY_ID=your_key_id");
    console.log("RAZORPAY_KEY_SECRET=your_key_secret");
    console.log("RAZORPAY_WEBHOOK_SECRET=your_webhook_secret");
    console.log("RAZORPAY_CURRENCY=USD  # or INR");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("Get your keys from: https://dashboard.razorpay.com/app/keys\n");
    process.exit(1);
}
