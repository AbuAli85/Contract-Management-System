import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test both tables
    let usersTableExists = false
    let profilesTableExists = false
    let usersData = null
    let profilesData = null
    
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5)
      
      if (!usersError) {
        usersTableExists = true
        usersData = users
      }
    } catch (error) {
      console.log('Users table not accessible')
    }
    
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5)
      
      if (!profilesError) {
        profilesTableExists = true
        profilesData = profiles
      }
    } catch (error) {
      console.log('Profiles table not accessible')
    }

    return NextResponse.json({
      success: true,
      currentUser: {
        id: user.id,
        email: user.email
      },
      tables: {
        users: {
          exists: usersTableExists,
          data: usersData
        },
        profiles: {
          exists: profilesTableExists,
          data: profilesData
        }
      },
      message: 'User management system test completed'
    })
  } catch (error) {
    console.error('Test users error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 