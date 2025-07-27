import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Please log in' 
      }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { email, fullName } = body

    if (!email || !fullName) {
      return NextResponse.json({
        success: false,
        error: 'Email and fullName are required'
      }, { status: 400 })
    }

    console.log('🔧 Testing database trigger with:', { email, fullName })

    // Test creating a user profile to trigger any database triggers
    const testProfile = {
      id: session.user.id, // Use current user's ID for testing
      email: email,
      full_name: fullName,
      role: 'user',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Try to insert/update the test profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(testProfile, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile trigger test error:', profileError)
      return NextResponse.json({
        success: false,
        error: 'Failed to test profile trigger',
        details: profileError.message
      }, { status: 500 })
    }

    // Test user activity log trigger
    const testActivity = {
      user_id: session.user.id,
      action: 'test_trigger',
      resource_type: 'test',
      resource_id: 'trigger-test',
      details: {
        test_email: email,
        test_name: fullName,
        timestamp: new Date().toISOString()
      }
    }

    const { data: activity, error: activityError } = await supabase
      .from('user_activity_log')
      .insert(testActivity)
      .select()
      .single()

    if (activityError) {
      console.error('❌ Activity log trigger test error:', activityError)
      return NextResponse.json({
        success: false,
        error: 'Failed to test activity log trigger',
        details: activityError.message
      }, { status: 500 })
    }

    // Test contract creation trigger (if contracts table exists)
    try {
      const testContract = {
        contract_number: `TEST-${Date.now()}`,
        first_party_id: null,
        second_party_id: null,
        promoter_id: null,
        contract_start_date: new Date().toISOString(),
        contract_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        email: email,
        job_title: 'Test Position',
        work_location: 'Test Location',
        department: 'Test Department',
        contract_type: 'test',
        currency: 'OMR',
        basic_salary: 1000,
        status: 'draft',
        approval_status: 'draft',
        created_by: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert(testContract)
        .select()
        .single()

      if (contractError) {
        console.log('⚠️ Contract trigger test skipped (table may not exist):', contractError.message)
      } else {
        console.log('✅ Contract trigger test successful:', contract.id)
      }
    } catch (contractTestError) {
      console.log('⚠️ Contract trigger test skipped:', contractTestError)
    }

    const result = {
      success: true,
      data: {
        profile: profile,
        activity: activity,
        testData: {
          email,
          fullName,
          timestamp: new Date().toISOString()
        }
      },
      message: 'Database trigger test completed successfully'
    }

    console.log('✅ Trigger test result:', {
      profileId: profile?.id,
      activityId: activity?.id,
      testEmail: email
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Test trigger error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 