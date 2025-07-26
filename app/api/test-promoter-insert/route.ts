import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Test data for promoter insert - matching the actual database schema
    const testData = {
      name_en: 'Test Promoter',
      name_ar: 'مروج تجريبي',
      id_card_number: 'TEST123456',
      id_card_url: null,
      passport_url: null,
      status: 'active',
      contract_valid_until: null,
      id_card_expiry_date: null,
      passport_expiry_date: null,
      notify_days_before_id_expiry: 30,
      notify_days_before_passport_expiry: 90,
      notify_days_before_contract_expiry: 30,
      notes: null,
      passport_number: null,
      mobile_number: '1234567890',
      profile_picture_url: null,
      nationality: null,
      created_at: new Date().toISOString()
    }

    // Attempt to insert test data
    const { data, error } = await supabase
      .from('promoters')
      .insert([testData])
      .select()

    if (error) {
      console.error('Test promoter insert error:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 400 })
    }

    // Clean up - delete the test record
    if (data && data.length > 0) {
      await supabase
        .from('promoters')
        .delete()
        .eq('id', data[0].id)
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection and insert test successful'
    })

  } catch (error) {
    console.error('Test promoter insert error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 