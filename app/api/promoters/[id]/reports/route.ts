import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { GeneratedReport } from '@/lib/types'

const reportGenerationSchema = z.object({
  template_id: z.string().optional(),
  report_name: z.string(),
  parameters: z.record(z.any()).optional(),
})

export async function GET(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id    } = await params;
  const { searchParams } = new URL(req.url)
  const template_id = searchParams.get('template_id')
  
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('generated_reports')
    .select('*')
    .eq('promoter_id', promoter_id)
    .order('generated_at', { ascending: false })
  
  if (template_id) {
    query = query.eq('template_id', template_id)
  }
  
  const { data, error } = await query
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id  } = await params;const body = await req.json()
  const parsed = reportGenerationSchema.safeParse(body)
  
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  
  const { template_id, report_name, parameters } = parsed.data
  
  const supabase = getSupabaseAdmin()
  
  // Generate report data based on template or default metrics
  let reportData = {}
  
  if (template_id) {
    // Get template and generate based on it
    const { data: template } = await supabase
      .from('report_templates')
      .select('*')
      .eq('id', template_id)
      .single()
    
    if (template) {
      reportData = await generateReportFromTemplate(template, promoter_id, parameters)
    }
  } else {
    // Generate default performance report
    reportData = await generateDefaultPerformanceReport(promoter_id, parameters)
  }
  
  // Create report record
  const { data, error } = await supabase
    .from('generated_reports')
    .insert([{ 
      promoter_id, 
      template_id, 
      report_name, 
      report_data: reportData,
      parameters 
    }])
    .select()
    .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req, { params }: { params: Promise<{ id: string }> }) {
  const { id: promoter_id    } = await params;
  const { id } = await req.json()
  
  if (!id) return NextResponse.json({ error: 'Report ID required' }, { status: 400 })
  
  const supabase = getSupabaseAdmin()
  const { error } = await supabase
    .from('generated_reports')
    .delete()
    .eq('id', id)
    .eq('promoter_id', promoter_id)
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Helper function to generate report from template
async function generateReportFromTemplate(template: any, promoter_id: string, parameters: any) {
  const supabase = getSupabaseAdmin()
  
  switch (template.template_type) {
    case 'performance':
      return await generatePerformanceReport(promoter_id, parameters)
    case 'attendance':
      return await generateAttendanceReport(promoter_id, parameters)
    case 'contract':
      return await generateContractReport(promoter_id, parameters)
    default:
      return { message: 'Template type not supported' }
  }
}

// Helper function to generate default performance report
async function generateDefaultPerformanceReport(promoter_id: string, parameters: any) {
  const supabase = getSupabaseAdmin()
  
  // Get attendance metrics
  const { data: attendanceData } = await supabase
    .from('promoter_attendance_logs')
    .select('*')
    .eq('promoter_id', promoter_id)
    .gte('date', parameters?.start_date || '2024-01-01')
    .lte('date', parameters?.end_date || new Date().toISOString().split('T')[0])
  
  // Calculate attendance rate
  const totalDays = attendanceData?.length || 0
  const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0
  
  // Get leave requests
  const { data: leaveData } = await supabase
    .from('promoter_leave_requests')
    .select('*')
    .eq('promoter_id', promoter_id)
    .eq('status', 'approved')
  
  return {
    attendance_rate: attendanceRate,
    total_days: totalDays,
    present_days: presentDays,
    leave_days: leaveData?.length || 0,
    period: {
      start: parameters?.start_date || '2024-01-01',
      end: parameters?.end_date || new Date().toISOString().split('T')[0]
    }
  }
}

// Helper function to generate performance report
async function generatePerformanceReport(promoter_id: string, parameters: any) {
  const supabase = getSupabaseAdmin()
  
  // Get performance metrics
  const { data: metrics } = await supabase
    .from('promoter_performance_metrics')
    .select('*')
    .eq('promoter_id', promoter_id)
    .gte('period_start', parameters?.start_date || '2024-01-01')
    .lte('period_end', parameters?.end_date || new Date().toISOString().split('T')[0])
  
  return {
    metrics: metrics || [],
    summary: {
      total_metrics: metrics?.length || 0,
      average_value: metrics?.reduce((acc, m) => acc + m.value, 0) / (metrics?.length || 1)
    }
  }
}

// Helper function to generate attendance report
async function generateAttendanceReport(promoter_id: string, parameters: any) {
  const supabase = getSupabaseAdmin()
  
  // Get attendance logs
  const { data: attendanceData } = await supabase
    .from('promoter_attendance_logs')
    .select('*')
    .eq('promoter_id', promoter_id)
    .gte('date', parameters?.start_date || '2024-01-01')
    .lte('date', parameters?.end_date || new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
  
  // Get leave requests
  const { data: leaveData } = await supabase
    .from('promoter_leave_requests')
    .select('*')
    .eq('promoter_id', promoter_id)
    .gte('start_date', parameters?.start_date || '2024-01-01')
    .lte('end_date', parameters?.end_date || new Date().toISOString().split('T')[0])
  
  return {
    attendance_logs: attendanceData || [],
    leave_requests: leaveData || [],
    summary: {
      total_days: attendanceData?.length || 0,
      present_days: attendanceData?.filter(a => a.status === 'present').length || 0,
      absent_days: attendanceData?.filter(a => a.status === 'absent').length || 0,
      late_days: attendanceData?.filter(a => a.status === 'late').length || 0,
      leave_days: leaveData?.length || 0
    }
  }
}

// Helper function to generate contract report
async function generateContractReport(promoter_id: string, parameters: any) {
  const supabase = getSupabaseAdmin()
  
  // Get contracts (assuming there's a contracts table with promoter_id)
  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('promoter_id', promoter_id)
    .gte('created_at', parameters?.start_date || '2024-01-01')
    .lte('created_at', parameters?.end_date || new Date().toISOString())
  
  return {
    contracts: contracts || [],
    summary: {
      total_contracts: contracts?.length || 0,
      active_contracts: contracts?.filter(c => c.status === 'active').length || 0,
      completed_contracts: contracts?.filter(c => c.status === 'completed').length || 0
    }
  }
}