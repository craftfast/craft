/**
 * Payment Receipt & Invoice Service
 * 
 * Sends professional payment receipt emails after successful transactions.
 * For B2B customers with GSTIN, the invoice includes full GST details for ITC claims.
 * Users can print the email directly if they need a PDF copy.
 * 
 * Only sends if user has sendInvoiceEmail enabled.
 */

import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { getGstStateCode } from "@/data";
import { amountToWords } from "@/lib/utils/number-to-words";

// Company details from environment
const COMPANY_NAME = process.env.COMPANY_NAME || "Craft.fast";
const COMPANY_GSTIN = process.env.COMPANY_GSTIN || "";
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || "";
const COMPANY_STATE = process.env.COMPANY_STATE || "";
const COMPANY_STATE_CODE = process.env.COMPANY_STATE_CODE || "";
const SAC_CODE = process.env.GST_SAC_CODE || "998315";

interface ReceiptResult {
    success: boolean;
    invoiceNumber?: string;
    error?: string;
}

interface SendReceiptParams {
    userId: string;
    userEmail: string;
    userName?: string;
    paymentId: string;
    orderId: string;
    credits: number; // Base amount in USD (converted to INR for invoice display)
    platformFee: number; // Base amount in USD (converted to INR for invoice display)
    gst: number; // Base amount in USD (converted to INR for invoice display)
    totalAmount: number; // Final charged amount in payment currency (INR)
    currency: string; // Payment currency (always INR)
    exchangeRate?: number | null; // USD to INR exchange rate used for conversion
}

/**
 * Format currency amount for display
 */
