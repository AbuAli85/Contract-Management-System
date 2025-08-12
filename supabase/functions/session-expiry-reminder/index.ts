import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface SessionData {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

interface UserData {
  id: string;
  email: string;
  role: string;
  status: string;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current timestamp
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    console.log(`🔔 Session expiry reminder check at ${now.toISOString()}`);
    console.log(
      `🔔 Looking for sessions expiring before ${tomorrow.toISOString()}`
    );

    // Query for sessions expiring in the next 24 hours
    const { data: expiringSessions, error: sessionError } = await supabase
      .from('auth_sessions')
      .select(
        `
        id,
        user_id,
        expires_at,
        created_at
      `
      )
      .lt('expires_at', tomorrow.toISOString())
      .gt('expires_at', now.toISOString());

    if (sessionError) {
      console.error('❌ Error fetching expiring sessions:', sessionError);
      throw new Error(
        `Failed to fetch expiring sessions: ${sessionError.message}`
      );
    }

    console.log(
      `🔔 Found ${expiringSessions?.length || 0} sessions expiring soon`
    );

    if (!expiringSessions || expiringSessions.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No sessions expiring in the next 24 hours',
          count: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get unique user IDs
    const userIds = [
      ...new Set(expiringSessions.map(session => session.user_id)),
    ];

    // Fetch user data for these sessions
    const { data: users, error: userError } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        role,
        status
      `
      )
      .in('id', userIds)
      .eq('status', 'active');

    if (userError) {
      console.error('❌ Error fetching users:', userError);
      throw new Error(`Failed to fetch users: ${userError.message}`);
    }

    console.log(
      `🔔 Found ${users?.length || 0} active users with expiring sessions`
    );

    // Create a map of user data for quick lookup
    const userMap = new Map<string, UserData>();
    users?.forEach(user => userMap.set(user.id, user));

    // Send email reminders
    const emailPromises = expiringSessions.map(async session => {
      const user = userMap.get(session.user_id);

      if (!user) {
        console.log(
          `⚠️ User ${session.user_id} not found or inactive, skipping email`
        );
        return { success: false, reason: 'user_not_found' };
      }

      try {
        // Calculate time until expiry
        const expiryTime = new Date(session.expires_at);
        const timeUntilExpiry = expiryTime.getTime() - now.getTime();
        const hoursUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60 * 60));

        // Prepare email content
        const emailContent = {
          to: user.email,
          subject: 'Your Session is Expiring Soon',
          html: generateEmailHTML(user, hoursUntilExpiry, session.expires_at),
          text: generateEmailText(user, hoursUntilExpiry, session.expires_at),
        };

        // Send email using Supabase's built-in email service
        const { error: emailError } = await supabase.auth.admin.sendRawEmail({
          to: user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        if (emailError) {
          console.error(
            `❌ Failed to send email to ${user.email}:`,
            emailError
          );
          return {
            success: false,
            reason: 'email_failed',
            error: emailError.message,
          };
        }

        console.log(
          `✅ Email reminder sent to ${user.email} for session expiring in ${hoursUntilExpiry} hours`
        );

        // Log the reminder in the database
        await logReminderSent(supabase, session.id, user.id, hoursUntilExpiry);

        return { success: true, user_id: user.id, email: user.email };
      } catch (error) {
        console.error(
          `❌ Error processing reminder for user ${user.id}:`,
          error
        );
        return {
          success: false,
          reason: 'processing_error',
          error: error.message,
        };
      }
    });

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);

    // Count successes and failures
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(
      `📧 Email reminders sent: ${successful.length} successful, ${failed.length} failed`
    );

    return new Response(
      JSON.stringify({
        message: 'Session expiry reminders processed',
        total_sessions: expiringSessions.length,
        successful_emails: successful.length,
        failed_emails: failed.length,
        results: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Session expiry reminder function error:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateEmailHTML(
  user: UserData,
  hoursUntilExpiry: number,
  expiryTime: string
): string {
  const expiryDate = new Date(expiryTime).toLocaleString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Session Expiry Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Session Expiry Reminder</h1>
        </div>
        
        <div class="content">
          <p>Hello,</p>
          
          <p>This is a friendly reminder that your session in the Contract Management System will expire in <strong>${hoursUntilExpiry} hours</strong>.</p>
          
          <div class="warning">
            <strong>Session Details:</strong><br>
            • Expires: ${expiryDate}<br>
            • User: ${user.email}<br>
            • Role: ${user.role}
          </div>
          
          <p>To maintain uninterrupted access to your account, please sign in again before your session expires.</p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('FRONTEND_URL') || 'https://your-app.com'}/en/login" class="button">
              Sign In Now
            </a>
          </p>
          
          <p><strong>What happens when my session expires?</strong></p>
          <ul>
            <li>You'll be automatically signed out</li>
            <li>You'll need to sign in again to access your account</li>
            <li>Any unsaved work will be lost</li>
          </ul>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from the Contract Management System.</p>
          <p>If you didn't expect this email, please contact support immediately.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateEmailText(
  user: UserData,
  hoursUntilExpiry: number,
  expiryTime: string
): string {
  const expiryDate = new Date(expiryTime).toLocaleString();

  return `
Session Expiry Reminder

Hello,

This is a friendly reminder that your session in the Contract Management System will expire in ${hoursUntilExpiry} hours.

Session Details:
- Expires: ${expiryDate}
- User: ${user.email}
- Role: ${user.role}

To maintain uninterrupted access to your account, please sign in again before your session expires.

Sign in here: ${Deno.env.get('FRONTEND_URL') || 'https://your-app.com'}/en/login

What happens when my session expires?
- You'll be automatically signed out
- You'll need to sign in again to access your account
- Any unsaved work will be lost

If you have any questions or need assistance, please don't hesitate to contact our support team.

---
This is an automated message from the Contract Management System.
If you didn't expect this email, please contact support immediately.
  `;
}

async function logReminderSent(
  supabase: any,
  sessionId: string,
  userId: string,
  hoursUntilExpiry: number
) {
  try {
    // Log the reminder in a dedicated table (create if doesn't exist)
    await supabase.from('session_reminders').insert({
      session_id: sessionId,
      user_id: userId,
      hours_until_expiry: hoursUntilExpiry,
      sent_at: new Date().toISOString(),
      status: 'sent',
    });
  } catch (error) {
    // If the table doesn't exist, just log to console
    console.log(`📝 Reminder logged for session ${sessionId}, user ${userId}`);
  }
}
