export function contractApprovalEmail(data: {
  recipientName: string;
  contractId: string;
  contractType: string;
  partyName: string;
  amount?: string;
  startDate?: string;
  actionUrl: string;
}) {
  return {
    subject: `📋 Contract Approval Required - ${data.contractType}`,
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
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                      Contract Approval Required
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">
                      Dear <strong>${data.recipientName}</strong>,
                    </p>
                    
                    <p style="margin: 0 0 20px 0;">
                      A new contract requires your approval.
                    </p>

                    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">Contract Details</h3>
                      <table width="100%" cellpadding="8" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Contract ID:</td>
                          <td style="text-align: right; font-weight: 600; font-family: monospace;">${data.contractId}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Type:</td>
                          <td style="text-align: right; font-weight: 600;">${data.contractType}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Party:</td>
                          <td style="text-align: right; font-weight: 600;">${data.partyName}</td>
                        </tr>
                        ${data.amount ? `
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Amount:</td>
                            <td style="text-align: right; font-weight: 600; color: #059669; font-size: 16px;">${data.amount}</td>
                          </tr>
                        ` : ''}
                        ${data.startDate ? `
                          <tr>
                            <td style="color: #6b7280; font-size: 14px;">Start Date:</td>
                            <td style="text-align: right; font-weight: 600;">${data.startDate}</td>
                          </tr>
                        ` : ''}
                      </table>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${data.actionUrl}" 
                         style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        Review & Approve Contract
                      </a>
                    </div>

                    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 13px; text-align: center;">
                      Or copy this link:<br>
                      <a href="${data.actionUrl}" style="color: #3b82f6; word-break: break-all;">${data.actionUrl}</a>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="background: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px;">
                      SmartPro Contract Management System | Automated Notification
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
Dear ${data.recipientName},

A new contract requires your approval.

CONTRACT DETAILS:
- Contract ID: ${data.contractId}
- Type: ${data.contractType}
- Party: ${data.partyName}
${data.amount ? `- Amount: ${data.amount}` : ''}
${data.startDate ? `- Start Date: ${data.startDate}` : ''}

Review at: ${data.actionUrl}

SmartPro Contract Management System
    `,
  };
}

