/**
 * Simple Notification Email Template
 * Designed to avoid spam filters while maintaining professionalism
 * Microsoft 365 friendly - minimal HTML, no complex styling
 */

export interface SimpleNotificationEmailProps {
  recipientName: string;
  title: string;
  message: string;
  actionUrl?: string | undefined;
  actionLabel?: string | undefined;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | undefined;
  additionalInfo?: Array<{ label: string; value: string }> | undefined;
}

export function simpleNotificationEmail(props: SimpleNotificationEmailProps) {
  const {
    recipientName,
    title,
    message,
    actionUrl,
    actionLabel = 'View Details',
    priority = 'medium',
    additionalInfo = [],
  } = props;

  // Priority indicator (emoji only, no "URGENT" text to avoid spam filters)
  const priorityEmoji = {
    low: '📘',
    medium: '📋',
    high: '⚠️',
    urgent: '🔴',
  }[priority];

  const subject = `${priorityEmoji} ${title}`;

  // Simple HTML - Microsoft 365 friendly
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="border-left: 4px solid #0066cc; padding-left: 20px; margin-bottom: 20px;">
    <h2 style="color: #0066cc; margin: 0 0 10px 0;">${title}</h2>
  </div>

  <p>Hello ${recipientName},</p>

  <p>${message}</p>

  ${
    additionalInfo.length > 0
      ? `
  <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
    ${additionalInfo
      .map(
        info => `
    <p style="margin: 5px 0;">
      <strong>${info.label}:</strong> ${info.value}
    </p>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  ${
    actionUrl
      ? `
  <p style="margin: 30px 0;">
    <a href="${actionUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">${actionLabel}</a>
  </p>
  `
      : ''
  }

  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

  <p style="color: #666; font-size: 14px;">
    SmartPro Contract Management System<br>
    Falcon Eye Group<br>
    <a href="https://portal.thesmartpro.io" style="color: #0066cc;">portal.thesmartpro.io</a>
  </p>

  <p style="color: #999; font-size: 12px;">
    This is an automated notification. Please do not reply to this email.
  </p>

</body>
</html>
  `.trim();

  // Plain text version
  const text = `
${title}

Hello ${recipientName},

${message}

${additionalInfo.map(info => `${info.label}: ${info.value}`).join('\n')}

${actionUrl ? `${actionLabel}: ${actionUrl}` : ''}

---
SmartPro Contract Management System
Falcon Eye Group
portal.thesmartpro.io

This is an automated notification. Please do not reply to this email.
  `.trim();

  return {
    subject,
    html,
    text,
  };
}

/**
 * Document Expiry Notification (Simple Version)
 */
export function simpleDocumentExpiryEmail(props: {
  recipientName: string;
  documentType: string;
  expiryDate: string;
  daysRemaining: number;
  viewUrl?: string;
}) {
  const { recipientName, documentType, expiryDate, daysRemaining, viewUrl } =
    props;

  const priority =
    daysRemaining <= 7 ? 'urgent' : daysRemaining <= 30 ? 'high' : 'medium';

  const message =
    daysRemaining <= 0
      ? `Your ${documentType} has expired. Please renew it immediately to avoid compliance issues.`
      : `Your ${documentType} will expire in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}. Please renew it before the expiry date.`;

  return simpleNotificationEmail({
    recipientName,
    title: `${documentType} Expiry Notice`,
    message,
    priority,
    ...(viewUrl && { actionUrl: viewUrl, actionLabel: 'View Document' }),
    additionalInfo: [
      { label: 'Document Type', value: documentType },
      { label: 'Expiry Date', value: expiryDate },
      { label: 'Days Remaining', value: daysRemaining.toString() },
      {
        label: 'Status',
        value:
          daysRemaining <= 0
            ? 'Expired'
            : daysRemaining <= 7
              ? 'Critical'
              : 'Expiring Soon',
      },
    ],
  });
}

/**
 * Contract Approval Notification (Simple Version)
 */
export function simpleContractApprovalEmail(props: {
  recipientName: string;
  contractNumber: string;
  contractTitle: string;
  actionRequired: string;
  viewUrl?: string;
}) {
  const {
    recipientName,
    contractNumber,
    contractTitle,
    actionRequired,
    viewUrl,
  } = props;

  return simpleNotificationEmail({
    recipientName,
    title: 'Contract Approval Required',
    message: `A contract requires your attention. ${actionRequired}`,
    priority: 'high',
    ...(viewUrl && { actionUrl: viewUrl, actionLabel: 'Review Contract' }),
    additionalInfo: [
      { label: 'Contract Number', value: contractNumber },
      { label: 'Title', value: contractTitle },
      { label: 'Action Required', value: actionRequired },
    ],
  });
}
