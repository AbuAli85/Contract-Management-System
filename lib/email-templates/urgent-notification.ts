interface UrgentNotificationData {
  promoterName: string;
  reason: string;
  details: {
    expiringDocuments?: Array<{
      type: string;
      expiryDate: string;
      daysRemaining: number;
    }>;
    pendingContracts?: Array<{
      id: string;
      type: string;
      status: string;
      employer: string;
    }>;
    missingDocuments?: string[];
    actionItems?: string[];
  };
  actionUrl: string;
}

export function urgentNotificationEmail(data: UrgentNotificationData) {
  const hasExpiringDocs = data.details.expiringDocuments && data.details.expiringDocuments.length > 0;
  const hasPendingContracts = data.details.pendingContracts && data.details.pendingContracts.length > 0;
  const hasMissingDocs = data.details.missingDocuments && data.details.missingDocuments.length > 0;
  const hasActionItems = data.details.actionItems && data.details.actionItems.length > 0;

  return {
    subject: `🚨 URGENT: ${data.reason}`,
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
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Urgent Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">
                      🚨 URGENT NOTICE
                    </h1>
                    <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 14px;">
                      Immediate Action Required
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">
                      Dear <strong>${data.promoterName}</strong>,
                    </p>
                    
                    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 4px; margin: 20px 0;">
                      <p style="margin: 0; font-size: 18px; font-weight: 600; color: #991b1b;">
                        ${data.reason}
                      </p>
                    </div>

                    ${hasExpiringDocs ? `
                      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px; margin: 25px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 16px;">
                          ⚠️ Documents Expiring Soon
                        </h3>
                        <table width="100%" cellpadding="10" cellspacing="0" style="background: white; border-radius: 4px;">
                          <tr style="background: #fbbf24; color: white;">
                            <th style="text-align: left; padding: 10px; font-size: 13px;">Document</th>
                            <th style="text-align: center; padding: 10px; font-size: 13px;">Expiry Date</th>
                            <th style="text-align: center; padding: 10px; font-size: 13px;">Days Left</th>
                          </tr>
                          ${data.details.expiringDocuments!.map(doc => `
                            <tr style="border-bottom: 1px solid #fef3c7;">
                              <td style="padding: 12px; font-weight: 600;">${doc.type}</td>
                              <td style="padding: 12px; text-align: center;">${doc.expiryDate}</td>
                              <td style="padding: 12px; text-align: center; font-weight: 700; color: ${doc.daysRemaining < 30 ? '#dc2626' : '#f59e0b'};">
                                ${doc.daysRemaining} days
                              </td>
                            </tr>
                          `).join('')}
                        </table>
                      </div>
                    ` : ''}

                    ${hasPendingContracts ? `
                      <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 4px; margin: 25px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">
                          📋 Pending Contracts
                        </h3>
                        <table width="100%" cellpadding="10" cellspacing="0" style="background: white; border-radius: 4px;">
                          <tr style="background: #3b82f6; color: white;">
                            <th style="text-align: left; padding: 10px; font-size: 13px;">Contract Type</th>
                            <th style="text-align: left; padding: 10px; font-size: 13px;">Employer</th>
                            <th style="text-align: center; padding: 10px; font-size: 13px;">Status</th>
                          </tr>
                          ${data.details.pendingContracts!.map(contract => `
                            <tr style="border-bottom: 1px solid #dbeafe;">
                              <td style="padding: 12px; font-weight: 600;">${contract.type}</td>
                              <td style="padding: 12px;">${contract.employer}</td>
                              <td style="padding: 12px; text-align: center;">
                                <span style="background: #fbbf24; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                  ${contract.status}
                                </span>
                              </td>
                            </tr>
                          `).join('')}
                        </table>
                      </div>
                    ` : ''}

                    ${hasMissingDocs ? `
                      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 4px; margin: 25px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #991b1b; font-size: 16px;">
                          ❌ Missing Required Documents
                        </h3>
                        <ul style="margin: 0; padding-left: 20px; color: #7f1d1d;">
                          ${data.details.missingDocuments!.map(doc => `
                            <li style="margin: 8px 0; font-weight: 600;">${doc}</li>
                          `).join('')}
                        </ul>
                      </div>
                    ` : ''}

                    ${hasActionItems ? `
                      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 4px; margin: 25px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 16px;">
                          ✅ Required Actions
                        </h3>
                        <ol style="margin: 0; padding-left: 25px; color: #064e3b; line-height: 1.8;">
                          ${data.details.actionItems!.map(action => `
                            <li style="margin: 8px 0;"><strong>${action}</strong></li>
                          `).join('')}
                        </ol>
                      </div>
                    ` : ''}

                    <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 30px 0;">
                      <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">
                        ⏰ Timeline
                      </h3>
                      <p style="margin: 0; color: #4b5563; font-size: 14px;">
                        This notification requires your immediate attention. Please take action within <strong>24-48 hours</strong> to avoid any issues with your employment status or contract validity.
                      </p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${data.actionUrl}" 
                         style="display: inline-block; background: #dc2626; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                        Take Action Now
                      </a>
                    </div>

                    <div style="background: #fffbeb; border: 2px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 25px 0;">
                      <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                        <strong>📞 Need Help?</strong><br>
                        Contact HR Department: <a href="mailto:hr@falconeyegroup.net" style="color: #b45309; font-weight: 600;">hr@falconeyegroup.net</a><br>
                        Or call: +968 95153930
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px; text-align: center;">
                      SmartPro Contract Management System
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                      Powered by Falcon Eye Group | Automated Urgent Notification
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
URGENT NOTICE - ${data.reason}

Dear ${data.promoterName},

${data.reason}

${hasExpiringDocs ? `
DOCUMENTS EXPIRING SOON:
${data.details.expiringDocuments!.map(doc => `- ${doc.type}: Expires ${doc.expiryDate} (${doc.daysRemaining} days remaining)`).join('\n')}
` : ''}

${hasPendingContracts ? `
PENDING CONTRACTS:
${data.details.pendingContracts!.map(c => `- ${c.type} with ${c.employer} (Status: ${c.status})`).join('\n')}
` : ''}

${hasMissingDocs ? `
MISSING REQUIRED DOCUMENTS:
${data.details.missingDocuments!.map(doc => `- ${doc}`).join('\n')}
` : ''}

${hasActionItems ? `
REQUIRED ACTIONS:
${data.details.actionItems!.map((action, i) => `${i + 1}. ${action}`).join('\n')}
` : ''}

TIMELINE: Please take action within 24-48 hours.

Take action at: ${data.actionUrl}

Need Help?
Contact HR: hr@falconeyegroup.net or call +968 95153930

SmartPro Contract Management System
Powered by Falcon Eye Group
    `,
  };
}

