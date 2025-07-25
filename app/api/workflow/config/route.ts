import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const configType = searchParams.get('type')
    const configName = searchParams.get('name')

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabase
      .from('workflow_config')
      .select('*')
      .eq('is_active', true)

    // Filter by config type if provided
    if (configType) {
      query = query.eq('config_type', configType)
    }

    // Filter by config name if provided
    if (configName) {
      query = query.eq('config_name', configName)
    }

    const { data: configs, error: configError } = await query

    if (configError) {
      console.error('Error fetching workflow config:', configError)
      return NextResponse.json({ error: 'Failed to fetch workflow configuration' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      configs: configs || []
    })

  } catch (error) {
    console.error('Error in workflow config GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { config_name, config_type, config_data } = body

    // Validate required fields
    if (!config_name || !config_type || !config_data) {
      return NextResponse.json({ 
        error: 'Missing required fields: config_name, config_type, config_data' 
      }, { status: 400 })
    }

    // Validate config type
    const validConfigTypes = ['routing_rules', 'escalation_rules', 'notification_rules']
    if (!validConfigTypes.includes(config_type)) {
      return NextResponse.json({ 
        error: `Invalid config_type. Must be one of: ${validConfigTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can manage workflow configuration' }, { status: 403 })
    }

    // Check if config with same name already exists
    const { data: existingConfig } = await supabase
      .from('workflow_config')
      .select('id')
      .eq('config_name', config_name)
      .single()

    if (existingConfig) {
      return NextResponse.json({ 
        error: 'Configuration with this name already exists. Use PUT to update.' 
      }, { status: 409 })
    }

    // Create new configuration
    const { data: newConfig, error: createError } = await supabase
      .from('workflow_config')
      .insert({
        workflow_name: config_name,
        config_type,
        config_data,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating workflow config:', createError)
      return NextResponse.json({ error: 'Failed to create workflow configuration' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      config: newConfig,
      message: 'Workflow configuration created successfully'
    })

  } catch (error) {
    console.error('Error in workflow config POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { config_name, config_data } = body

    // Validate required fields
    if (!config_name || !config_data) {
      return NextResponse.json({ 
        error: 'Missing required fields: config_name, config_data' 
      }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can manage workflow configuration' }, { status: 403 })
    }

    // Update configuration
    const { data: updatedConfig, error: updateError } = await supabase
      .from('workflow_config')
      .update({
        description: config_data,
        updated_at: new Date().toISOString()
      })
      .eq('workflow_name', config_name)
      .eq('is_active', true)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating workflow config:', updateError)
      return NextResponse.json({ error: 'Failed to update workflow configuration' }, { status: 500 })
    }

    if (!updatedConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      config: updatedConfig,
      message: 'Workflow configuration updated successfully'
    })

  } catch (error) {
    console.error('Error in workflow config PUT:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const configName = searchParams.get('name')

    if (!configName) {
      return NextResponse.json({ error: 'config_name parameter is required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can manage workflow configuration' }, { status: 403 })
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('workflow_config')
      .update({ is_active: false })
      .eq('config_name', configName)

    if (deleteError) {
      console.error('Error deleting workflow config:', deleteError)
      return NextResponse.json({ error: 'Failed to delete workflow configuration' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow configuration deleted successfully'
    })

  } catch (error) {
    console.error('Error in workflow config DELETE:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 