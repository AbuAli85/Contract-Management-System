import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile and active company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    const activeCompanyId = companyId || profile?.active_company_id;

    if (!activeCompanyId) {
      return NextResponse.json(
        { error: 'No active company found' },
        { status: 400 }
      );
    }

    // Get team members for the company
    const { data: teamMembers } = await supabase
      .from('employer_employees')
      .select('id, employee_id, employment_status, created_at')
      .eq('company_id', activeCompanyId)
      .eq('employer_id', user.id);

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        data: {
          overview: {
            totalEmployees: 0,
            activeEmployees: 0,
            onLeave: 0,
            newThisMonth: 0,
            trends: {
              totalEmployees: { value: 0, change: 0 },
              activeEmployees: { value: 0, change: 0 },
              onLeave: { value: 0, change: 0 },
            },
          },
          attendance: {
            today: { present: 0, absent: 0, late: 0, onLeave: 0 },
            monthly: {
              averageHours: 0,
              presentDays: 0,
              absentDays: 0,
              lateCount: 0,
              overtimeHours: 0,
            },
            trends: [],
          },
          tasks: {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            overdue: 0,
            completionRate: 0,
            trends: [],
          },
          targets: {
            total: 0,
            active: 0,
            completed: 0,
            behindSchedule: 0,
            averageProgress: 0,
            achievementRate: 0,
            trends: [],
          },
          performance: {
            topPerformers: [],
            needsAttention: [],
          },
          insights: [],
        },
      });
    }

    const employeeIds = teamMembers.map(tm => tm.id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Overview metrics
    const activeEmployees = teamMembers.filter(
      tm => tm.employment_status === 'active'
    ).length;
    const onLeave = teamMembers.filter(
      tm => tm.employment_status === 'on_leave'
    ).length;
    const newThisMonth = teamMembers.filter(
      tm => new Date(tm.created_at) >= startOfMonth
    ).length;

    // Get last month's data for trends
    const { data: lastMonthTeam } = await supabase
      .from('employer_employees')
      .select('id, employment_status')
      .eq('company_id', activeCompanyId)
      .eq('employer_id', user.id)
      .lt('created_at', startOfMonth.toISOString());

    const lastMonthActive =
      lastMonthTeam?.filter(tm => tm.employment_status === 'active').length ||
      0;
    const lastMonthOnLeave =
      lastMonthTeam?.filter(tm => tm.employment_status === 'on_leave').length ||
      0;
    const lastMonthTotal = lastMonthTeam?.length || 0;

    // Attendance data
    const today = now.toISOString().split('T')[0];
    const { data: todayAttendance } = await supabase
      .from('employee_attendance')
      .select('id, status, check_in_time')
      .in('employer_employee_id', employeeIds)
      .eq('attendance_date', today);

    const todayPresent =
      todayAttendance?.filter(a => a.status === 'present').length || 0;
    const todayAbsent =
      todayAttendance?.filter(a => a.status === 'absent').length || 0;
    const todayLate =
      todayAttendance?.filter(
        a =>
          a.status === 'present' &&
          a.check_in_time &&
          new Date(a.check_in_time).getHours() > 9
      ).length || 0;

    // Monthly attendance
    const { data: monthlyAttendance } = await supabase
      .from('employee_attendance')
      .select('total_hours, status, check_in_time')
      .in('employer_employee_id', employeeIds)
      .gte('attendance_date', startOfMonth.toISOString().split('T')[0]);

    const monthlyPresent =
      monthlyAttendance?.filter(a => a.status === 'present').length || 0;
    const monthlyAbsent =
      monthlyAttendance?.filter(a => a.status === 'absent').length || 0;
    const monthlyLate =
      monthlyAttendance?.filter(
        a =>
          a.status === 'present' &&
          a.check_in_time &&
          new Date(a.check_in_time).getHours() > 9
      ).length || 0;

    const totalHours =
      monthlyAttendance?.reduce((sum, a) => sum + (a.total_hours || 0), 0) || 0;
    const averageHours = monthlyPresent > 0 ? totalHours / monthlyPresent : 0;

    // Tasks data
    const { data: tasks } = await supabase
      .from('employee_tasks')
      .select('id, status, due_date, created_at')
      .in('employer_employee_id', employeeIds);

    const tasksTotal = tasks?.length || 0;
    const tasksPending = tasks?.filter(t => t.status === 'pending').length || 0;
    const tasksInProgress =
      tasks?.filter(t => t.status === 'in_progress').length || 0;
    const tasksCompleted =
      tasks?.filter(t => t.status === 'completed').length || 0;
    const tasksOverdue =
      tasks?.filter(
        t =>
          t.status !== 'completed' && t.due_date && new Date(t.due_date) < now
      ).length || 0;
    const completionRate =
      tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;

    // Targets data
    const { data: targets } = await supabase
      .from('employee_targets')
      .select('id, status, end_date, progress_records(*)')
      .in('employer_employee_id', employeeIds);

    const targetsTotal = targets?.length || 0;
    const targetsActive =
      targets?.filter(t => t.status === 'active').length || 0;
    const targetsCompleted =
      targets?.filter(t => t.status === 'completed').length || 0;
    const targetsBehind =
      targets?.filter(
        t => t.status === 'active' && t.end_date && new Date(t.end_date) < now
      ).length || 0;

    const progressRecords =
      targets?.flatMap(t => t.progress_records || []) || [];
    const averageProgress =
      progressRecords.length > 0
        ? progressRecords.reduce(
            (sum: number, p: any) => sum + (p.progress_percentage || 0),
            0
          ) / progressRecords.length
        : 0;

    const achievementRate =
      targetsTotal > 0 ? (targetsCompleted / targetsTotal) * 100 : 0;

    // Performance insights
    const insights = [];
    if (completionRate < 70) {
      insights.push({
        type: 'warning' as const,
        title: 'Low Task Completion Rate',
        message: `Task completion rate is ${completionRate.toFixed(1)}%. Consider reviewing task assignments.`,
        action: 'View Tasks',
      });
    }
    if (averageHours < 6) {
      insights.push({
        type: 'info' as const,
        title: 'Low Average Hours',
        message: `Average working hours this month is ${averageHours.toFixed(1)}h. Monitor attendance patterns.`,
        action: 'View Attendance',
      });
    }
    if (achievementRate > 80) {
      insights.push({
        type: 'success' as const,
        title: 'High Target Achievement',
        message: `Target achievement rate is ${achievementRate.toFixed(1)}%. Great job!`,
      });
    }

    return NextResponse.json({
      data: {
        overview: {
          totalEmployees: teamMembers.length,
          activeEmployees,
          onLeave,
          newThisMonth,
          trends: {
            totalEmployees: {
              value: teamMembers.length,
              change:
                lastMonthTotal > 0
                  ? ((teamMembers.length - lastMonthTotal) / lastMonthTotal) *
                    100
                  : 0,
            },
            activeEmployees: {
              value: activeEmployees,
              change:
                lastMonthActive > 0
                  ? ((activeEmployees - lastMonthActive) / lastMonthActive) *
                    100
                  : 0,
            },
            onLeave: {
              value: onLeave,
              change:
                lastMonthOnLeave > 0
                  ? ((onLeave - lastMonthOnLeave) / lastMonthOnLeave) * 100
                  : 0,
            },
          },
        },
        attendance: {
          today: {
            present: todayPresent,
            absent: todayAbsent,
            late: todayLate,
            onLeave: 0,
          },
          monthly: {
            averageHours,
            presentDays: monthlyPresent,
            absentDays: monthlyAbsent,
            lateCount: monthlyLate,
            overtimeHours: 0,
          },
          trends: [],
        },
        tasks: {
          total: tasksTotal,
          pending: tasksPending,
          inProgress: tasksInProgress,
          completed: tasksCompleted,
          overdue: tasksOverdue,
          completionRate,
          trends: [],
        },
        targets: {
          total: targetsTotal,
          active: targetsActive,
          completed: targetsCompleted,
          behindSchedule: targetsBehind,
          averageProgress,
          achievementRate,
          trends: [],
        },
        performance: {
          topPerformers: [],
          needsAttention: [],
        },
        insights,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