function formatAmount(amount: number, currency: string): string {
    if (currency === 'INR') {
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${amount.toFixed(2)}`;
}

/**
 * Generate sequential invoice number for Indian GST invoices
 * Format: CRAFT/2024-25/INV/000001
 * 
 * Uses atomic increment via InvoiceSequence table to prevent race conditions
 * when multiple invoices are generated simultaneously.
 */
async function generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const fyStart = month >= 4 ? year : year - 1;
    const fyEnd = fyStart + 1;
    const fy = `${fyStart}-${String(fyEnd).slice(-2)}`;

    // Atomically increment and get the next invoice number
    const sequence = await prisma.$transaction(async (tx) => {
        // Try to find existing sequence for this financial year
        const existing = await tx.invoiceSequence.findUnique({
            where: { financialYear: fy },
        });

        if (existing) {
            // Increment existing sequence
            return await tx.invoiceSequence.update({
                where: { financialYear: fy },
                data: { lastNumber: { increment: 1 } },
            });
        } else {
            // Create new sequence starting at 1
            return await tx.invoiceSequence.create({
                data: { financialYear: fy, lastNumber: 1 },
            });
        }
    });

    const nextNumber = sequence.lastNumber;
    if (nextNumber > 999999) {
        console.warn(
            `[Invoice] High invoice number detected: ${nextNumber} for FY ${fy}. Consider reviewing invoice generation.`
        );
    }

    const invoiceNum = String(nextNumber).padStart(6, "0");
    return `CRAFT/${fy}/INV/${invoiceNum}`;
}

/**
 * Determine GST type based on customer state
 */
function getGstType(customerState?: string): "IGST" | "CGST_SGST" {
    if (!customerState || !COMPANY_STATE) {
        return "IGST";
    }
    return customerState.toLowerCase() === COMPANY_STATE.toLowerCase()
        ? "CGST_SGST"
        : "IGST";
}

/**
 * Send payment receipt email after successful top-up
 * Invoice is ALWAYS generated and stored, email is optional based on user preference
 */
export async function sendPaymentReceipt(params: SendReceiptParams): Promise<ReceiptResult> {
    try {
        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: {
                sendInvoiceEmail: true,
                billingName: true,
                billingAddress: true,
                billingCountry: true,
                taxId: true,
            },
        });

        const displayName = user?.billingName || params.userName || "Customer";
        const billingAddress = user?.billingAddress as { line1?: string; line2?: string; city?: string; state?: string; postalCode?: string } | null;
        const customerState = billingAddress?.state;
        const customerStateCode = getGstStateCode(customerState);

        const isInr = params.currency === 'INR';
        const exchangeRate = params.exchangeRate || 1;

        // Always generate invoice number for all transactions
        const invoiceNumber = await generateInvoiceNumber();

        const date = new Date().toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        // Calculate amounts
        const creditsAmount = isInr ? params.credits * exchangeRate : params.credits;
        const platformFeeAmount = isInr ? params.platformFee * exchangeRate : params.platformFee;
        const taxableAmount = creditsAmount + platformFeeAmount;
        const gstAmount = isInr ? params.gst * exchangeRate : params.gst;

        // GST split - all transactions now have GST
        const gstType = getGstType(customerState);
        let cgst = 0, sgst = 0, igst = 0;
        if (gstAmount > 0) {
            if (gstType === "CGST_SGST") {
                cgst = gstAmount / 2;
                sgst = gstAmount / 2;
            } else {
                igst = gstAmount;
            }
        }

        // Place of Supply - for IGST it's the customer's state, for CGST/SGST it's same as supplier
        const placeOfSupply = customerState || COMPANY_STATE;
        const placeOfSupplyCode = customerStateCode || COMPANY_STATE_CODE;

        // Amount in words
        const amountInWords = amountToWords(params.totalAmount, params.currency);

        // Reverse charge - for SaaS services, typically not applicable
        const reverseCharge = 'No';

        // Format addresses
        const customerAddressParts = [
            billingAddress?.line1,
            billingAddress?.line2,
            billingAddress?.city,
            billingAddress?.state,
            billingAddress?.postalCode,
            user?.billingCountry,
        ].filter(Boolean);
        const formattedCustomerAddress = customerAddressParts.join(', ');

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Invoice - Craft</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 100%; max-width: 650px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
                    
                    <!-- Header with Logo -->
                    <tr>
                        <td style="padding: 30px 40px; background: linear-gradient(135deg, #171717 0%, #262626 100%); border-radius: 12px 12px 0 0;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td>
                                        <table role="presentation" style="border-collapse: collapse;">
                                            <tr>
                                                <td style="vertical-align: middle; padding-right: 10px;">
                                                    <!-- Craft "C" Logo -->
                                                    <svg width="32" height="33" viewBox="0 0 72 74" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M0.768 36.608C2.048 29.2693 4.65067 22.8693 8.576 17.408C12.5013 11.8613 17.3653 7.59467 23.168 4.608C29.056 1.536 35.4133 0 42.24 0C51.0293 0 57.8987 2.176 62.848 6.528C67.8827 10.88 70.6987 17.0667 71.296 25.088H51.968C51.456 22.016 50.1333 19.6267 48 17.92C45.8667 16.128 43.008 15.232 39.424 15.232C34.304 15.232 29.9093 17.1093 26.24 20.864C22.656 24.5333 20.2667 29.7813 19.072 36.608C18.6453 38.9973 18.432 41.0453 18.432 42.752C18.432 47.616 19.6267 51.3707 22.016 54.016C24.4053 56.576 27.7333 57.856 32 57.856C39.168 57.856 44.4587 54.6133 47.872 48.128H67.2C63.872 55.808 58.88 61.9093 52.224 66.432C45.6533 70.9547 38.0587 73.216 29.44 73.216C20.48 73.216 13.312 70.6987 7.936 65.664C2.64533 60.544 0 53.632 0 44.928C0 42.2827 0.256 39.5093 0.768 36.608Z" fill="white"/>
                                                    </svg>
                                                </td>
                                                <td style="vertical-align: middle;">
                                                    <span style="font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Craft</span><span style="font-size: 22px; font-weight: 700; color: #a3a3a3; letter-spacing: -0.5px;">.fast</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td style="text-align: right;">
                                        <p style="margin: 0; font-size: 20px; font-weight: 600; color: #ffffff;">TAX INVOICE</p>
                                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #a3a3a3;">${invoiceNumber}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Success Banner -->
                    <tr>
                        <td style="padding: 25px 40px; background-color: #f0fdf4; border-bottom: 1px solid #dcfce7;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="vertical-align: middle;">
                                        <span style="display: inline-block; width: 24px; height: 24px; background-color: #22c55e; border-radius: 50%; text-align: center; line-height: 24px; color: white; font-size: 14px; margin-right: 12px;">✓</span>
                                        <span style="font-size: 16px; font-weight: 600; color: #166534;">Payment Successful</span>
                                    </td>
                                    <td style="text-align: right;">
                                        <span style="font-size: 24px; font-weight: 700; color: #166534;">${formatAmount(params.totalAmount, params.currency)}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Tax Invoice: Supplier & Customer Details -->
                    <tr>
                        <td style="padding: 25px 40px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="width: 48%; vertical-align: top; padding-right: 15px;">
                                        <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">From</p>
                                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #171717;">${COMPANY_NAME}</p>
                                        <p style="margin: 6px 0 0 0; font-size: 12px; color: #525252; line-height: 1.5;">${COMPANY_ADDRESS}</p>
                                        <p style="margin: 8px 0 0 0; font-size: 12px; color: #171717;"><strong>GSTIN:</strong> ${COMPANY_GSTIN}</p>
                                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #525252;">State: ${COMPANY_STATE} (${COMPANY_STATE_CODE})</p>
                                    </td>
                                    <td style="width: 4%;"></td>
                                    <td style="width: 48%; vertical-align: top; padding-left: 15px; border-left: 1px solid #e5e5e5;">
                                        <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">Bill To</p>
                                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #171717;">${displayName}</p>
                                        ${formattedCustomerAddress ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #525252; line-height: 1.5;">${formattedCustomerAddress}</p>` : ''}
                                        ${user?.taxId ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #171717;"><strong>GSTIN:</strong> ${user.taxId}</p>` : ''}
                                        ${customerState ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #525252;">State: ${customerState}${customerStateCode ? ` (${customerStateCode})` : ''}</p>` : ''}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Place of Supply & Reverse Charge Info (GST Mandatory) -->
                    <tr>
                        <td style="padding: 0 40px 15px 40px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fafafa; border-radius: 6px;">
                                <tr>
                                    <td style="padding: 12px 15px; font-size: 12px; color: #525252;">
                                        <strong>Place of Supply:</strong> ${placeOfSupply}${placeOfSupplyCode ? ` (${placeOfSupplyCode})` : ''} &nbsp;|&nbsp;
                                        <strong>Reverse Charge:</strong> ${reverseCharge}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Invoice/Receipt Details -->
                    <tr>
                        <td style="padding: 0 40px 25px 40px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
                                <!-- Header Row -->
                                <tr style="background-color: #fafafa;">
                                    <td style="padding: 12px 10px; font-size: 10px; font-weight: 600; color: #525252; text-transform: uppercase; border-bottom: 1px solid #e5e5e5; width: 5%;">S.No</td>
                                    <td style="padding: 12px 10px; font-size: 10px; font-weight: 600; color: #525252; text-transform: uppercase; border-bottom: 1px solid #e5e5e5;">Description</td>
                                    <td style="padding: 12px 8px; font-size: 10px; font-weight: 600; color: #525252; text-transform: uppercase; text-align: center; border-bottom: 1px solid #e5e5e5;">SAC</td>
                                    <td style="padding: 12px 8px; font-size: 10px; font-weight: 600; color: #525252; text-transform: uppercase; text-align: center; border-bottom: 1px solid #e5e5e5;">Qty</td>
                                    <td style="padding: 12px 8px; font-size: 10px; font-weight: 600; color: #525252; text-transform: uppercase; text-align: center; border-bottom: 1px solid #e5e5e5;">UoM</td>
                                    <td style="padding: 12px 8px; font-size: 10px; font-weight: 600; color: #525252; text-transform: uppercase; text-align: right; border-bottom: 1px solid #e5e5e5;">Rate</td>
                                    <td style="padding: 12px 10px; font-size: 10px; font-weight: 600; color: #525252; text-transform: uppercase; text-align: right; border-bottom: 1px solid #e5e5e5;">Amount</td>
                                </tr>
                                
                                <!-- AI Credits -->
                                <tr>
                                    <td style="padding: 12px 10px; font-size: 12px; color: #525252; text-align: center; border-bottom: 1px solid #f0f0f0;">1</td>
                                    <td style="padding: 12px 10px; font-size: 12px; color: #171717; border-bottom: 1px solid #f0f0f0;">
                                        <strong>AI Credits</strong><br>
                                        <span style="font-size: 11px; color: #737373;">Cloud-based AI service credits${isInr ? ` @ ₹${exchangeRate.toFixed(2)}/USD` : ''}</span>
                                    </td>
                                    <td style="padding: 12px 8px; font-size: 11px; color: #525252; text-align: center; border-bottom: 1px solid #f0f0f0;">${SAC_CODE}</td>
                                    <td style="padding: 12px 8px; font-size: 12px; color: #525252; text-align: center; border-bottom: 1px solid #f0f0f0;">${params.credits.toFixed(2)}</td>
                                    <td style="padding: 12px 8px; font-size: 11px; color: #525252; text-align: center; border-bottom: 1px solid #f0f0f0;">USD</td>
                                    <td style="padding: 12px 8px; font-size: 12px; color: #525252; text-align: right; border-bottom: 1px solid #f0f0f0;">${isInr ? `₹${exchangeRate.toFixed(2)}` : '$1.00'}</td>
                                    <td style="padding: 12px 10px; font-size: 12px; color: #171717; text-align: right; border-bottom: 1px solid #f0f0f0;">${formatAmount(creditsAmount, params.currency)}</td>
                                </tr>
                                
                                <!-- Platform Fee -->
                                <tr>
                                    <td style="padding: 12px 10px; font-size: 12px; color: #525252; text-align: center; border-bottom: 1px solid #f0f0f0;">2</td>
                                    <td style="padding: 12px 10px; font-size: 12px; color: #171717; border-bottom: 1px solid #f0f0f0;">
                                        <strong>Platform Service Fee</strong><br>
                                        <span style="font-size: 11px; color: #737373;">10% platform service charge</span>
                                    </td>
                                    <td style="padding: 12px 8px; font-size: 11px; color: #525252; text-align: center; border-bottom: 1px solid #f0f0f0;">${SAC_CODE}</td>
                                    <td style="padding: 12px 8px; font-size: 12px; color: #525252; text-align: center; border-bottom: 1px solid #f0f0f0;">1</td>
                                    <td style="padding: 12px 8px; font-size: 11px; color: #525252; text-align: center; border-bottom: 1px solid #f0f0f0;">Nos</td>
                                    <td style="padding: 12px 8px; font-size: 12px; color: #525252; text-align: right; border-bottom: 1px solid #f0f0f0;">${formatAmount(platformFeeAmount, params.currency)}</td>
                                    <td style="padding: 12px 10px; font-size: 12px; color: #171717; text-align: right; border-bottom: 1px solid #f0f0f0;">${formatAmount(platformFeeAmount, params.currency)}</td>
                                </tr>
                                
                                <!-- Subtotal -->
                                <tr style="background-color: #fafafa;">
                                    <td colspan="6" style="padding: 12px 15px; font-size: 12px; color: #525252; text-align: right; border-bottom: 1px solid #e5e5e5;">Taxable Amount</td>
                                    <td style="padding: 12px 10px; font-size: 12px; color: #171717; text-align: right; border-bottom: 1px solid #e5e5e5;">${formatAmount(taxableAmount, params.currency)}</td>
                                </tr>
                                
                                ${gstAmount > 0 ? `
                                ${gstType === "CGST_SGST" ? `
                                <!-- CGST -->
                                <tr>
                                    <td colspan="6" style="padding: 10px 15px; font-size: 12px; color: #525252; text-align: right;">CGST @ 9%</td>
                                    <td style="padding: 10px 10px; font-size: 12px; color: #171717; text-align: right;">${formatAmount(cgst, params.currency)}</td>
                                </tr>
                                <!-- SGST -->
                                <tr>
                                    <td colspan="6" style="padding: 10px 15px; font-size: 12px; color: #525252; text-align: right;">SGST @ 9%</td>
                                    <td style="padding: 10px 10px; font-size: 12px; color: #171717; text-align: right;">${formatAmount(sgst, params.currency)}</td>
                                </tr>
                                ` : `
                                <!-- IGST -->
                                <tr>
                                    <td colspan="6" style="padding: 10px 15px; font-size: 12px; color: #525252; text-align: right;">IGST @ 18%</td>
                                    <td style="padding: 10px 10px; font-size: 12px; color: #171717; text-align: right;">${formatAmount(igst, params.currency)}</td>
                                </tr>
                                `}
                                ` : ''}
                                
                                ${isInr && exchangeRate > 1 ? `
                                <!-- Exchange Rate Note -->
                                <tr>
                                    <td colspan="6" style="padding: 8px 15px; font-size: 11px; color: #737373; text-align: right;">Exchange Rate: 1 USD = ₹${exchangeRate.toFixed(2)}</td>
                                    <td style="padding: 8px 10px;"></td>
                                </tr>
                                ` : ''}
                                
                                <!-- Total -->
                                <tr style="background-color: #171717;">
                                    <td colspan="6" style="padding: 15px; font-size: 13px; font-weight: 600; color: #ffffff; text-align: right;">Total Amount</td>
                                    <td style="padding: 15px 10px; font-size: 15px; font-weight: 700; color: #ffffff; text-align: right;">${formatAmount(params.totalAmount, params.currency)}</td>
                                </tr>
                                
                                <!-- Amount in Words -->
                                <tr>
                                    <td colspan="7" style="padding: 12px 15px; font-size: 11px; color: #525252; background-color: #f9fafb;">
                                        <strong>Amount in Words:</strong> ${amountInWords}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Payment & Order Info -->
                    <tr>
                        <td style="padding: 0 40px 25px 40px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; padding: 15px;">
                                <tr>
                                    <td style="padding: 15px;">
                                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="font-size: 12px; color: #737373;">Date</td>
                                                <td style="font-size: 12px; color: #171717; text-align: right;">${date}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12px; color: #737373; padding-top: 8px;">Payment ID</td>
                                                <td style="font-size: 12px; color: #171717; text-align: right; padding-top: 8px; font-family: monospace;">${params.paymentId}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12px; color: #737373; padding-top: 8px;">Order ID</td>
                                                <td style="font-size: 12px; color: #171717; text-align: right; padding-top: 8px; font-family: monospace;">${params.orderId}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12px; color: #737373; padding-top: 8px;">Status</td>
                                                <td style="font-size: 12px; text-align: right; padding-top: 8px;"><span style="background-color: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 12px; font-weight: 500;">PAID</span></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Credits Added Banner -->
                    <tr>
                        <td style="padding: 0 40px 25px 40px;">
                            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 10px; padding: 20px; text-align: center;">
                                <p style="margin: 0 0 5px 0; font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px;">Credits Added to Your Account</p>
                                <p style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff;">$${params.credits.toFixed(2)}</p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- GST Notes -->
                    <tr>
                        <td style="padding: 0 40px 20px 40px;">
                            <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 15px;">
                                <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; color: #92400e;">GST COMPLIANCE NOTES</p>
                                <p style="margin: 0; font-size: 11px; color: #78716c; line-height: 1.6;">
                                    • <strong>SAC Code:</strong> ${SAC_CODE} - Application service provisioning (SaaS/Cloud Services)<br>
                                    • <strong>Place of Supply:</strong> ${placeOfSupply}${placeOfSupplyCode ? ` (Code: ${placeOfSupplyCode})` : ''}<br>
                                    • <strong>Supply Type:</strong> ${gstType === "CGST_SGST" ? "Intra-state supply (CGST + SGST applicable)" : "Inter-state supply (IGST applicable)"}<br>
                                    • <strong>Reverse Charge:</strong> ${reverseCharge}<br>
                                    ${user?.taxId ? `• <strong>ITC Eligibility:</strong> This is a valid tax invoice for Input Tax Credit claims` : '• This invoice is generated for B2C transaction'}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 25px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e5e5;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #737373;">
                                            This is a computer-generated tax invoice and does not require a signature.
                                        </p>
                                        <p style="margin: 0 0 15px 0; font-size: 12px; color: #a3a3a3;">
                                            Questions? Contact us at support@craft.fast
                                        </p>
                                        <p style="margin: 0; font-size: 11px; color: #a3a3a3;">
                                            © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
                                        </p>
                                        ${COMPANY_GSTIN ? `<p style="margin: 5px 0 0 0; font-size: 10px; color: #d4d4d4;">GSTIN: ${COMPANY_GSTIN}</p>` : ''}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim();

        // ALWAYS store invoice in database first (regardless of email preference)
        // Use findFirst + conditional update to prevent race conditions where multiple
        // webhook events could assign different invoice numbers to the same payment
        const transaction = await prisma.paymentTransaction.findFirst({
            where: { razorpayPaymentId: params.paymentId },
        });

        if (transaction) {
            // Only update if invoiceId is not already set (prevents race condition)
            if (transaction.invoiceId) {
                console.log(`Invoice already exists for payment ${params.paymentId}: ${transaction.invoiceId}`);
                return { success: true, invoiceNumber: transaction.invoiceId };
            }

            const existingMetadata = (transaction.metadata as Record<string, unknown>) || {};
            await prisma.paymentTransaction.update({
                where: { id: transaction.id },
                data: {
                    invoiceId: invoiceNumber,
                    metadata: {
                        ...existingMetadata,
                        invoiceNumber,
                        gstType,
                        taxableAmount,
                        cgst,
                        sgst,
                        igst,
                        supplierGstin: COMPANY_GSTIN,
                        supplierState: COMPANY_STATE,
                        supplierStateCode: COMPANY_STATE_CODE,
                        customerGstin: user?.taxId,
                        customerState: customerState,
                        customerStateCode: customerStateCode,
                        placeOfSupply: placeOfSupply,
                        placeOfSupplyCode: placeOfSupplyCode,
                        reverseCharge: reverseCharge,
                        sacCode: SAC_CODE,
                        amountInWords: amountInWords,
                    },
                },
            });
            console.log(`Invoice ${invoiceNumber} stored for payment ${params.paymentId}`);
        }

        // Check if user wants email - if not, return success with invoice number
        if (!user?.sendInvoiceEmail) {
            console.log(`Invoice email skipped for user ${params.userId} - sendInvoiceEmail is disabled (invoice ${invoiceNumber} still stored)`);
            return { success: true, invoiceNumber };
        }

        // Send email
        const subject = `Tax Invoice ${invoiceNumber} - ${formatAmount(params.totalAmount, params.currency)}`;

        const sent = await sendEmail({
            to: params.userEmail,
            subject,
            html,
        });

        if (sent) {
            console.log(`Tax Invoice email sent to ${params.userEmail} for payment ${params.paymentId}`);
            return { success: true, invoiceNumber };
        } else {
            // Invoice is already stored, just email failed
            console.error(`Failed to send invoice email for ${invoiceNumber}, but invoice is stored`);
            return { success: true, invoiceNumber, error: "Invoice stored but email failed" };
        }
    } catch (error) {
        console.error("Error sending payment receipt:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
