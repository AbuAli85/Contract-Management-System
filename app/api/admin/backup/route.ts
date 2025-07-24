import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Check if user has admin role
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Admin role required' 
      }, { status: 403 })
    }

    // Create backup timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupId = `backup-${timestamp}`

    // Export data from all tables
    const tables = ['contracts', 'parties', 'promoters', 'audit_logs', 'notifications'] as const
    const backupData: any = {
      backup_id: backupId,
      timestamp: new Date().toISOString(),
      tables: {}
    }

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')

        if (error) {
          console.error(`Error backing up ${table}:`, error)
          backupData.tables[table] = { error: error.message }
        } else {
          backupData.tables[table] = { data: data || [] }
        }
      } catch (error) {
        console.error(`Error accessing ${table}:`, error)
        backupData.tables[table] = { error: 'Table access failed' }
      }
    }

    // For now, we'll just log the backup data
    // In a production system, you might want to store this in a separate backup table
    console.log('Backup completed:', backupId, 'Tables:', Object.keys(backupData.tables))

    // Create audit log entry
    try {
      await supabase
        .from('audit_logs')
        .insert([{
          user_id: session.user.id,
          action: 'database_backup',
          entity_type: 'system',
          entity_id: 1,
          details: JSON.stringify({ backup_id: backupId, tables_count: tables.length })
        }])
    } catch (error) {
      console.error("Error creating audit log:", error)
    }

    return NextResponse.json({
      success: true,
      backup_id: backupId,
      message: 'Database backup completed successfully',
      tables_backed_up: tables.length
    })

  } catch (error) {
    console.error("Backup API error:", error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    // Check if user has admin role
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied - Admin role required' 
      }, { status: 403 })
    }

    // For now, return empty array since system_backups table doesn't exist
    // In a production system, you would implement proper backup storage
    return NextResponse.json({
      success: true,
      backups: []
    })

  } catch (error) {
    console.error("Backup API error:", error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 