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

    console.log('🧪 Testing promoter insert for user:', user.id)

    // Test data
    const testPromoterData = {
      name_en: 'Test Promoter',
      name_ar: 'مروج تجريبي',
      email: 'test@example.com',
      mobile_number: '12345678',
      id_card_number: 'TEST123456',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📝 Attempting to insert test promoter:', testPromoterData)

    // Try to insert a test promoter
    const { data: insertedPromoter, error: insertError } = await supabase
      .from('promoters')
      .insert([testPromoterData])
      .select()

    if (insertError) {
      console.error('❌ Insert error:', insertError)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to insert promoter',
        details: insertError 
      }, { status: 500 })
    }

    console.log('✅ Test promoter inserted successfully:', insertedPromoter)

    // Clean up - delete the test promoter
    if (insertedPromoter && insertedPromoter.length > 0) {
      const { error: deleteError } = await supabase
        .from('promoters')
        .delete()
        .eq('id', insertedPromoter[0].id)

      if (deleteError) {
        console.warn('⚠️ Failed to delete test promoter:', deleteError)
      } else {
        console.log('🧹 Test promoter deleted successfully')
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Promoter insert test successful',
      insertedPromoter
    })

  } catch (error) {
    console.error('Error in POST /api/test-promoter-insert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 