-- Migration: Change default theme from 'dark' to 'system'
-- Date: 2025-10-31
-- Description: Updates the default value for preferredTheme to 'system' for new users

-- Change the default value for the preferredTheme column
ALTER TABLE "users" 
ALTER COLUMN "preferredTheme" 
SET DEFAULT 'system';

-- Optional: Uncomment the following lines if you want to migrate existing users
-- This will change all users currently set to 'dark' to 'system'
-- 
-- UPDATE "users" 
-- SET "preferredTheme" = 'system' 
-- WHERE "preferredTheme" = 'dark';
