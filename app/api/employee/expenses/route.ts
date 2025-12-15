import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get my expenses
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

    // Get employee link
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select('id')
      .eq('employee_id', user.id)
      .eq('employment_status', 'active')
      .single();

    if (!employeeLink) {
      return NextResponse.json({
        success: true,
        expenses: [],
        stats: { pending: 0, approved: 0, paid: 0, total: 0 },
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Get expenses
    let query = (supabaseAdmin.from('employee_expenses') as any)
      .select(`
        *,
        category:category_id (
          id,
          name
        ),
        reviewed_by_user:reviewed_by (
          full_name
        )
      `)
      .eq('employer_employee_id', employeeLink.id)
      .order('expense_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    // Get expense categories
    const { data: categories } = await (supabaseAdmin.from('expense_categories') as any)
      .select('id, name')
      .eq('is_active', true);

    // Calculate stats
    const allExpenses = expenses || [];
    const stats = {
      pending: allExpenses.filter((e: any) => e.status === 'pending').reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0),
      approved: allExpenses.filter((e: any) => e.status === 'approved').reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0),
      paid: allExpenses.filter((e: any) => e.status === 'paid').reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0),
      total: allExpenses.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0),
      pendingCount: allExpenses.filter((e: any) => e.status === 'pending').length,
    };

    return NextResponse.json({
      success: true,
      expenses: allExpenses,
      categories: categories || [],
      stats,
    });
  } catch (error) {
    console.error('Error in expenses GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit a new expense
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { category_id, expense_date, description, amount, currency, receipt_url } = body;

    if (!expense_date || !description || !amount) {
      return NextResponse.json(
        { error: 'Date, description, and amount are required' },
        { status: 400 }
      );
    }

    // Get employee link
    const { data: employeeLink } = await supabase
      .from('employer_employees')
      .select('id')
      .eq('employee_id', user.id)
      .eq('employment_status', 'active')
      .single();

    if (!employeeLink) {
      return NextResponse.json(
        { error: 'Not assigned to any employer' },
        { status: 404 }
      );
    }

    // Create expense
    const { data: expense, error: createError } = await (supabaseAdmin.from('employee_expenses') as any)
      .insert({
        employer_employee_id: employeeLink.id,
        category_id: category_id || null,
        expense_date,
        description,
        amount: parseFloat(amount),
        currency: currency || 'OMR',
        receipt_url: receipt_url || null,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating expense:', createError);
      return NextResponse.json(
        { error: 'Failed to create expense', details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Expense submitted successfully',
      expense,
    });
  } catch (error) {
    console.error('Error in expenses POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

