/**
 * Razorpay Payment Event Handlers
 * 
 * Handles payment-related events from Razorpay webhooks.
 */

import { prisma } from "@/lib/db";
import { PaymentCapturedEvent, PaymentFailedEvent, OrderPaidEvent } from "../webhook-types";
import { getUserByRazorpayInfo } from "../webhooks";
import { fromSmallestUnit } from "../index";

/**
 * Handle payment.captured event
 * This is triggered when a payment is successfully captured
 */
export async function handlePaymentCaptured(event: PaymentCapturedEvent) {
    const payment = event.payload.payment.entity;

    console.log(`Processing payment.captured: ${payment.id}`);

    try {
        // Get user from payment notes (preferred) or email
        const userId = payment.notes?.user_id;

        // Try to get user by ID first, then fall back to email
        let user;
        if (userId) {
            user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, razorpayCustomerId: true },
            });
        }

        // Fall back to email lookup if user not found by ID
        if (!user) {
            user = await getUserByRazorpayInfo(undefined, payment.email);
        }

        if (!user) {
            console.error(`User not found for payment ${payment.id} (userId: ${userId}, email: ${payment.email})`);
            return { success: false, error: "User not found" };
        }

        console.log(`Found user ${user.id} for payment ${payment.id}`);

        // Get purchase type from payment notes
        const purchaseType = payment.notes?.purchase_type || "balance_topup";

        // Handle balance top-up
        if (purchaseType === "balance_topup") {
            const requestedBalance = parseFloat(payment.notes?.requested_balance || "0");
            const amount = fromSmallestUnit(payment.amount);

            if (requestedBalance > 0) {
                // Get current balance
                const currentUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { accountBalance: true },
                });

                const balanceBefore = parseFloat(currentUser?.accountBalance.toString() || "0");
                const balanceAfter = balanceBefore + requestedBalance;

                // Update user balance
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        accountBalance: balanceAfter,
                    },
                });

                // Create balance transaction record
                await prisma.balanceTransaction.create({
                    data: {
                        userId: user.id,
                        type: "TOPUP",
                        amount: requestedBalance,
                        balanceBefore,
                        balanceAfter,
                        description: `Balance top-up via Razorpay - ${payment.method}`,
                        metadata: {
                            paymentId: payment.id,
                            orderId: payment.order_id,
                            totalCharged: amount,
                            platformFee: payment.notes?.platform_fee,
                        },
                    },
                });

                console.log(`Added $${requestedBalance} balance to user ${user.id} (payment ${payment.id})`);
            }
        }

        // Create payment transaction record
        await prisma.paymentTransaction.create({
            data: {
                userId: user.id,
                amount: fromSmallestUnit(payment.amount),
                currency: payment.currency.toUpperCase(),
                status: "completed",
                paymentMethod: "razorpay",
                razorpayOrderId: payment.order_id,
                razorpayPaymentId: payment.id,
                metadata: {
                    method: payment.method,
                    purchaseType,
                    notes: payment.notes,
                },
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error handling payment.captured:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Handle payment.failed event
 */
export async function handlePaymentFailed(event: PaymentFailedEvent) {
    const payment = event.payload.payment.entity;

    console.log(`Processing payment.failed: ${payment.id}`);

    try {
        // Get user from payment notes (preferred) or email
        const userId = payment.notes?.user_id;

        // Try to get user by ID first, then fall back to email
        let user;
        if (userId) {
            user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, razorpayCustomerId: true },
            });
        }

        // Fall back to email lookup if user not found by ID
        if (!user) {
            user = await getUserByRazorpayInfo(undefined, payment.email);
        }

        if (!user) {
            console.error(`User not found for failed payment ${payment.id} (userId: ${userId}, email: ${payment.email})`);
            return { success: false, error: "User not found" };
        }

        console.log(`Found user ${user.id} for failed payment ${payment.id}`);

        // Log failed payment transaction
        await prisma.paymentTransaction.create({
            data: {
                userId: user.id,
                amount: fromSmallestUnit(payment.amount),
                currency: payment.currency.toUpperCase(),
                status: "failed",
                paymentMethod: "razorpay",
                razorpayOrderId: payment.order_id,
                razorpayPaymentId: payment.id,
                failureReason: payment.error_description || "Payment failed",
                metadata: {
                    errorCode: payment.error_code,
                    errorSource: payment.error_source,
                    errorStep: payment.error_step,
                    errorReason: payment.error_reason,
                },
            },
        });

        console.log(`Logged failed payment ${payment.id} for user ${user.id}`);

        return { success: true };
    } catch (error) {
        console.error("Error handling payment.failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Handle order.paid event
 */
export async function handleOrderPaid(event: OrderPaidEvent) {
    const order = event.payload.order.entity;
    const payment = event.payload.payment.entity;

    console.log(`Processing order.paid: ${order.id}`);

    // This event is triggered after payment.captured
    // Most logic is handled in payment.captured
    // This is mainly for logging/confirmation

    try {
        console.log(`Order ${order.id} marked as paid with payment ${payment.id}`);
        return { success: true };
    } catch (error) {
        console.error("Error handling order.paid:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
