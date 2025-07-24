import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST() {
  try {
    const supabase = createClient()
    
    // Create profiles table using SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT,
          role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
          full_name TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
        CREATE POLICY "Users can view their own profile" ON public.profiles
          FOR SELECT USING (auth.uid() = id);
        
        DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
        CREATE POLICY "Users can update their own profile" ON public.profiles
          FOR UPDATE USING (auth.uid() = id);
        
        DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
        CREATE POLICY "Admins can view all profiles" ON public.profiles
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
        
        DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
        CREATE POLICY "Admins can update all profiles" ON public.profiles
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `
    })
    
    if (error) {
      console.log('Create table error:', error)
      return NextResponse.json({
        success: false,
        error: 'Could not create profiles table',
        details: error
      })
    }
    
    // Get current user and create profile
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Insert profile for current user
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          role: 'admin', // Default to admin for testing
          full_name: user.user_metadata?.full_name || user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (insertError && !insertError.message.includes('duplicate key')) {
        console.log('Insert profile error:', insertError)
      } else {
        console.log('Profile created/updated for user:', user.id)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profiles table created successfully',
      user: user?.id || null
    })
    
  } catch (error) {
    console.error('Create profiles table error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error
    })
  }
} 