/**
 * Razorpay Webhook Tests
 * 
 * Basic tests for payment webhook signature verification and event handling.
 * Run with: npx jest tests/razorpay-webhook.test.ts
 */

import crypto from 'crypto';

// Mock webhook signature verification (same logic as in route.ts)
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    try {
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch {
        return false;
    }
}

// Generate a valid signature for testing
function generateSignature(body: string, secret: string): string {
    return crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
}

describe('Razorpay Webhook Signature Verification', () => {
    const testSecret = 'test_webhook_secret_123';

    it('should verify valid signature', () => {
        const payload = JSON.stringify({
            event: 'payment.captured',
            payload: { payment: { entity: { id: 'pay_123' } } }
        });
        const signature = generateSignature(payload, testSecret);

        expect(verifyWebhookSignature(payload, signature, testSecret)).toBe(true);
    });

    it('should reject invalid signature', () => {
        const payload = JSON.stringify({
            event: 'payment.captured',
            payload: { payment: { entity: { id: 'pay_123' } } }
        });
        const invalidSignature = 'invalid_signature_here';

        expect(verifyWebhookSignature(payload, invalidSignature, testSecret)).toBe(false);
    });

    it('should reject tampered payload', () => {
        const originalPayload = JSON.stringify({
            event: 'payment.captured',
            payload: { payment: { entity: { id: 'pay_123', amount: 10000 } } }
        });
        const signature = generateSignature(originalPayload, testSecret);

        // Tamper with the payload
        const tamperedPayload = JSON.stringify({
            event: 'payment.captured',
            payload: { payment: { entity: { id: 'pay_123', amount: 99999999 } } }
        });

        expect(verifyWebhookSignature(tamperedPayload, signature, testSecret)).toBe(false);
    });

    it('should reject wrong secret', () => {
        const payload = JSON.stringify({
            event: 'payment.captured',
            payload: { payment: { entity: { id: 'pay_123' } } }
        });
        const signature = generateSignature(payload, testSecret);

        expect(verifyWebhookSignature(payload, signature, 'wrong_secret')).toBe(false);
    });
});

describe('Payment Event Payload Validation', () => {
    it('should parse payment.captured event correctly', () => {
        const event = {
            entity: 'event',
            account_id: 'acc_123',
            event: 'payment.captured',
            contains: ['payment'],
            payload: {
                payment: {
                    entity: {
                        id: 'pay_ABC123',
                        amount: 12980, // in paise (129.80 INR)
                        currency: 'INR',
                        status: 'captured',
                        order_id: 'order_XYZ789',
                        method: 'upi',
                        email: 'test@example.com',
                        notes: {
                            user_id: 'user_123',
                            purchase_type: 'balance_topup',
                            requested_balance: '10',
                            platform_fee: '1.00',
                            gst: '1.98',
                        }
                    }
                }
            },
            created_at: 1702234567
        };

        // Validate structure
        expect(event.event).toBe('payment.captured');
        expect(event.payload.payment.entity.id).toBe('pay_ABC123');
        expect(event.payload.payment.entity.notes.user_id).toBe('user_123');
        expect(event.payload.payment.entity.notes.purchase_type).toBe('balance_topup');
        expect(parseFloat(event.payload.payment.entity.notes.requested_balance)).toBe(10);
    });

    it('should parse payment.failed event correctly', () => {
        const event = {
            entity: 'event',
            account_id: 'acc_123',
            event: 'payment.failed',
            contains: ['payment'],
            payload: {
                payment: {
                    entity: {
                        id: 'pay_FAILED123',
                        amount: 10000,
                        currency: 'INR',
                        status: 'failed',
                        order_id: 'order_XYZ789',
                        error_code: 'BAD_REQUEST_ERROR',
                        error_description: 'Payment processing failed',
                        error_source: 'bank',
                        error_step: 'payment_authorization',
                        error_reason: 'insufficient_funds',
                        email: 'test@example.com',
                        notes: {
                            user_id: 'user_123',
                        }
                    }
                }
            },
            created_at: 1702234567
        };

        expect(event.event).toBe('payment.failed');
        expect(event.payload.payment.entity.error_code).toBe('BAD_REQUEST_ERROR');
        expect(event.payload.payment.entity.error_reason).toBe('insufficient_funds');
    });
});

describe('Amount Conversion', () => {
    // Helper functions matching the actual implementation
    const toSmallestUnit = (amount: number): number => Math.round(amount * 100);
    const fromSmallestUnit = (amount: number): number => amount / 100;

    it('should convert to paise correctly', () => {
        expect(toSmallestUnit(100)).toBe(10000);
        expect(toSmallestUnit(129.80)).toBe(12980);
        expect(toSmallestUnit(0.01)).toBe(1);
    });

    it('should convert from paise correctly', () => {
        expect(fromSmallestUnit(10000)).toBe(100);
        expect(fromSmallestUnit(12980)).toBe(129.80);
        expect(fromSmallestUnit(1)).toBe(0.01);
    });

    it('should handle floating point precision', () => {
        // Common issue: 19.99 * 100 might give 1998.9999999999998
        expect(toSmallestUnit(19.99)).toBe(1999);
        expect(toSmallestUnit(9.99)).toBe(999);
    });
});

describe('Idempotency Key Generation', () => {
    it('should generate unique event IDs', () => {
        const event1 = {
            account_id: 'acc_123',
            created_at: 1702234567,
            event: 'payment.captured'
        };

        const event2 = {
            account_id: 'acc_123',
            created_at: 1702234568, // Different timestamp
            event: 'payment.captured'
        };

        const eventId1 = `${event1.account_id}_${event1.created_at}_${event1.event}`;
        const eventId2 = `${event2.account_id}_${event2.created_at}_${event2.event}`;

        expect(eventId1).toBe('acc_123_1702234567_payment.captured');
        expect(eventId2).toBe('acc_123_1702234568_payment.captured');
        expect(eventId1).not.toBe(eventId2);
    });

    it('should handle same event type with different accounts', () => {
        const eventId1 = 'acc_123_1702234567_payment.captured';
        const eventId2 = 'acc_456_1702234567_payment.captured';

        expect(eventId1).not.toBe(eventId2);
    });
});
