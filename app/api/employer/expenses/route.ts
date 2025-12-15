import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get all team expenses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get team members
    const { data: teamMembers } = await supabase
      .from('employer_employees')
      .select('id')
      .eq('employer_id', user.id);

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        expenses: [],
        stats: { pending: 0, approved: 0, paid: 0, total: 0 },
      });
    }

    const employerEmployeeIds = teamMembers.map(m => m.id);

    // Get expenses
    let query = (supabaseAdmin.from('employee_expenses') as any)
      .select(`
        *,
        category:category_id (
          id,
          name
        ),
        employer_employee:employer_employee_id (
          employee:employee_id (
            full_name,
            email,
            avatar_url
          ),
          job_title,
          department
        ),
        reviewed_by_user:reviewed_by (
          full_name
        )
      `)
      .in('employer_employee_id', employerEmployeeIds)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    // Calculate stats
    const allExpenses = expenses || [];
    const stats = {
      pending: allExpenses.filter((e: any) => e.status === 'pending').reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0),
      approved: allExpenses.filter((e: any) => e.status === 'approved').reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0),
      paid: allExpenses.filter((e: any) => e.status === 'paid').reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0),
      total: allExpenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0),
      pendingCount: allExpenses.filter((e: any) => e.status === 'pending').length,
      approvedCount: allExpenses.filter((e: any) => e.status === 'approved').length,
    };

    return NextResponse.json({
      success: true,
      expenses: allExpenses,
      stats,
    });
  } catch (error) {
    console.error('Error in employer expenses GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

