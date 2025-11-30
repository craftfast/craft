/**
 * Email Service
 * Handles sending verification and notification emails
 */

import { EMAILS } from "@/lib/constants";

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

type OTPType = "sign-in" | "email-verification" | "forget-password" | "account-deletion" | "email-change";

/**
 * Send an email using Resend API (or fallback to console.log if no API key)
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
    const resendApiKey = process.env.RESEND_ACCOUNT_API_KEY || process.env.RESEND_API_KEY;
    const emailFrom = process.env.RESEND_ACCOUNT_EMAIL_FROM || process.env.EMAIL_FROM || EMAILS.NOREPLY;

    // If no API key, just log to console
    if (!resendApiKey) {
        console.log("\n📧 Email would be sent (no Resend API key configured):");
        console.log("To:", to);
        console.log("Subject:", subject);
        console.log("From:", emailFrom);
        console.log("\n");
        return true;
    }

    try {
        console.log(`\n📧 Sending email via Resend...`);
        console.log(`To: ${to}`);
        console.log(`From: ${emailFrom}`);
        console.log(`Subject: ${subject}`);

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: emailFrom,
                to,
                subject,
                html,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Failed to send email:", errorText);
            return false;
        }

        const result = await response.json();
        console.log("✅ Email sent successfully:", result);
        return true;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return false;
    }
}

/**
 * Send email verification email (Better Auth compatible signature)
 * @param data - Object containing user, url, and token
 * @returns Promise<boolean> - True if email sent successfully
 */
export async function sendVerificationEmail(
    data: { user: { email: string; name?: string | null }; url: string; token: string }
): Promise<boolean> {
    const { user, url: verificationUrl } = data;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #171717;">Verify Your Email</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                Thanks for signing up! Please verify your email address by clicking the button below:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 30px 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="${verificationUrl}" style="display: inline-block; padding: 14px 40px; background-color: #171717; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 16px; font-weight: 500;">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                Or copy and paste this URL into your browser:
                            </p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.6; color: #0ea5e9; word-break: break-all;">
                                ${verificationUrl}
                            </p>
                            
                            <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                This verification link will expire in 24 hours.
                            </p>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                If you didn't create an account, you can safely ignore this email.
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
        subject: "Verify your email address - Craft",
        html,
    });
}

/**
 * Send email verification email (Legacy helper for custom routes)
 * @deprecated Use sendVerificationEmail with Better Auth object signature
 */
export async function sendVerificationEmailLegacy(email: string, token: string): Promise<boolean> {
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const url = `${baseUrl}/auth/verify-email?token=${token}`;

    return sendVerificationEmail({
        user: { email },
        url,
        token,
    });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
    email: string,
    token: string,
    resetUrl?: string
): Promise<boolean> {
    // Use provided resetUrl or construct it
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const finalResetUrl = resetUrl || `${baseUrl}/auth/reset-password?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #171717;">Reset Your Password</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                We received a request to reset your password. Click the button below to choose a new password:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 30px 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="${finalResetUrl}" style="display: inline-block; padding: 14px 40px; background-color: #171717; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 16px; font-weight: 500;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                Or copy and paste this URL into your browser:
                            </p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.6; color: #0ea5e9; word-break: break-all;">
                                ${finalResetUrl}
                            </p>
                            
                            <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                This password reset link will expire in <strong>1 hour</strong> for security reasons.
                            </p>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
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
        to: email,
        subject: "Reset your password - Craft",
        html,
    });
}

/**
 * Send OTP verification email
 * Used by Better Auth email OTP plugin
 */
export async function sendOTPEmail(
    email: string,
    otp: string,
    type: OTPType
): Promise<boolean> {
    const typeConfig = {
        "sign-in": {
            title: "Sign In to Craft",
            heading: "Sign In Code",
            message: "Use this code to sign in to your account:",
            subject: "Your sign-in code - Craft",
            warning: null,
        },
        "email-verification": {
            title: "Verify Your Email",
            heading: "Email Verification Code",
            message: "Use this code to verify your email address:",
            subject: "Verify your email - Craft",
            warning: null,
        },
        "forget-password": {
            title: "Reset Your Password",
            heading: "Password Reset Code",
            message: "Use this code to reset your password:",
            subject: "Reset your password - Craft",
            warning: null,
        },
        "account-deletion": {
            title: "Confirm Account Deletion",
            heading: "Account Deletion Code",
            message: "Someone requested to permanently delete your Craft account. If this was you, use this code to confirm:",
            subject: "Confirm account deletion - Craft",
            warning: "⚠️ WARNING: This action is permanent and cannot be undone. All your data, projects, and settings will be permanently deleted after a 30-day grace period.",
        },
        "email-change": {
            title: "Verify Email Change",
            heading: "Email Change Verification Code",
            message: "You requested to change your email address. Use this code to confirm the change:",
            subject: "Verify your email change - Craft",
            warning: null,
        },
    } as const;

    const config = typeConfig[type];

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #171717;">${config.heading}</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                                ${config.message}
                            </p>
                            
                            <!-- OTP Code Box -->
                            <table role="presentation" style="margin: 30px 0; width: 100%;">
                                <tr>
                                    <td align="center" style="background-color: #f5f5f5; padding: 30px; border-radius: 12px;">
                                        <div style="font-size: 42px; font-weight: 700; letter-spacing: 8px; color: #171717; font-family: 'Courier New', monospace;">
                                            ${otp}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            ${config.warning ? `
                            <div style="margin: 30px 0; padding: 20px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px;">
                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #991b1b; font-weight: 600;">
                                    ${config.warning}
                                </p>
                            </div>
                            ` : ''}
                            
                            <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                This code will expire in <strong>5 minutes</strong> for security reasons.
                            </p>
                            
                            <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                                If you didn't request this code, you can safely ignore this email${type === 'account-deletion' ? ' and contact support immediately' : ''}.
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
        to: email,
        subject: config.subject,
        html,
    });
}


