export interface ContractStatusChangeEmailProps {
  recipientName: string;
  contractNumber: string;
  contractTitle: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  reason?: string;
  contractUrl?: string;
}

export function contractStatusChangeEmail(
  props: ContractStatusChangeEmailProps
) {
  const {
    recipientName,
    contractNumber,
    contractTitle,
    oldStatus,
    newStatus,
    changedBy,
    reason,
    contractUrl,
  } = props;

  // Status color mapping
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved') || statusLower.includes('active'))
      return '#10b981';
    if (statusLower.includes('pending')) return '#f59e0b';
    if (statusLower.includes('rejected') || statusLower.includes('expired'))
      return '#ef4444';
    if (statusLower.includes('draft')) return '#6b7280';
    return '#3b82f6';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved') || statusLower.includes('active'))
      return '✅';
    if (statusLower.includes('pending')) return '⏳';
    if (statusLower.includes('rejected')) return '❌';
    if (statusLower.includes('expired')) return '⚠️';
    if (statusLower.includes('draft')) return '📝';
    return '📄';
  };

  return {
    subject: `${getStatusIcon(newStatus)} Contract Status Update - ${contractNumber}`,
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
                    <div style="display: inline-block; width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center; line-height: 60px; margin-bottom: 15px;">
                      <span style="font-size: 30px;">📄</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                      Contract Status Updated
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
                      The status of your contract has been updated in the SmartPro Contract Management System.
                    </p>

                    <div style="background: #f9fafb; border-radius: 8px; padding: 25px; margin: 25px 0;">
                      <table width="100%" cellpadding="8" cellspacing="0">
                        <tr>
                          <td colspan="2" style="padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                            <h3 style="margin: 0; font-size: 16px; color: #1f2937;">📋 Contract Details</h3>
                          </td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; width: 35%;">Contract Number:</td>
                          <td style="font-weight: 600; font-size: 14px;">${contractNumber}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Title:</td>
                          <td style="font-weight: 600; font-size: 14px;">${contractTitle}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Previous Status:</td>
                          <td>
                            <span style="display: inline-block; background: ${getStatusColor(oldStatus)}20; color: ${getStatusColor(oldStatus)}; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">
                              ${oldStatus}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">New Status:</td>
                          <td>
                            <span style="display: inline-block; background: ${getStatusColor(newStatus)}20; color: ${getStatusColor(newStatus)}; padding: 6px 14px; border-radius: 12px; font-size: 14px; font-weight: 700; border: 2px solid ${getStatusColor(newStatus)}40;">
                              ${getStatusIcon(newStatus)} ${newStatus}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px;">Changed By:</td>
                          <td style="font-weight: 600; font-size: 14px;">${changedBy}</td>
                        </tr>
                        ${
                          reason
                            ? `
                        <tr>
                          <td colspan="2" style="padding-top: 15px;">
                            <div style="background: #eff6ff; border-left: 3px solid #3b82f6; padding: 12px; border-radius: 4px;">
                              <p style="margin: 0; font-size: 13px; color: #1e40af;"><strong>Reason:</strong> ${reason}</p>
                            </div>
                          </td>
                        </tr>
                        `
                            : ''
                        }
                      </table>
                    </div>

                    ${
                      contractUrl
                        ? `
                    <div style="text-align: center; margin: 35px 0;">
                      <a href="${contractUrl}" 
                         style="display: inline-block; background: #667eea; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                        View Contract Details
                      </a>
                    </div>
                    `
                        : ''
                    }

                    ${
                      newStatus.toLowerCase().includes('approved')
                        ? `
                    <div style="background: #d1fae5; border: 2px solid #6ee7b7; padding: 15px; border-radius: 6px; margin-top: 20px;">
                      <p style="margin: 0; color: #065f46; font-weight: 600; font-size: 14px;">
                        🎉 <strong>Congratulations!</strong> Your contract has been approved and is now active.
                      </p>
                    </div>
                    `
                        : ''
                    }

                    ${
                      newStatus.toLowerCase().includes('rejected')
                        ? `
                    <div style="background: #fee2e2; border: 2px solid #fca5a5; padding: 15px; border-radius: 6px; margin-top: 20px;">
                      <p style="margin: 0 0 10px 0; color: #991b1b; font-weight: 600; font-size: 14px;">
                        ℹ️ <strong>Action Required:</strong> Your contract was not approved.
                      </p>
                      <p style="margin: 0; color: #7f1d1d; font-size: 13px;">
                        Please review the reason above and contact your administrator for next steps.
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
                      For questions about this change, please contact ${changedBy}
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
Contract Status Updated

Dear ${recipientName},

The status of your contract has been updated in the SmartPro Contract Management System.

Contract Details:
- Contract Number: ${contractNumber}
- Title: ${contractTitle}
- Previous Status: ${oldStatus}
- New Status: ${newStatus}
- Changed By: ${changedBy}
${reason ? `- Reason: ${reason}` : ''}

${contractUrl ? `View Contract: ${contractUrl}` : ''}

${newStatus.toLowerCase().includes('approved') ? 'Congratulations! Your contract has been approved and is now active.' : ''}
${newStatus.toLowerCase().includes('rejected') ? 'Your contract was not approved. Please review the reason above and contact your administrator.' : ''}

This is an automated notification from SmartPro Contract Management System.
    `,
  };
}
