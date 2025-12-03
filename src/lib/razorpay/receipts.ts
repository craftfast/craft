/**
 * Payment Receipt Service
 * 
 * Sends simple payment receipt emails after successful transactions.
 * Only sends if user has sendInvoiceEmail enabled.
 */

import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

interface ReceiptResult {
    success: boolean;
    error?: string;
}

interface SendReceiptParams {
    userId: string;
    userEmail: string;
    userName?: string;
    paymentId: string;
    orderId: string;
    credits: number;
    platformFee: number;
    gst: number;
    totalAmount: number;
    currency: string;
}

/**
 * Send payment receipt email after successful top-up
 * Only sends if user has sendInvoiceEmail enabled
 */
export async function sendPaymentReceipt(params: SendReceiptParams): Promise<ReceiptResult> {
    try {
        // Check if user wants receipt emails
        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: {
                sendInvoiceEmail: true,
                billingName: true,
            },
        });

        if (!user?.sendInvoiceEmail) {
            console.log(`Receipt email skipped for user ${params.userId} - sendInvoiceEmail is disabled`);
            return { success: true };
        }

        const displayName = user.billingName || params.userName || "Customer";
        const date = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 10px;">✓</div>
                            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #171717;">Payment Successful</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                Hi ${displayName},
                            </p>
                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                Your payment has been processed successfully. Here's your receipt:
                            </p>
                            
                            <!-- Receipt Details -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fafafa; border-radius: 8px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #737373;">Date</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #171717; text-align: right;">${date}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #737373;">Payment ID</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #171717; text-align: right; font-family: monospace;">${params.paymentId}</td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding: 15px 0 10px 0; border-top: 1px solid #e5e5e5;"></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #525252;">Credits</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #171717; text-align: right;">$${params.credits.toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #525252;">Platform Fee (10%)</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #171717; text-align: right;">$${params.platformFee.toFixed(2)}</td>
                                            </tr>
                                            ${params.gst > 0 ? `
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #525252;">GST (18%)</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #171717; text-align: right;">$${params.gst.toFixed(2)}</td>
                                            </tr>
                                            ` : ''}
                                            <tr>
                                                <td colspan="2" style="padding: 10px 0; border-top: 1px solid #e5e5e5;"></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #171717;">Total Paid</td>
                                                <td style="padding: 8px 0; font-size: 16px; font-weight: 600; color: #171717; text-align: right;">$${params.totalAmount.toFixed(2)} ${params.currency}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Credits Added -->
                            <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
                                <p style="margin: 0 0 5px 0; font-size: 14px; color: #166534;">Credits Added to Your Account</p>
                                <p style="margin: 0; font-size: 28px; font-weight: 700; color: #166534;">$${params.credits.toFixed(2)}</p>
                            </div>
                            
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                You can view your transaction history and current balance in your account settings.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0 0 10px 0; font-size: 12px; color: #a3a3a3;">
                                This is your payment receipt from Craft.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                                © ${new Date().getFullYear()} Craft. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();

        const sent = await sendEmail({
            to: params.userEmail,
            subject: `Payment Receipt - $${params.totalAmount.toFixed(2)} ${params.currency}`,
            html,
        });

        if (sent) {
            console.log(`Receipt email sent to ${params.userEmail} for payment ${params.paymentId}`);
            return { success: true };
        } else {
            return { success: false, error: "Failed to send receipt email" };
        }
    } catch (error) {
        console.error("Error sending payment receipt:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
