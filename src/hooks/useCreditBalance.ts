/**
 * @deprecated Use useCreditBalance from @/contexts/CreditBalanceContext instead
 * 
 * This file is kept for backwards compatibility but re-exports from the new Context API.
 * The new implementation prevents duplicate API calls by using a shared context provider.
 * 
 * Migration:
 * 1. Wrap your app with <CreditBalanceProvider> in layout.tsx
 * 2. Continue using useCreditBalance() - it now uses the context automatically
 */

export { useCreditBalance } from "@/contexts/CreditBalanceContext";
