import { getSupabaseAdmin } from '@/lib/supabase/admin';

interface NotificationOptions {
  recipientId?: string;
  recipientEmail: string;
  type: string;
  subject: string;
  body: string;
  metadata?: Record<string, any>;
}

/**
 * Queue a notification for sending
 * In production, a background job would process the queue and send emails
 */
export async function queueNotification(options: NotificationOptions) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { data, error } = await (supabaseAdmin.from('notification_queue') as any)
      .insert({
        recipient_id: options.recipientId || null,
        recipient_email: options.recipientEmail,
        notification_type: options.type,
        subject: options.subject,
        body: options.body,
        metadata: options.metadata || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error queuing notification:', error);
      return { success: false, error };
    }

    return { success: true, notification: data };
  } catch (error) {
    console.error('Error in queueNotification:', error);
    return { success: false, error };
  }
}

/**
 * Queue a leave request approval/rejection notification
 */
export async function notifyLeaveRequestStatus(
  employeeEmail: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  status: 'approved' | 'rejected',
  reviewerName: string,
  reviewNotes?: string
) {
  const statusText = status === 'approved' ? 'Approved ✅' : 'Rejected ❌';
  const subject = `Leave Request ${statusText} - ${leaveType}`;

  const body = `
Dear ${employeeName},

Your leave request has been ${status}.

📋 Leave Details:
- Type: ${leaveType}
- Dates: ${startDate} to ${endDate}
- Status: ${statusText}
- Reviewed by: ${reviewerName}
${reviewNotes ? `\n📝 Notes: ${reviewNotes}` : ''}

${status === 'approved' 
  ? 'Your leave has been approved. Enjoy your time off!' 
  : 'If you have questions about this decision, please contact your manager.'}

Best regards,
HR System
`;

  return queueNotification({
    recipientEmail: employeeEmail,
    type: 'leave_status',
    subject,
    body,
    metadata: { leaveType, startDate, endDate, status },
  });
}

/**
 * Queue a new announcement notification
 */
export async function notifyNewAnnouncement(
  employeeEmails: string[],
  announcementTitle: string,
  announcementContent: string,
  priority: string,
  senderName: string
) {
  const priorityEmoji = {
    low: 'ℹ️',
    normal: '📢',
    important: '⚠️',
    urgent: '🚨',
  }[priority] || '📢';

  const subject = `${priorityEmoji} New Announcement: ${announcementTitle}`;

  const body = `
${priorityEmoji} New Team Announcement

📋 ${announcementTitle}

${announcementContent}

---
From: ${senderName}
Priority: ${priority.charAt(0).toUpperCase() + priority.slice(1)}

Log in to view more details and mark as read.
`;

  // Queue notification for each recipient
  const results = await Promise.all(
    employeeEmails.map(email =>
      queueNotification({
        recipientEmail: email,
        type: 'new_announcement',
        subject,
        body,
        metadata: { title: announcementTitle, priority },
      })
    )
  );

  return {
    success: results.every(r => r.success),
    queued: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
  };
}

/**
 * Queue a new leave request notification to employer
 */
export async function notifyNewLeaveRequest(
  employerEmail: string,
  employerName: string,
  employeeName: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  totalDays: number,
  reason?: string
) {
  const subject = `📋 New Leave Request from ${employeeName}`;

  const body = `
Dear ${employerName},

${employeeName} has submitted a leave request that requires your approval.

📋 Leave Details:
- Employee: ${employeeName}
- Type: ${leaveType}
- Dates: ${startDate} to ${endDate}
- Duration: ${totalDays} day(s)
${reason ? `- Reason: ${reason}` : ''}

Please log in to review and approve/reject this request.

Best regards,
HR System
`;

  return queueNotification({
    recipientEmail: employerEmail,
    type: 'new_leave_request',
    subject,
    body,
    metadata: { employeeName, leaveType, startDate, endDate, totalDays },
  });
}

/**
 * Queue an expense claim status notification
 */
export async function notifyExpenseStatus(
  employeeEmail: string,
  employeeName: string,
  expenseDescription: string,
  amount: number,
  currency: string,
  status: 'approved' | 'rejected' | 'paid',
  reviewerName: string,
  reviewNotes?: string
) {
  const statusEmoji = {
    approved: '✅',
    rejected: '❌',
    paid: '💰',
  }[status];

  const subject = `Expense Claim ${status.charAt(0).toUpperCase() + status.slice(1)} ${statusEmoji}`;

  const body = `
Dear ${employeeName},

Your expense claim has been ${status}.

📋 Expense Details:
- Description: ${expenseDescription}
- Amount: ${currency} ${amount.toFixed(2)}
- Status: ${status.charAt(0).toUpperCase() + status.slice(1)} ${statusEmoji}
- Reviewed by: ${reviewerName}
${reviewNotes ? `\n📝 Notes: ${reviewNotes}` : ''}

${status === 'paid' ? 'The amount has been processed for payment.' : ''}

Best regards,
HR System
`;

  return queueNotification({
    recipientEmail: employeeEmail,
    type: 'expense_status',
    subject,
    body,
    metadata: { expenseDescription, amount, currency, status },
  });
}

/**
 * Queue a performance review notification
 */
export async function notifyPerformanceReview(
  employeeEmail: string,
  employeeName: string,
  reviewType: string,
  periodStart: string,
  periodEnd: string,
  action: 'created' | 'submitted' | 'acknowledged'
) {
  const actionText = {
    created: 'A new performance review has been created for you',
    submitted: 'Your performance review has been submitted',
    acknowledged: 'You have acknowledged your performance review',
  }[action];

  const subject = `Performance Review - ${reviewType.charAt(0).toUpperCase() + reviewType.slice(1)}`;

  const body = `
Dear ${employeeName},

${actionText}.

📋 Review Details:
- Type: ${reviewType.charAt(0).toUpperCase() + reviewType.slice(1)} Review
- Period: ${periodStart} to ${periodEnd}

${action === 'created' ? 'Please log in to view your review and provide your feedback.' : ''}
${action === 'submitted' ? 'Please log in to acknowledge your review.' : ''}

Best regards,
HR System
`;

  return queueNotification({
    recipientEmail: employeeEmail,
    type: 'performance_review',
    subject,
    body,
    metadata: { reviewType, periodStart, periodEnd, action },
  });
}

