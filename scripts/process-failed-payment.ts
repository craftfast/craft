/**
 * Manually process a failed payment webhook
 * This script will retry processing a payment that failed due to the Invoice table error
 */

import { prisma } from "../src/lib/db";
import { fromSmallestUnit } from "../src/lib/razorpay";

const PAYMENT_ID = "pay_Rhy9n38wvalZTu";

async function processFailedPayment() {
    try {
        console.log(`\n🔄 Processing failed payment: ${PAYMENT_ID}\n`);

        // Fetch payment from Razorpay
        const Razorpay = require("razorpay");
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const payment = await razorpay.payments.fetch(PAYMENT_ID);
        console.log("📦 Payment details:", {
            id: payment.id,
            order_id: payment.order_id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            email: payment.email,
            notes: payment.notes,
        });

        // Get user from notes
        const userId = payment.notes?.user_id;
        if (!userId) {
            throw new Error("No user_id found in payment notes");
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                accountBalance: true,
            },
        });

        if (!user) {
            throw new Error(`User not found: ${userId}`);
        }

        console.log(`\n👤 User found:`, {
            id: user.id,
            email: user.email,
            currentBalance: user.accountBalance.toString(),
        });

        // Get purchase details from notes
        const requestedBalance = parseFloat(payment.notes?.requested_balance || "0");
        const amount = fromSmallestUnit(payment.amount);

        if (requestedBalance <= 0) {
            throw new Error("Invalid requested balance in payment notes");
        }

        console.log(`\n💰 Transaction details:`, {
            requestedBalance: `$${requestedBalance}`,
            totalCharged: `$${amount}`,
            platformFee: `$${payment.notes?.platform_fee || "N/A"}`,
        });

        // Calculate new balance
        const balanceBefore = parseFloat(user.accountBalance.toString());
        const balanceAfter = balanceBefore + requestedBalance;

        console.log(`\n📊 Balance update:`, {
            before: `$${balanceBefore.toFixed(2)}`,
            adding: `$${requestedBalance.toFixed(2)}`,
            after: `$${balanceAfter.toFixed(2)}`,
        });

        // Update user balance
        await prisma.user.update({
            where: { id: user.id },
            data: {
                accountBalance: balanceAfter,
            },
        });

        console.log("✅ User balance updated");

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
                    processedManually: true,
                },
            },
        });

        console.log("✅ Balance transaction record created");

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
                    purchaseType: "balance_topup",
                    notes: payment.notes,
                    processedManually: true,
                },
            },
        });

        console.log("✅ Payment transaction record created");

        // Update webhook event status
        const webhookEvent = await prisma.razorpayWebhookEvent.findFirst({
            where: {
                eventType: "payment.captured",
                payload: {
                    path: ["payload", "payment", "entity", "id"],
                    equals: PAYMENT_ID,
                },
            },
        });

        if (webhookEvent) {
            await prisma.razorpayWebhookEvent.update({
                where: { id: webhookEvent.id },
                data: {
                    status: "COMPLETED",
                    processedAt: new Date(),
                    errorMessage: null,
                },
            });
            console.log("✅ Webhook event marked as completed");
        }

        console.log(`\n✅ Successfully processed payment ${PAYMENT_ID}`);
        console.log(`💵 Added $${requestedBalance} to user ${user.email}'s balance\n`);

    } catch (error) {
        console.error("\n❌ Error processing payment:", error);
        process.exit(1);
    }
}

processFailedPayment()
    .then(() => {
        console.log("✅ Done");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
