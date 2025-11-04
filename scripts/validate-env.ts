/**
 * Environment Variables Validation Script
 * 
 * Validates that all required environment variables are set
 * Run this on application startup to catch configuration errors early
 * 
 * Usage:
 *   tsx scripts/validate-env.ts
 */

interface EnvValidation {
    name: string;
    required: boolean;
    description: string;
    example?: string;
}

const ENV_VARIABLES: EnvValidation[] = [
    // Database
    {
        name: "DATABASE_URL",
        required: true,
        description: "PostgreSQL database connection URL",
        example: "postgresql://user:pass@host:5432/dbname"
    },
    {
        name: "DIRECT_DATABASE_URL",
        required: true,
        description: "Direct PostgreSQL database connection URL (for migrations)",
        example: "postgresql://user:pass@host:5432/dbname"
    },

    // Polar Payment Provider
    {
        name: "POLAR_ACCESS_TOKEN",
        required: true,
        description: "Polar API access token"
    },
    {
        name: "POLAR_WEBHOOK_SECRET",
        required: true,
        description: "Polar webhook signature verification secret"
    },
    {
        name: "POLAR_ORGANIZATION_ID",
        required: true,
        description: "Polar organization ID"
    },

    // Polar Product IDs (Hobby Plan)
    {
        name: "POLAR_HOBBY_PRODUCT_ID",
        required: true,
        description: "Polar product ID for Hobby plan (free)"
    },

    // Polar Product IDs (Pro Plans - 8 tiers)
    {
        name: "POLAR_PRO_500_PRODUCT_ID",
        required: true,
        description: "Polar product ID for Pro 500 credits/month ($25)"
    },
    {
        name: "POLAR_PRO_1000_PRODUCT_ID",
        required: true,
        description: "Polar product ID for Pro 1,000 credits/month ($45)"
    },
    {
        name: "POLAR_PRO_2500_PRODUCT_ID",
        required: true,
        description: "Polar product ID for Pro 2,500 credits/month ($100)"
    },
    {
        name: "POLAR_PRO_5000_PRODUCT_ID",
        required: true,
        description: "Polar product ID for Pro 5,000 credits/month ($190)"
    },
    {
        name: "POLAR_PRO_10000_PRODUCT_ID",
        required: true,
        description: "Polar product ID for Pro 10,000 credits/month ($350)"
    },
    {
        name: "POLAR_PRO_25000_PRODUCT_ID",
        required: true,
        description: "Polar product ID for Pro 25,000 credits/month ($800)"
    },
    {
        name: "POLAR_PRO_50000_PRODUCT_ID",
        required: true,
        description: "Polar product ID for Pro 50,000 credits/month ($1,500)"
    },
    {
        name: "POLAR_PRO_100000_PRODUCT_ID",
        required: true,
        description: "Polar product ID for Pro 100,000 credits/month ($2,000)"
    },

    // Better Auth
    {
        name: "BETTER_AUTH_SECRET",
        required: true,
        description: "Better Auth secret key for session encryption"
    },
    {
        name: "BETTER_AUTH_URL",
        required: true,
        description: "Better Auth base URL",
        example: "http://localhost:3000"
    },

    // OAuth Providers (optional)
    {
        name: "AUTH_GOOGLE_CLIENT_ID",
        required: false,
        description: "Google OAuth client ID"
    },
    {
        name: "AUTH_GOOGLE_CLIENT_SECRET",
        required: false,
        description: "Google OAuth client secret"
    },
    {
        name: "AUTH_GITHUB_CLIENT_ID",
        required: false,
        description: "GitHub OAuth client ID"
    },
    {
        name: "AUTH_GITHUB_CLIENT_SECRET",
        required: false,
        description: "GitHub OAuth client secret"
    },

    // Email (optional - for production)
    {
        name: "RESEND_API_KEY",
        required: false,
        description: "Resend API key for sending emails"
    },

    // AI Providers
    {
        name: "ANTHROPIC_API_KEY",
        required: true,
        description: "Anthropic API key for Claude models"
    },
    {
        name: "OPENAI_API_KEY",
        required: true,
        description: "OpenAI API key for GPT models"
    },

    // E2B Sandbox
    {
        name: "E2B_API_KEY",
        required: true,
        description: "E2B API key for code execution sandboxes"
    },

    // Cloudflare R2 Storage
    {
        name: "R2_ACCOUNT_ID",
        required: true,
        description: "Cloudflare R2 account ID"
    },
    {
        name: "R2_ACCESS_KEY_ID",
        required: true,
        description: "Cloudflare R2 access key ID"
    },
    {
        name: "R2_SECRET_ACCESS_KEY",
        required: true,
        description: "Cloudflare R2 secret access key"
    },
    {
        name: "R2_BUCKET_NAME",
        required: true,
        description: "Cloudflare R2 bucket name"
    },
    {
        name: "R2_PUBLIC_URL",
        required: true,
        description: "Cloudflare R2 public URL for file access",
        example: "https://pub-xxx.r2.dev"
    },
];

function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log("🔍 Validating environment variables...\n");

    for (const envVar of ENV_VARIABLES) {
        const value = process.env[envVar.name];
        const status = value ? "✓" : (envVar.required ? "✗" : "⚠");

        if (!value) {
            if (envVar.required) {
                errors.push(`${envVar.name}: ${envVar.description}`);
                console.log(`  ${status} ${envVar.name} - MISSING (REQUIRED)`);
                if (envVar.example) {
                    console.log(`    Example: ${envVar.example}`);
                }
            } else {
                warnings.push(`${envVar.name}: ${envVar.description} (optional)`);
                console.log(`  ${status} ${envVar.name} - Not set (optional)`);
            }
        } else {
            console.log(`  ${status} ${envVar.name} - Set`);
        }
    }

    console.log("\n" + "=".repeat(80));

    if (errors.length > 0) {
        console.log("\n❌ VALIDATION FAILED\n");
        console.log("Missing required environment variables:");
        errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
        });
        console.log("\nPlease check your .env file and ensure all required variables are set.");
    } else {
        console.log("\n✅ VALIDATION PASSED");
        console.log("All required environment variables are set!");
    }

    if (warnings.length > 0) {
        console.log("\n⚠️  Optional variables not set:");
        warnings.forEach((warning, index) => {
            console.log(`  ${index + 1}. ${warning}`);
        });
    }

    console.log("\n" + "=".repeat(80) + "\n");

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

// Run validation
const result = validateEnvironment();

// Exit with error code if validation failed
if (!result.valid) {
    process.exit(1);
}
