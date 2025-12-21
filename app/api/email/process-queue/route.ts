import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/services/email.service';

export const dynamic = 'force-dynamic';

/**
 * Process pending emails from the email_queue table
 * This endpoint should be called by a cron job or scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization check
    // For now, we'll use a simple secret key check
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.EMAIL_QUEUE_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    
    // Fetch pending emails that are scheduled for now or in the past
    const { data: pendingEmails, error: fetchError } = await (supabaseAdmin
      .from('email_queue') as any)
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .lt('retry_count', 3) // max_retries
      .order('scheduled_for', { ascending: true })
      .limit(50); // Process 50 at a time

    if (fetchError) {
      console.error('Error fetching pending emails:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch pending emails', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No pending emails to process',
      });
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each email
    for (const emailItem of pendingEmails) {
      try {
        // Generate email content based on template
        const emailContent = generateEmailContent(emailItem.template, emailItem.data);
        
        if (!emailContent) {
          throw new Error(`Unknown template: ${emailItem.template}`);
        }

        // Send email using the email service
        const emailResult = await sendEmail({
          to: emailItem.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        if (emailResult.success) {
          // Update email queue status to 'sent'
          await (supabaseAdmin.from('email_queue') as any)
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', emailItem.id);

          results.sent++;
          console.log(`✅ Email sent successfully: ${emailItem.email} (${emailItem.template})`);
        } else {
          throw new Error(emailResult.error || 'Failed to send email');
        }
      } catch (error: any) {
        // Update retry count and status
        const newRetryCount = (emailItem.retry_count || 0) + 1;
        const newStatus = newRetryCount >= (emailItem.max_retries || 3) ? 'failed' : 'pending';
        
        await (supabaseAdmin.from('email_queue') as any)
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            error_message: error.message || 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', emailItem.id);

        results.failed++;
        results.errors.push(`${emailItem.email}: ${error.message}`);
        console.error(`❌ Failed to send email: ${emailItem.email}`, error);
      }
      
      results.processed++;
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      processed: results.processed,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
    });
  } catch (error: any) {
    console.error('Error processing email queue:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate email content based on template and data
 */
function generateEmailContent(template: string, data: any): { subject: string; html: string; text: string } | null {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io';
  
  switch (template) {
    case 'company_invitation':
    case 'company_invitation_new_user': {
      const isNewUser = template === 'company_invitation_new_user';
      const companyName = data?.company_name || 'a company';
      const role = data?.role || 'member';
      const inviterName = data?.inviter_name || 'Admin';
      const message = data?.message || '';
      const invitationUrl = data?.invitation_url || `${baseUrl}/en/settings/company`;
      
      const subject = isNewUser
        ? `You've been invited to join ${companyName} on SmartPro`
        : `You've been added to ${companyName} on SmartPro`;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #2563eb; margin-top: 0;">${isNewUser ? 'Company Invitation' : 'Welcome to the Team!'} 👥</h1>
              <p>Hello,</p>
              <p>${inviterName} has ${isNewUser ? 'invited you to join' : 'added you to'} <strong>${companyName}</strong> as a <strong>${role}</strong>.</p>
              ${message ? `<p style="background-color: #e9ecef; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb; margin: 20px 0;">${message}</p>` : ''}
              ${isNewUser ? `
                <p>To accept this invitation, please sign up for an account using this email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/en/auth/signup" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Sign Up Now</a>
                </div>
                <p>Once you've signed up, you'll automatically have access to ${companyName}.</p>
              ` : `
                <p>You can now access the company dashboard and start collaborating with your team.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${invitationUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Company</a>
                </div>
              `}
              ${data?.department || data?.job_title ? `
                <div style="background-color: #fff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #2563eb;">Your Details:</h3>
                  ${data?.department ? `<p><strong>Department:</strong> ${data.department}</p>` : ''}
                  ${data?.job_title ? `<p><strong>Job Title:</strong> ${data.job_title}</p>` : ''}
                </div>
              ` : ''}
            </div>
            <div style="color: #6c757d; font-size: 12px; text-align: center;">
              <p>This is an automated email from SmartPro Contract Management System.</p>
              <p>If you have any questions, please contact ${inviterName} or your company administrator.</p>
            </div>
          </body>
        </html>
      `;

      const text = `
${subject}

Hello,

${inviterName} has ${isNewUser ? 'invited you to join' : 'added you to'} ${companyName} as a ${role}.

${message ? `\nMessage from ${inviterName}:\n${message}\n` : ''}

${isNewUser ? `
To accept this invitation, please sign up for an account using this email address:
${baseUrl}/en/auth/signup

Once you've signed up, you'll automatically have access to ${companyName}.
` : `
You can now access the company dashboard and start collaborating with your team.
View company: ${invitationUrl}
`}

${data?.department || data?.job_title ? `
Your Details:
${data?.department ? `Department: ${data.department}` : ''}
${data?.job_title ? `Job Title: ${data.job_title}` : ''}
` : ''}

---
This is an automated email from SmartPro Contract Management System.
If you have any questions, please contact ${inviterName} or your company administrator.
      `;

      return { subject, html, text };
    }

    default:
      return null;
  }
}

