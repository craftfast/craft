/**
 * Razorpay Payment Event Handlers
 * 
 * Handles payment-related events from Razorpay webhooks.
 */

import { prisma } from "@/lib/db";
import { PaymentCapturedEvent, PaymentFailedEvent, OrderPaidEvent } from "../webhook-types";
import { getUserByRazorpayInfo } from "../webhooks";
import { fromSmallestUnit } from "../index";
import { sendPaymentReceipt } from "../receipts";
import { GST_PERCENT } from "@/lib/pricing-constants";

interface UserWithBilling {
    id: string;
    email: string;
    name?: string | null;
    razorpayCustomerId: string | null;
    billingCountry?: string | null;
    billingName?: string | null;
    billingAddress?: any;
    taxId?: string | null;
}

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
        let user: UserWithBilling | null = null;

        if (userId) {
            user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    razorpayCustomerId: true,
                    billingCountry: true,
                    billingName: true,
                    billingAddress: true,
                    taxId: true,
                },
            });
        }

        // Fall back to email lookup if user not found by ID
        if (!user) {
            const basicUser = await getUserByRazorpayInfo(undefined, payment.email);
            if (basicUser) {
                // Fetch additional fields needed for invoice
                user = await prisma.user.findUnique({
                    where: { id: basicUser.id },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        razorpayCustomerId: true,
                        billingCountry: true,
                        billingName: true,
                        billingAddress: true,
                        taxId: true,
                    },
                });
            }
        }

        if (!user) {
            console.error(`User not found for payment ${payment.id} (userId: ${userId || 'N/A'})`);
            return { success: false, error: "User not found" };
        }

        console.log(`Found user ${user.id} for payment ${payment.id}`);

        // Get purchase type from payment notes
        const purchaseType = payment.notes?.purchase_type || "balance_topup";

        // Handle balance top-up
        if (purchaseType === "balance_topup") {
            const requestedBalance = parseFloat(payment.notes?.requested_balance || "0");
            const platformFee = parseFloat(payment.notes?.platform_fee || "0");
            const gst = parseFloat(payment.notes?.gst || "0");
            const billingCountry = payment.notes?.billing_country || user.billingCountry;
            const amount = fromSmallestUnit(payment.amount);

            if (requestedBalance > 0) {
                // Use transaction to ensure atomic balance update.
                // This prevents race conditions where multiple concurrent payment captures
                // could lead to inconsistent balance state. If any operation fails, all are rolled back.
                const result = await prisma.$transaction(async (tx) => {
                    // Get current balance within transaction
                    const currentUser = await tx.user.findUnique({
                        where: { id: user.id },
                        select: { accountBalance: true },
                    });

                    const balanceBefore = parseFloat(currentUser?.accountBalance.toString() || "0");
                    const balanceAfter = balanceBefore + requestedBalance;

                    // Update user balance
                    await tx.user.update({
                        where: { id: user.id },
                        data: {
                            accountBalance: balanceAfter,
                        },
                    });

                    // Create balance transaction record
                    await tx.balanceTransaction.create({
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
                                gst: payment.notes?.gst,
                            },
                        },
                    });

                    return { balanceBefore, balanceAfter };
                });

                console.log(`Added $${requestedBalance} balance to user ${user.id} (payment ${payment.id}) [${result.balanceBefore} -> ${result.balanceAfter}]`);

                // Get exchange rate from notes (if payment was in INR)
                const receiptExchangeRate = payment.notes?.exchange_rate
                    ? parseFloat(payment.notes.exchange_rate)
                    : null;

                // Send payment receipt email (async, don't block payment processing)
                sendPaymentReceipt({
                    userId: user.id,
                    userEmail: user.email,
                    userName: user.name || undefined,
                    paymentId: payment.id,
                    orderId: payment.order_id,
                    credits: requestedBalance,
                    platformFee,
                    gst,
                    totalAmount: amount,
                    currency: payment.currency.toUpperCase(),
                    exchangeRate: receiptExchangeRate,
                }).then(result => {
                    if (result.success) {
                        console.log(`Receipt/invoice email processed for payment ${payment.id}${result.invoiceNumber ? ` (Invoice: ${result.invoiceNumber})` : ''}`);
                    } else {
                        console.error(`Failed to send receipt for payment ${payment.id}:`, result.error);
                    }
                }).catch(err => {
                    console.error(`Error sending receipt for payment ${payment.id}:`, err);
                });
            }
        }

        // Calculate tax info based on billing country
        const billingCountry = payment.notes?.billing_country || user.billingCountry;
        const isIndianCustomer = billingCountry?.toUpperCase() === 'IN';
        const gstAmount = parseFloat(payment.notes?.gst || "0");
        const exchangeRate = payment.notes?.exchange_rate ? parseFloat(payment.notes.exchange_rate) : null;

        // Create payment transaction record with full billing and tax data
        await prisma.paymentTransaction.create({
            data: {
                userId: user.id,
                amount: fromSmallestUnit(payment.amount),
                currency: payment.currency.toUpperCase(),
                status: "completed",
                paymentMethod: "razorpay",
                razorpayOrderId: payment.order_id,
                razorpayPaymentId: payment.id,
                // Tax compliance fields
                taxAmount: isIndianCustomer ? gstAmount : null,
                taxRate: isIndianCustomer ? GST_PERCENT : null,
                taxCountryCode: billingCountry || null,
                metadata: {
                    method: payment.method,
                    purchaseType,
                    notes: payment.notes,
                    // Billing info for invoice generation
                    billingName: user.billingName || user.name || user.email,
                    billingCountry: billingCountry,
                    billingAddress: user.billingAddress,
                    taxId: user.taxId,
                    // Currency conversion info (if paid in INR)
                    exchangeRate: exchangeRate,
                    originalUsdAmount: payment.notes?.original_usd_amount,
                    // Fee breakdown
                    requestedBalance: payment.notes?.requested_balance,
                    platformFee: payment.notes?.platform_fee,
                    gst: payment.notes?.gst,
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
            console.error(`User not found for failed payment ${payment.id} (userId: ${userId || 'N/A'})`);
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
