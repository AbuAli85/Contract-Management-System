export function welcomeEmail(data: {
  userName: string;
  email: string;
  role: string;
  loginUrl: string;
}) {
  return {
    subject: '🎉 Welcome to SmartPro Contract Management System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 28px; font-weight: 600;">
                      Welcome to SmartPro! 🎉
                    </h1>
                    <p style="color: #d1fae5; margin: 0; font-size: 16px;">
                      Your account is now active
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">
                      Dear <strong>${data.userName}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 20px 0; line-height: 1.8;">
                      Your account has been approved and is now active! You can now access the SmartPro Contract Management System.
                    </p>
                    
                    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
                      <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 16px;">
                        📋 Your Account Details
                      </h3>
                      <table width="100%" cellpadding="8" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Email:</td>
                          <td style="text-align: right; font-weight: 600;">${data.email}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Role:</td>
                          <td style="text-align: right; font-weight: 600; text-transform: capitalize;">${data.role}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Status:</td>
                          <td style="text-align: right;">
                            <span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Active</span>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 25px 0;">
                      <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1f2937;">
                        🚀 Getting Started
                      </h3>
                      <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                        <li>Log in to your account using your email and password</li>
                        <li>Complete your profile information</li>
                        <li>Explore the dashboard and available features</li>
                        <li>Contact support if you need any assistance</li>
                      </ul>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${data.loginUrl}" 
                         style="display: inline-block; background: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Login to Your Account
                      </a>
                    </div>

                    <p style="margin: 25px 0 0 0; color: #6b7280; font-size: 14px; text-align: center; line-height: 1.6;">
                      If you have any questions or need assistance, please contact your system administrator or HR department.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">
                      SmartPro Contract Management System
                    </p>
                    <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                      Powered by Falcon Eye Group
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
Welcome to SmartPro Contract Management System!

Dear ${data.userName},

Your account has been approved and is now active! You can now access the SmartPro Contract Management System.

YOUR ACCOUNT DETAILS:
- Email: ${data.email}
- Role: ${data.role}
- Status: Active

GETTING STARTED:
- Log in to your account using your email and password
- Complete your profile information
- Explore the dashboard and available features
- Contact support if you need any assistance

Login at: ${data.loginUrl}

If you have any questions or need assistance, please contact your system administrator or HR department.

SmartPro Contract Management System
Powered by Falcon Eye Group
    `,
  };
}
