-- Remove referral system
-- Drop referral_credits table
DROP TABLE IF EXISTS "referral_credits";

-- Drop the unique index on referralCode (if it exists)
DROP INDEX IF EXISTS "users_referralCode_key";

-- Remove referral-related fields from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "referralCode";
ALTER TABLE "users" DROP COLUMN IF EXISTS "referredById";
