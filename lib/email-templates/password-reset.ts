export interface PasswordResetEmailProps {
  recipientName: string;
  resetLink: string;
  expiresIn?: string;
}

export function passwordResetEmail(props: PasswordResetEmailProps) {
  const { recipientName, resetLink, expiresIn = '1 hour' } = props;

  return {
    subject: '🔐 Password Reset Request - SmartPro CMS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
                    <div style="display: inline-block; width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center; line-height: 60px; margin-bottom: 15px;">
                      <span style="font-size: 30px;">🔐</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                      Password Reset Request
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">
                      Dear <strong>${recipientName}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 25px 0; font-size: 15px; color: #6b7280;">
                      We received a request to reset your password for your SmartPro Contract Management System account. If you didn't make this request, you can safely ignore this email.
                    </p>

                    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin: 25px 0;">
                      <p style="margin: 0 0 10px 0; font-weight: 600; color: #1e40af;">
                        🔑 Security Information
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                        <li>This link will expire in <strong>${expiresIn}</strong></li>
                        <li>For security reasons, this link can only be used once</li>
                        <li>Never share this link with anyone</li>
                      </ul>
                    </div>

                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${resetLink}" 
                         style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                        Reset Your Password
                      </a>
                    </div>

                    <p style="margin: 25px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 13px; color: #3b82f6; word-break: break-all; text-align: center;">
                      ${resetLink}
                    </p>

                    <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; margin-top: 30px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>⚠️ Security Tip:</strong> If you didn't request this password reset, please contact your system administrator immediately as this may indicate someone is trying to access your account.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                      This is an automated message from SmartPro Contract Management System
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      For support, please contact your system administrator
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Password Reset Request

Dear ${recipientName},

We received a request to reset your password for your SmartPro Contract Management System account.

To reset your password, click the link below:
${resetLink}

Security Information:
- This link will expire in ${expiresIn}
- This link can only be used once
- Never share this link with anyone

If you didn't request this password reset, please ignore this email and contact your system administrator.

This is an automated message from SmartPro Contract Management System.
    `,
  };
}
