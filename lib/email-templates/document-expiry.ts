export function documentExpiryEmail(data: {
  promoterName: string;
  documentType: 'ID Card' | 'Passport';
  expiryDate: string;
  daysRemaining: number;
  urgent: boolean;
}) {
  const urgentBadge = data.urgent
    ? '<span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold;">URGENT</span>'
    : '';

  return {
    subject: `${data.urgent ? '🚨 URGENT: ' : '⚠️ '}${data.documentType} Expiring ${data.urgent ? 'Soon' : `in ${data.daysRemaining} days`}`,
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
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                      Document Expiry Notice
                    </h1>
                    ${urgentBadge ? `<div style="margin-top: 10px;">${urgentBadge}</div>` : ''}
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">
                      Dear <strong>${data.promoterName}</strong>,
                    </p>
                    
                    <div style="background: ${data.urgent ? '#fee2e2' : '#fef3c7'}; border-left: 4px solid ${data.urgent ? '#dc2626' : '#f59e0b'}; padding: 20px; border-radius: 4px; margin: 20px 0;">
                      <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: ${data.urgent ? '#991b1b' : '#92400e'};">
                        ${data.urgent ? '⚠️' : '📋'} Your ${data.documentType} ${data.urgent ? 'is expiring very soon!' : 'will expire soon'}
                      </p>
                      <table width="100%" cellpadding="8" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Document Type:</td>
                          <td style="text-align: right; font-weight: 600;">${data.documentType}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Expiry Date:</td>
                          <td style="text-align: right; font-weight: 600; color: ${data.urgent ? '#dc2626' : '#f59e0b'};">${data.expiryDate}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Days Remaining:</td>
                          <td style="text-align: right; font-weight: 600; font-size: 20px; color: ${data.urgent ? '#dc2626' : '#f59e0b'};">${data.daysRemaining}</td>
                        </tr>
                      </table>
                    </div>

                    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 25px 0;">
                      <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1f2937;">
                        📝 Action Required
                      </h3>
                      <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                        <li>Please renew your ${data.documentType} as soon as possible</li>
                        <li>Upload the new document to the system</li>
                        <li>Contact HR if you need assistance</li>
                      </ul>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io'}/en/profile" 
                         style="display: inline-block; background: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Upload New Document
                      </a>
                    </div>

                    ${
                      data.urgent
                        ? `
                      <div style="background: #fee2e2; border: 2px solid #fca5a5; padding: 15px; border-radius: 6px; margin-top: 20px;">
                        <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 14px;">
                          ⚠️ <strong>Important:</strong> Expired documents may affect your employment status and contract validity.
                        </p>
                      </div>
                    `
                        : ''
                    }
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                      This is an automated notification from SmartPro Contract Management System
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      If you have questions, please contact your HR department
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
Dear ${data.promoterName},

${data.urgent ? 'URGENT:' : ''} Your ${data.documentType} is expiring ${data.urgent ? 'very soon' : `in ${data.daysRemaining} days`}.

Expiry Date: ${data.expiryDate}
Days Remaining: ${data.daysRemaining}

ACTION REQUIRED:
- Please renew your ${data.documentType} as soon as possible
- Upload the new document to the system
- Contact HR if you need assistance

Upload at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io'}/en/profile

${data.urgent ? 'WARNING: Expired documents may affect your employment status and contract validity.' : ''}

This is an automated notification from SmartPro Contract Management System.
    `,
  };
}
