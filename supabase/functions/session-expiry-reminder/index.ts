import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SessionExpiryData {
  user_id: string
  email: string
  expires_at: string
  hours_until_expiry: number
}

interface EmailQueueItem {
  user_id: string
  email: string
  template: string
  data: Record<string, any>
  scheduled_for: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get sessions expiring in the next 24 hours
    const { data: expiringSessions, error: sessionsError } = await supabase
      .from('auth.sessions')
      .select(`
        user_id,
        expires_at,
        users!inner(email)
      `)
      .gte('expires_at', new Date().toISOString())
      .lt('expires_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      .eq('notified', false) // Only notify once per session

    if (sessionsError) {
      console.error('Error fetching expiring sessions:', sessionsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expiring sessions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found ${expiringSessions?.length || 0} sessions expiring in the next 24 hours`)

    if (!expiringSessions || expiringSessions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No sessions expiring in the next 24 hours' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Process each expiring session
    const emailQueue: EmailQueueItem[] = []
    const now = new Date()

    for (const session of expiringSessions) {
      const expiresAt = new Date(session.expires_at)
      const hoursUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))

      // Determine email template based on time until expiry
      let template = 'session_expiry_warning'
      let subject = 'Your session will expire soon'
      
      if (hoursUntilExpiry <= 1) {
        template = 'session_expiry_urgent'
        subject = 'Your session expires in less than 1 hour'
      } else if (hoursUntilExpiry <= 6) {
        template = 'session_expiry_soon'
        subject = 'Your session expires soon'
      }

      // Add to email queue
      emailQueue.push({
        user_id: session.user_id,
        email: session.users.email,
        template,
        data: {
          hours_until_expiry: hoursUntilExpiry,
          expires_at: session.expires_at,
          login_url: `${Deno.env.get('SITE_URL')}/auth/login`,
          user_id: session.user_id
        },
        scheduled_for: new Date().toISOString()
      })

      // Mark session as notified to prevent duplicate emails
      await supabase
        .from('auth.sessions')
        .update({ notified: true })
        .eq('user_id', session.user_id)
        .eq('expires_at', session.expires_at)
    }

    // Insert email queue items
    if (emailQueue.length > 0) {
      const { error: queueError } = await supabase
        .from('email_queue')
        .insert(emailQueue)

      if (queueError) {
        console.error('Error inserting email queue items:', queueError)
        return new Response(
          JSON.stringify({ error: 'Failed to queue reminder emails' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log(`Queued ${emailQueue.length} reminder emails`)
    }

    // Log activity for audit trail
    await supabase
      .from('system_activity_log')
      .insert({
        action: 'session_expiry_reminder_sent',
        details: {
          sessions_processed: expiringSessions.length,
          emails_queued: emailQueue.length,
          timestamp: new Date().toISOString()
        },
        created_by: 'system'
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessions_processed: expiringSessions.length,
        emails_queued: emailQueue.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Session expiry reminder function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})