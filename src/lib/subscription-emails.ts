/**
 * Subscription Email Templates
 * 
 * Email templates for subscription-related notifications:
 * - Payment failures
 * - Grace period reminders
 * - Subscription updates
 * - Plan changes
 */

import { sendEmail } from "./email";

interface User {
    email: string;
    name?: string | null;
}

interface SubscriptionEmailData {
    user: User;
    planName: string;
    amount: number;
    currency?: string;
}

interface GracePeriodEmailData extends SubscriptionEmailData {
    daysRemaining: number;
    gracePeriodEndsAt: Date;
}

/**
 * Send payment failure notification email
 */
export async function sendPaymentFailedEmail(
    data: SubscriptionEmailData
): Promise<boolean> {
    const { user, planName, amount, currency = "USD" } = data;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const updatePaymentUrl = `${baseUrl}/settings/billing`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px;">⚠️</span>
                            </div>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #171717;">Payment Failed</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                Hi${user.name ? ` ${user.name}` : ''},
                            </p>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                We were unable to process your payment for your <strong>${planName}</strong> subscription ($${amount.toFixed(2)}/${currency === "USD" ? "mo" : "month"}).
                            </p>
                            
                            <!-- Info Box -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px;">
                                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #991b1b;">
                                    Action Required
                                </p>
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #7f1d1d;">
                                    Your subscription is now in a <strong>7-day grace period</strong>. Please update your payment method to avoid service interruption.
                                </p>
                            </div>
                            
                            <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                Common reasons for payment failure:
                            </p>
                            <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #737373; font-size: 14px; line-height: 1.8;">
                                <li>Insufficient funds</li>
                                <li>Expired card</li>
                                <li>Incorrect billing information</li>
                                <li>Card issuer declined the transaction</li>
                            </ul>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 30px 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="${updatePaymentUrl}" style="display: inline-block; padding: 14px 40px; background-color: #171717; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 16px; font-weight: 500;">
                                            Update Payment Method
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                If your payment is not updated within 7 days, your subscription will be downgraded to the Hobby plan.
                            </p>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                Need help? <a href="mailto:support@craft.fast" style="color: #0ea5e9; text-decoration: none;">Contact our support team</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
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

    return sendEmail({
        to: user.email,
        subject: "⚠️ Payment Failed - Action Required",
        html,
    });
}

/**
 * Send grace period reminder email
 */
export async function sendGracePeriodReminderEmail(
    data: GracePeriodEmailData
): Promise<boolean> {
    const { user, planName, amount, daysRemaining, gracePeriodEndsAt, currency = "USD" } = data;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const updatePaymentUrl = `${baseUrl}/settings/billing`;

    const urgencyLevel = daysRemaining <= 2 ? "high" : daysRemaining <= 5 ? "medium" : "low";
    const urgencyColor = urgencyLevel === "high" ? "#dc2626" : urgencyLevel === "medium" ? "#ea580c" : "#ca8a04";
    const urgencyBg = urgencyLevel === "high" ? "#fef2f2" : urgencyLevel === "medium" ? "#fff7ed" : "#fefce8";

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grace Period Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: ${urgencyBg}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px;">⏰</span>
                            </div>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #171717;">
                                ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Remaining
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                Hi${user.name ? ` ${user.name}` : ''},
                            </p>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                This is a reminder that your <strong>${planName}</strong> subscription payment is still pending.
                            </p>
                            
                            <!-- Countdown Box -->
                            <div style="margin: 30px 0; padding: 24px; background-color: ${urgencyBg}; border-left: 4px solid ${urgencyColor}; border-radius: 8px; text-align: center;">
                                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: ${urgencyColor}; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Time Remaining
                                </p>
                                <p style="margin: 0; font-size: 36px; font-weight: 700; color: ${urgencyColor};">
                                    ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}
                                </p>
                                <p style="margin: 8px 0 0 0; font-size: 14px; color: #737373;">
                                    Until ${gracePeriodEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                            
                            <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                ${daysRemaining <= 2
            ? `<strong style="color: ${urgencyColor};">Urgent:</strong> If we don't receive your payment by ${gracePeriodEndsAt.toLocaleDateString()}, your subscription will be downgraded to the Hobby plan and you'll lose access to premium features.`
            : `Please update your payment method to continue enjoying your ${planName} subscription benefits.`
        }
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 30px 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="${updatePaymentUrl}" style="display: inline-block; padding: 14px 40px; background-color: #171717; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 16px; font-weight: 500;">
                                            Update Payment Method Now
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                Amount due: <strong>$${amount.toFixed(2)}/${currency === "USD" ? "mo" : "month"}</strong>
                            </p>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                Questions? <a href="mailto:support@craft.fast" style="color: #0ea5e9; text-decoration: none;">We're here to help</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
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

    return sendEmail({
        to: user.email,
        subject: `⏰ ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Left - Update Your Payment Method`,
        html,
    });
}

/**
 * Send subscription cancelled email (after grace period expires)
 */
