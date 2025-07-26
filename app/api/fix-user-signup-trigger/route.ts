import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user to check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can run this migration' }, { status: 403 })
    }

    // SQL to fix the user signup trigger
    const fixTriggerSQL = `
      -- Update the handle_new_user function to create records in both tables
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Insert into profiles table
          INSERT INTO public.profiles (id, email, role, full_name)
          VALUES (
              NEW.id,
              NEW.email,
              'user', -- Default role
              COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
          );
          
          -- Insert into users table with pending status
          INSERT INTO public.users (id, email, full_name, role, status, email_verified)
          VALUES (
              NEW.id,
              NEW.email,
              COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
              'user', -- Default role
              'pending', -- All new users start as pending
              NEW.email_confirmed_at IS NOT NULL -- Set email_verified based on email confirmation
          );
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Ensure the trigger exists
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

      -- Add comment for documentation
      COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user records in both profiles and users tables when a new user signs up. Users start with pending status for approval.';
    `

    // Execute the SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: fixTriggerSQL })

    if (sqlError) {
      console.error('Error fixing user signup trigger:', sqlError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fix user signup trigger',
        details: sqlError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User signup trigger fixed successfully. New signups will now appear in the approval system.'
    })

  } catch (error) {
    console.error('Error in fix-user-signup-trigger:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 