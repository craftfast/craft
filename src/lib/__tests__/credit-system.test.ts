/**
 * Credit System Unit Tests
 * Run with: npx jest src/lib/__tests__/credit-system.test.ts
 */

import {
    tokensToCredits,
    creditsToTokens,
    estimateCreditsForMessage,
    TOKENS_PER_CREDIT,
} from '../ai-usage';

describe('Credit System', () => {
    describe('TOKENS_PER_CREDIT constant', () => {
        it('should be 10,000', () => {
            expect(TOKENS_PER_CREDIT).toBe(10000);
        });
    });

    describe('tokensToCredits', () => {
        it('should convert tokens to credits with 2 decimal places', () => {
            expect(tokensToCredits(0)).toBe(0);
            expect(tokensToCredits(1)).toBe(0); // 0.0001 → 0.00
            expect(tokensToCredits(100)).toBe(0.01); // 100/10000 = 0.01
            expect(tokensToCredits(2500)).toBe(0.25); // 2500/10000 = 0.25
            expect(tokensToCredits(5000)).toBe(0.5); // 5000/10000 = 0.5
            expect(tokensToCredits(7500)).toBe(0.75); // 7500/10000 = 0.75
            expect(tokensToCredits(10000)).toBe(1); // Exact
            expect(tokensToCredits(10001)).toBe(1); // 1.0001 → 1.00
            expect(tokensToCredits(12500)).toBe(1.25); // 1.25
            expect(tokensToCredits(15000)).toBe(1.5); // 1.5
            expect(tokensToCredits(20000)).toBe(2); // Exact
            expect(tokensToCredits(25000)).toBe(2.5); // 2.5
            expect(tokensToCredits(100000)).toBe(10); // Exact
        });
    });

    describe('creditsToTokens', () => {
        it('should convert credits to tokens correctly', () => {
            expect(creditsToTokens(0)).toBe(0);
            expect(creditsToTokens(1)).toBe(10000);
            expect(creditsToTokens(5)).toBe(50000);
            expect(creditsToTokens(10)).toBe(100000);
            expect(creditsToTokens(100)).toBe(1000000);
        });
    });

    describe('estimateCreditsForMessage', () => {
        it('should estimate credits based on message length', () => {
            // Small message
            expect(estimateCreditsForMessage(100)).toBe(0.05); // ~25 + ~500 = ~525 tokens → 0.05 credits

            // Medium message
            expect(estimateCreditsForMessage(500)).toBe(0.16); // ~125 + ~500 = ~625 tokens → 0.16 credits

            // Large message
            expect(estimateCreditsForMessage(2000, 4000)).toBe(0.15); // ~500 + ~1000 = ~1500 tokens → 0.15 credits

            // Very large message
            expect(estimateCreditsForMessage(10000, 10000)).toBe(0.5); // ~2500 + ~2500 = ~5000 tokens → 0.5 credits
        });
    });

    describe('Real-world scenarios', () => {
        it('should calculate credits for small chat', () => {
            const inputTokens = 200;
            const outputTokens = 300;
            const total = inputTokens + outputTokens;
            expect(tokensToCredits(total)).toBe(0.05); // 500 tokens → 0.05 credits
        });

        it('should calculate credits for component creation', () => {
            const inputTokens = 800;
            const outputTokens = 4200;
            const total = inputTokens + outputTokens;
            expect(tokensToCredits(total)).toBe(0.5); // 5000 tokens → 0.5 credits
        });

        it('should calculate credits for large refactor', () => {
            const inputTokens = 5000;
            const outputTokens = 15000;
            const total = inputTokens + outputTokens;
            expect(tokensToCredits(total)).toBe(2); // 20000 tokens → 2 credits
        });

        it('should calculate credits for very large request', () => {
            const inputTokens = 5000;
            const outputTokens = 35000;
            const total = inputTokens + outputTokens;
            expect(tokensToCredits(total)).toBe(4); // 40000 tokens → 4 credits
        });
    });

    describe('Plan allocations', () => {
        it('should match plan token allocations', () => {
            // Hobby: 1 credit/day
            expect(creditsToTokens(1)).toBe(10000);

            // Pro 10: 10 credits/day
            expect(creditsToTokens(10)).toBe(100000);

            // Pro 50: 50 credits/day
            expect(creditsToTokens(50)).toBe(500000);

            // Pro 200: 200 credits/day
            expect(creditsToTokens(200)).toBe(2000000);

            // Pro 1000: 1000 credits/day
            expect(creditsToTokens(1000)).toBe(10000000);
        });
    });

    describe('Edge cases', () => {
        it('should handle zero tokens', () => {
            expect(tokensToCredits(0)).toBe(0);
        });

        it('should handle exactly 10,000 tokens', () => {
            expect(tokensToCredits(10000)).toBe(1);
        });

        it('should round to 2 decimal places', () => {
            expect(tokensToCredits(9999)).toBe(1); // 0.9999 → 1.00
            expect(tokensToCredits(10001)).toBe(1); // 1.0001 → 1.00
            expect(tokensToCredits(12345)).toBe(1.23); // 1.2345 → 1.23
            expect(tokensToCredits(12349)).toBe(1.23); // 1.2349 → 1.23
            expect(tokensToCredits(12350)).toBe(1.24); // 1.2350 → 1.24 (round up)
        });

        it('should handle very large token counts', () => {
            expect(tokensToCredits(1000000)).toBe(100); // 1M tokens = 100 credits
            expect(tokensToCredits(10000000)).toBe(1000); // 10M tokens = 1000 credits
        });
    });
});
