import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user and verify they're admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userIds, newRole } = await request.json()

    if (!userIds || !Array.isArray(userIds) || !newRole) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Update roles in profiles table
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .in('id', userIds)
      .select()

    if (error) {
      console.error('Error updating user roles:', error)
      return NextResponse.json({ error: 'Failed to update roles' }, { status: 500 })
    }

    console.log(`✅ Updated ${data.length} user roles to ${newRole}`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${data.length} user roles to ${newRole}`,
      updated: data
    })

  } catch (error) {
    console.error('Role update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
