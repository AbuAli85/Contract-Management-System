import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get request body
    const { userId, role } = await req.json()

    if (!userId || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or role' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate role
    const validRoles = ['user', 'client', 'provider', 'manager', 'admin']
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update user's custom claims
    const { data, error } = await supabaseClient.auth.admin.updateUserById(
      userId,
      {
        user_metadata: { role },
        app_metadata: { role }
      }
    )

    if (error) {
      console.error('Error updating user claims:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update user claims' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the security event
    await supabaseClient
      .from('security_audit_log')
      .insert({
        event_type: 'custom_claims_updated',
        user_id: userId,
        metadata: { 
          old_role: null, 
          new_role: role,
          updated_at: new Date().toISOString()
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User claims updated successfully',
        user: {
          id: data.user.id,
          role: data.user.user_metadata?.role
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
