/**
 * Email Service
 * Handles sending verification and notification emails
 */

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

/**
 * Send an email using Resend API (or fallback to console.log if no API key)
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
    const resendApiKey = process.env.RESEND_ACCOUNT_API_KEY || process.env.RESEND_API_KEY;
    const emailFrom = process.env.RESEND_ACCOUNT_EMAIL_FROM || process.env.EMAIL_FROM || "noreply@craft.dev";

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
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

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
        to: email,
        subject: "Verify your email address - Craft",
        html,
    });
}


