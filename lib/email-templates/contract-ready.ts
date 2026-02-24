/**
 * Contract Ready Email Template
 *
 * Sent when a contract PDF has been successfully generated and is ready for download.
 */

export interface ContractReadyEmailProps {
  recipientName: string;
  contractNumber: string;
  contractType: string;
  promoterName?: string;
  firstPartyName?: string;
  secondPartyName?: string;
  startDate?: string;
  endDate?: string;
  basicSalary?: number;
  currency?: string;
  pdfUrl: string;
  portalUrl?: string;
}

export function contractReadyEmail(data: ContractReadyEmailProps) {
  const portalUrl =
    data.portalUrl || 'https://portal.thesmartpro.io/en/dashboard';
  const currencyLabel = data.currency || 'OMR';
  const salaryRow =
    data.basicSalary != null
      ? `<tr>
          <td style="color: #6b7280; font-size: 14px; padding: 6px 0;">Basic Salary:</td>
          <td style="text-align: right; font-weight: 600; font-size: 14px;">${data.basicSalary.toLocaleString()} ${currencyLabel}</td>
        </tr>`
      : '';

  return {
    subject: `✅ Contract Ready: ${data.contractNumber} — ${data.contractType}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contract Ready</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 600px;">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <div style="display: inline-block; width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center; line-height: 64px; margin-bottom: 12px;">
                      <span style="font-size: 32px;">📄</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">
                      Your Contract is Ready
                    </h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">
                      SmartPro Contract Management System
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 36px 32px 24px 32px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px;">
                      Dear <strong>${data.recipientName}</strong>,
                    </p>
                    <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px;">
                      Your contract has been successfully generated and is now ready for review and download.
                    </p>

                    <!-- Contract Details Card -->
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 0 0 28px 0;">
                      <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 15px; font-weight: 600;">
                        📋 Contract Details
                      </h3>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; padding: 6px 0;">Contract Number:</td>
                          <td style="text-align: right; font-weight: 700; font-family: monospace; font-size: 14px; color: #111827;">${data.contractNumber}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; font-size: 14px; padding: 6px 0;">Contract Type:</td>
                          <td style="text-align: right; font-weight: 600; font-size: 14px;">${data.contractType}</td>
                        </tr>
                        ${
                          data.firstPartyName
                            ? `<tr>
                          <td style="color: #6b7280; font-size: 14px; padding: 6px 0;">First Party:</td>
                          <td style="text-align: right; font-weight: 600; font-size: 14px;">${data.firstPartyName}</td>
                        </tr>`
                            : ''
                        }
                        ${
                          data.secondPartyName
                            ? `<tr>
                          <td style="color: #6b7280; font-size: 14px; padding: 6px 0;">Second Party:</td>
                          <td style="text-align: right; font-weight: 600; font-size: 14px;">${data.secondPartyName}</td>
                        </tr>`
                            : ''
                        }
                        ${
                          data.promoterName
                            ? `<tr>
                          <td style="color: #6b7280; font-size: 14px; padding: 6px 0;">Promoter:</td>
                          <td style="text-align: right; font-weight: 600; font-size: 14px;">${data.promoterName}</td>
                        </tr>`
                            : ''
                        }
                        ${
                          data.startDate
                            ? `<tr>
                          <td style="color: #6b7280; font-size: 14px; padding: 6px 0;">Start Date:</td>
                          <td style="text-align: right; font-weight: 600; font-size: 14px;">${new Date(data.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                        </tr>`
                            : ''
                        }
                        ${
                          data.endDate
                            ? `<tr>
                          <td style="color: #6b7280; font-size: 14px; padding: 6px 0;">End Date:</td>
                          <td style="text-align: right; font-weight: 600; font-size: 14px;">${new Date(data.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                        </tr>`
                            : ''
                        }
                        ${salaryRow}
                      </table>
                    </div>

                    <!-- Download Button -->
                    <div style="text-align: center; margin: 0 0 24px 0;">
                      <a href="${data.pdfUrl}"
                         style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.025em;">
                        ⬇️ Download Contract PDF
                      </a>
                    </div>

                    <!-- Portal Link -->
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-align: center;">
                      Or view it in the portal:
                    </p>
                    <div style="text-align: center; margin: 0 0 28px 0;">
                      <a href="${portalUrl}"
                         style="display: inline-block; background: #f3f4f6; color: #374151; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 500; border: 1px solid #e5e7eb;">
                        Open Portal Dashboard
                      </a>
                    </div>

                    <!-- Notice -->
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 14px 18px; margin: 0 0 24px 0;">
                      <p style="margin: 0; color: #92400e; font-size: 13px;">
                        <strong>⚠️ Important:</strong> Please review the contract carefully before signing. If you notice any discrepancies, contact your administrator immediately.
                      </p>
                    </div>

                    <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                      This email was sent automatically by the SmartPro Contract Management System. Please do not reply to this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; text-align: center;">
                    <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;">
                      SmartPro Contract Management System
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                      © ${new Date().getFullYear()} SmartPro. All rights reserved.
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
Contract Ready: ${data.contractNumber}

Dear ${data.recipientName},

Your contract has been successfully generated and is ready for download.

Contract Details:
- Contract Number: ${data.contractNumber}
- Contract Type: ${data.contractType}
${data.firstPartyName ? `- First Party: ${data.firstPartyName}` : ''}
${data.secondPartyName ? `- Second Party: ${data.secondPartyName}` : ''}
${data.promoterName ? `- Promoter: ${data.promoterName}` : ''}
${data.startDate ? `- Start Date: ${new Date(data.startDate).toLocaleDateString()}` : ''}
${data.endDate ? `- End Date: ${new Date(data.endDate).toLocaleDateString()}` : ''}
${data.basicSalary != null ? `- Basic Salary: ${data.basicSalary.toLocaleString()} ${currencyLabel}` : ''}

Download PDF: ${data.pdfUrl}
Portal Dashboard: ${portalUrl}

Please review the contract carefully before signing.

SmartPro Contract Management System
    `.trim(),
  };
}
