/**
 * Verify E2B Template Configuration
 * 
 * This script checks if the E2B template has the correct package.json configuration
 * with the -H 0.0.0.0 flag for port binding.
 */

import { nextjsTemplate } from "../src/lib/e2b/template";

console.log("🔍 Verifying E2B Template Configuration...\n");

// Extract the template definition as a string to check the package.json content
const templateString = nextjsTemplate.toString();

console.log("📦 Checking package.json dev script...\n");

// Check if the template includes the correct dev command
const hasCorrectDevCommand = templateString.includes('"dev": "next dev --turbopack -H 0.0.0.0 -p 3000"');
const hasOldDevCommand = templateString.includes('"dev": "next dev --turbopack"') && !hasCorrectDevCommand;

if (hasCorrectDevCommand) {
    console.log("✅ CORRECT: Template has -H 0.0.0.0 flag in dev script");
    console.log('   "dev": "next dev --turbopack -H 0.0.0.0 -p 3000"\n');
} else if (hasOldDevCommand) {
    console.log("❌ ERROR: Template is missing -H 0.0.0.0 flag!");
    console.log('   Current: "dev": "next dev --turbopack"');
    console.log('   Expected: "dev": "next dev --turbopack -H 0.0.0.0 -p 3000"\n');
    console.log("⚠️  Please rebuild the template with: pnpm run e2b:build:dev\n");
    process.exit(1);
} else {
    console.log("⚠️  WARNING: Could not verify dev script configuration");
    console.log("   Manual verification recommended\n");
}

console.log("✨ Verification complete!");
console.log("\n📝 Next steps:");
console.log("   1. Rebuild template: pnpm run e2b:build:dev");
console.log("   2. Delete existing sandboxes to use the new template");
console.log("   3. Create new sandboxes - they will use the fixed template\n");