export async function sendSubscriptionDowngradedEmail(
    data: SubscriptionEmailData & { reason: 'grace_period_expired' | 'user_cancelled' }
): Promise<boolean> {
    const { user, planName, reason } = data;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const upgradeUrl = `${baseUrl}/settings/billing`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Downgraded</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #171717;">
                                ${reason === 'grace_period_expired' ? 'Subscription Downgraded' : 'Subscription Cancelled'}
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                Hi${user.name ? ` ${user.name}` : ''},
                            </p>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                ${reason === 'grace_period_expired'
            ? `Your <strong>${planName}</strong> subscription has been downgraded to the <strong>Hobby plan</strong> because we were unable to process your payment within the 7-day grace period.`
            : `Your <strong>${planName}</strong> subscription has been cancelled as requested.`
        }
                            </p>
                            
                            <!-- Info Box -->
                            <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 8px;">
                                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #0369a1;">
                                    What happens now?
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #075985; font-size: 14px; line-height: 1.8;">
                                    <li>You're now on the <strong>Hobby plan</strong></li>
                                    <li>Monthly credit limit: <strong>100 credits</strong></li>
                                    <li>All your projects are still safe</li>
                                    <li>You can upgrade anytime</li>
                                </ul>
                            </div>
                            
                            <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                Want to continue using premium features? You can upgrade back to ${planName} or choose any other plan anytime.
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 30px 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="${upgradeUrl}" style="display: inline-block; padding: 14px 40px; background-color: #171717; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 16px; font-weight: 500;">
                                            View Upgrade Options
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                Need help or have questions? <a href="mailto:support@craft.fast" style="color: #0ea5e9; text-decoration: none;">Contact our support team</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
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

    return sendEmail({
        to: user.email,
        subject: reason === 'grace_period_expired'
            ? "Your subscription has been downgraded"
            : "Your subscription has been cancelled",
        html,
    });
}

/**
 * Send subscription upgraded/changed email
 */
export async function sendSubscriptionChangedEmail(
    data: SubscriptionEmailData & {
        oldPlanName: string;
        newPlanName: string;
        oldAmount: number;
        newAmount: number;
        changeType: 'upgrade' | 'downgrade';
    }
): Promise<boolean> {
    const { user, oldPlanName, newPlanName, oldAmount, newAmount, changeType, currency = "USD" } = data;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const billingUrl = `${baseUrl}/settings/billing`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription ${changeType === 'upgrade' ? 'Upgraded' : 'Changed'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px;">✨</span>
                            </div>
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #171717;">
                                Subscription ${changeType === 'upgrade' ? 'Upgraded' : 'Updated'}!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                Hi${user.name ? ` ${user.name}` : ''},
                            </p>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                Your subscription has been successfully ${changeType === 'upgrade' ? 'upgraded' : 'changed'} from <strong>${oldPlanName}</strong> to <strong>${newPlanName}</strong>.
                            </p>
                            
                            <!-- Plan Comparison -->
                            <table role="presentation" style="width: 100%; margin: 30px 0; border-collapse: collapse;">
                                <tr>
                                    <td style="width: 50%; padding: 20px; background-color: #f5f5f5; border-radius: 8px 0 0 8px; text-align: center;">
                                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">Previous Plan</p>
                                        <p style="margin: 0; font-size: 20px; font-weight: 600; color: #171717;">${oldPlanName}</p>
                                        <p style="margin: 8px 0 0 0; font-size: 16px; color: #525252;">$${oldAmount.toFixed(2)}/mo</p>
                                    </td>
                                    <td style="width: 50%; padding: 20px; background-color: #f0fdf4; border-radius: 0 8px 8px 0; text-align: center;">
                                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">New Plan</p>
                                        <p style="margin: 0; font-size: 20px; font-weight: 600; color: #15803d;">${newPlanName}</p>
                                        <p style="margin: 8px 0 0 0; font-size: 16px; color: #166534;">$${newAmount.toFixed(2)}/mo</p>
                                    </td>
                                </tr>
                            </table>
                            
                            ${changeType === 'upgrade' ? `
                            <div style="margin: 30px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #166534;">
                                    🎉 You now have access to more credits and premium features! Your new plan is active immediately.
                                </p>
                            </div>
                            ` : ''}
                            
                            <p style="margin: 20px 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                ${changeType === 'upgrade'
            ? `You've been charged the difference of $${(newAmount - oldAmount).toFixed(2)} for the remainder of your billing period.`
            : `Your new plan will take effect on your next billing cycle.`
        }
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 30px 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="${billingUrl}" style="display: inline-block; padding: 14px 40px; background-color: #171717; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 16px; font-weight: 500;">
                                            View Billing Details
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                Questions about your plan? <a href="mailto:support@craft.fast" style="color: #0ea5e9; text-decoration: none;">Contact support</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #e5e5e5;">
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

    return sendEmail({
        to: user.email,
        subject: `✨ Subscription ${changeType === 'upgrade' ? 'Upgraded' : 'Updated'} - ${newPlanName}`,
        html,
    });
}
