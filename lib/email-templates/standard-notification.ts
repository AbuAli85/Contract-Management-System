interface StandardNotificationData {
  promoterName: string;
  title: string;
  message: string;
  details?: {
    contractInfo?: {
      type: string;
      employer: string;
      startDate?: string;
      salary?: string;
    };
    documentStatus?: {
      idCardStatus: string;
      passportStatus: string;
      idCardExpiry?: string;
      passportExpiry?: string;
    };
    accountInfo?: {
      status: string;
      assignmentStatus: string;
      lastActive?: string;
    };
  };
  actionUrl?: string;
  actionText?: string;
}

export function standardNotificationEmail(data: StandardNotificationData) {
  return {
    subject: `📋 ${data.title}`,
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
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                      ${data.title}
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">
                      Dear <strong>${data.promoterName}</strong>,
                    </p>
                    
                    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin: 20px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.8;">
                        ${data.message}
                      </p>
                    </div>

                    ${
                      data.details?.contractInfo
                        ? `
                      <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 25px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">
                          📄 Contract Information
                        </h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Contract Type:</td>
                            <td style="text-align: right; font-weight: 600; padding: 8px 0;">${data.details.contractInfo.type}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Employer:</td>
                            <td style="text-align: right; font-weight: 600; padding: 8px 0;">${data.details.contractInfo.employer}</td>
                          </tr>
                          ${
                            data.details.contractInfo.startDate
                              ? `
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Start Date:</td>
                              <td style="text-align: right; font-weight: 600; padding: 8px 0;">${data.details.contractInfo.startDate}</td>
                            </tr>
                          `
                              : ''
                          }
                          ${
                            data.details.contractInfo.salary
                              ? `
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Salary:</td>
                              <td style="text-align: right; font-weight: 600; color: #059669; padding: 8px 0;">${data.details.contractInfo.salary}</td>
                            </tr>
                          `
                              : ''
                          }
                        </table>
                      </div>
                    `
                        : ''
                    }

                    ${
                      data.details?.documentStatus
                        ? `
                      <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 25px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">
                          📋 Document Status
                        </h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">ID Card:</td>
                            <td style="text-align: right; padding: 8px 0;">
                              <span style="background: ${data.details.documentStatus.idCardStatus === 'Valid' ? '#10b981' : '#ef4444'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                                ${data.details.documentStatus.idCardStatus}
                              </span>
                              ${data.details.documentStatus.idCardExpiry ? `<span style="color: #6b7280; font-size: 12px; margin-left: 8px;">(${data.details.documentStatus.idCardExpiry})</span>` : ''}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Passport:</td>
                            <td style="text-align: right; padding: 8px 0;">
                              <span style="background: ${data.details.documentStatus.passportStatus === 'Valid' ? '#10b981' : '#ef4444'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                                ${data.details.documentStatus.passportStatus}
                              </span>
                              ${data.details.documentStatus.passportExpiry ? `<span style="color: #6b7280; font-size: 12px; margin-left: 8px;">(${data.details.documentStatus.passportExpiry})</span>` : ''}
                            </td>
                          </tr>
                        </table>
                      </div>
                    `
                        : ''
                    }

                    ${
                      data.details?.accountInfo
                        ? `
                      <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 25px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">
                          👤 Account Information
                        </h3>
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Account Status:</td>
                            <td style="text-align: right; font-weight: 600; padding: 8px 0; text-transform: capitalize;">${data.details.accountInfo.status}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Assignment Status:</td>
                            <td style="text-align: right; font-weight: 600; padding: 8px 0; text-transform: capitalize;">${data.details.accountInfo.assignmentStatus}</td>
                          </tr>
                          ${
                            data.details.accountInfo.lastActive
                              ? `
                            <tr>
                              <td style="color: #6b7280; font-size: 14px; padding: 8px 0;">Last Active:</td>
                              <td style="text-align: right; font-weight: 600; padding: 8px 0;">${data.details.accountInfo.lastActive}</td>
                            </tr>
                          `
                              : ''
                          }
                        </table>
                      </div>
                    `
                        : ''
                    }

                    ${
                      data.actionUrl
                        ? `
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${data.actionUrl}" 
                           style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                          ${data.actionText || 'View Details'}
                        </a>
                      </div>
                    `
                        : ''
                    }

                    <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 25px 0;">
                      <p style="margin: 0; color: #1e40af; font-size: 13px; text-align: center;">
                        💡 <strong>Tip:</strong> Log in to your account to view complete details and manage your profile.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                      SmartPro Contract Management System
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      Powered by Falcon Eye Group | Automated Notification
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
${data.title}

Dear ${data.promoterName},

${data.message}

${
  data.details?.contractInfo
    ? `
CONTRACT INFORMATION:
- Type: ${data.details.contractInfo.type}
- Employer: ${data.details.contractInfo.employer}
${data.details.contractInfo.startDate ? `- Start Date: ${data.details.contractInfo.startDate}` : ''}
${data.details.contractInfo.salary ? `- Salary: ${data.details.contractInfo.salary}` : ''}
`
    : ''
}

${
  data.details?.documentStatus
    ? `
DOCUMENT STATUS:
- ID Card: ${data.details.documentStatus.idCardStatus}${data.details.documentStatus.idCardExpiry ? ` (${data.details.documentStatus.idCardExpiry})` : ''}
- Passport: ${data.details.documentStatus.passportStatus}${data.details.documentStatus.passportExpiry ? ` (${data.details.documentStatus.passportExpiry})` : ''}
`
    : ''
}

${data.actionUrl ? `View details at: ${data.actionUrl}` : ''}

Need Help?
Contact HR: hr@falconeyegroup.net or call +968 95153930

SmartPro Contract Management System
Powered by Falcon Eye Group
    `,
  };
}
