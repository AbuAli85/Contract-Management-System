import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    supabase: {},
    database: {},
    errors: []
  }

  try {
    console.log('=== DEBUG SETUP ADMIN START ===')

    // Check environment variables
    debugInfo.environment = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
    }

    console.log('Environment check:', debugInfo.environment)

    // Test Supabase client creation
    try {
      const supabase = await createClient()
      debugInfo.supabase.clientCreated = true
      console.log('✅ Supabase client created successfully')

      // Test authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        debugInfo.supabase.authError = {
          message: authError.message,
          status: authError.status,
          name: authError.name
        }
        debugInfo.errors.push(`Auth error: ${authError.message}`)
        console.error('❌ Auth error:', authError)
      } else if (!user) {
        debugInfo.supabase.user = null
        debugInfo.errors.push('No authenticated user found')
        console.log('⚠️ No authenticated user')
      } else {
        debugInfo.supabase.user = {
          id: user.id,
          email: user.email,
          hasEmail: !!user.email
        }
        console.log('✅ User authenticated:', { id: user.id, email: user.email })

        // Test database tables
        debugInfo.database = {
          tables: {}
        }

        // Test users table
        try {
          console.log('🔄 Testing users table...')
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email, role')
            .limit(1)
          
          if (usersError) {
            debugInfo.database.tables.users = {
              accessible: false,
              error: {
                code: usersError.code,
                message: usersError.message,
                details: usersError.details,
                hint: usersError.hint
              }
            }
            debugInfo.errors.push(`Users table error: ${usersError.message}`)
            console.log('❌ Users table error:', usersError)
          } else {
            debugInfo.database.tables.users = {
              accessible: true,
              sampleData: usersData,
              count: usersData?.length || 0
            }
            console.log('✅ Users table accessible, sample data:', usersData)
          }
        } catch (usersException) {
          debugInfo.database.tables.users = {
            accessible: false,
            exception: usersException instanceof Error ? usersException.message : 'Unknown exception'
          }
          debugInfo.errors.push(`Users table exception: ${usersException}`)
          console.log('❌ Users table exception:', usersException)
        }

        // Test profiles table
        try {
          console.log('🔄 Testing profiles table...')
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, role')
            .limit(1)
          
          if (profilesError) {
            debugInfo.database.tables.profiles = {
              accessible: false,
              error: {
                code: profilesError.code,
                message: profilesError.message,
                details: profilesError.details,
                hint: profilesError.hint
              }
            }
            debugInfo.errors.push(`Profiles table error: ${profilesError.message}`)
            console.log('❌ Profiles table error:', profilesError)
          } else {
            debugInfo.database.tables.profiles = {
              accessible: true,
              sampleData: profilesData,
              count: profilesData?.length || 0
            }
            console.log('✅ Profiles table accessible, sample data:', profilesData)
          }
        } catch (profilesException) {
          debugInfo.database.tables.profiles = {
            accessible: false,
            exception: profilesException instanceof Error ? profilesException.message : 'Unknown exception'
          }
          debugInfo.errors.push(`Profiles table exception: ${profilesException}`)
          console.log('❌ Profiles table exception:', profilesException)
        }

        // Test app_users table
        try {
          console.log('🔄 Testing app_users table...')
          const { data: appUsersData, error: appUsersError } = await supabase
            .from('app_users')
            .select('id, email, role')
            .limit(1)
          
          if (appUsersError) {
            debugInfo.database.tables.app_users = {
              accessible: false,
              error: {
                code: appUsersError.code,
                message: appUsersError.message,
                details: appUsersError.details,
                hint: appUsersError.hint
              }
            }
            debugInfo.errors.push(`App_users table error: ${appUsersError.message}`)
            console.log('❌ App_users table error:', appUsersError)
          } else {
            debugInfo.database.tables.app_users = {
              accessible: true,
              sampleData: appUsersData,
              count: appUsersData?.length || 0
            }
            console.log('✅ App_users table accessible, sample data:', appUsersData)
          }
        } catch (appUsersException) {
          debugInfo.database.tables.app_users = {
            accessible: false,
            exception: appUsersException instanceof Error ? appUsersException.message : 'Unknown exception'
          }
          debugInfo.errors.push(`App_users table exception: ${appUsersException}`)
          console.log('❌ App_users table exception:', appUsersException)
        }

        // Test user creation (dry run)
        if (user.email) {
          console.log('🔄 Testing user creation (dry run)...')
          try {
            const { data: testInsert, error: insertError } = await supabase
              .from('users')
              .insert({
                email: `test-${Date.now()}@example.com`,
                role: 'admin',
                created_at: new Date().toISOString()
              })
              .select()
              .single()
            
            if (insertError) {
              debugInfo.database.insertTest = {
                success: false,
                error: {
                  code: insertError.code,
                  message: insertError.message,
                  details: insertError.details,
                  hint: insertError.hint
                }
              }
              debugInfo.errors.push(`Insert test error: ${insertError.message}`)
              console.log('❌ Insert test error:', insertError)
            } else {
              debugInfo.database.insertTest = {
                success: true,
                testUser: testInsert
              }
              console.log('✅ Insert test successful:', testInsert)

              // Clean up test user
              try {
                await supabase
                  .from('users')
                  .delete()
                  .eq('id', testInsert.id)
                console.log('✅ Test user cleaned up')
              } catch (cleanupError) {
                console.log('⚠️ Test user cleanup failed:', cleanupError)
              }
            }
          } catch (insertException) {
            debugInfo.database.insertTest = {
              success: false,
              exception: insertException instanceof Error ? insertException.message : 'Unknown exception'
            }
            debugInfo.errors.push(`Insert test exception: ${insertException}`)
            console.log('❌ Insert test exception:', insertException)
          }
        }
      }
    } catch (clientError) {
      debugInfo.supabase.clientError = {
        message: clientError instanceof Error ? clientError.message : 'Unknown error',
        name: clientError instanceof Error ? clientError.name : 'Unknown'
      }
      debugInfo.errors.push(`Client creation error: ${clientError}`)
      console.error('❌ Supabase client creation failed:', clientError)
    }

    console.log('=== DEBUG SETUP ADMIN COMPLETE ===')
    
    return NextResponse.json({
      success: true,
      debugInfo,
      summary: {
        totalErrors: debugInfo.errors.length,
        hasWorkingDatabase: Object.values(debugInfo.database.tables || {}).some((table: any) => table.accessible),
        hasAuthenticatedUser: !!debugInfo.supabase.user,
        hasValidEnvironment: debugInfo.environment.hasSupabaseUrl && debugInfo.environment.hasSupabaseAnonKey
      }
    })

  } catch (error) {
    console.error('=== DEBUG SETUP ADMIN ERROR ===')
    console.error('Unexpected error:', error)
    
    debugInfo.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      debugInfo,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 