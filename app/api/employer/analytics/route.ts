import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET - Get comprehensive analytics for employer
export async function GET(_request: NextRequest) {
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

    // Get current month for date filtering
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    const today = now.toISOString().slice(0, 10);

    // ✅ COMPANY SCOPE: Get user's active company and party_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    // Get company's party_id and resolve employer profile ID
    let partyId: string | null = null;
    let employerProfileId: string | null = null;

    if (profile?.active_company_id) {
      const { createAdminClient } = await import('@/lib/supabase/server');
      let adminClient;
      try {
        adminClient = createAdminClient();
      } catch (e) {
        adminClient = supabase;
      }

      const { data: company } = await adminClient
        .from('companies')
        .select('party_id')
        .eq('id', profile.active_company_id)
        .single();

      if (company?.party_id) {
        partyId = company.party_id;

        // Find the profile ID that corresponds to this party
        const { data: party } = await adminClient
          .from('parties')
          .select('contact_email')
          .eq('id', partyId)
          .single();

        if (party?.contact_email) {
          const { data: employerProfile } = await adminClient
            .from('profiles')
            .select('id')
            .eq('email', party.contact_email)
            .single();

          if (employerProfile) {
            employerProfileId = employerProfile.id;
          }
        }
      }
    }

    // ✅ FIX: Get all team members from both employer_employees and promoters
    const effectiveEmployerId = employerProfileId || user.id;

    // 1. Get team members from employer_employees
    let teamQuery = supabase
      .from('employer_employees')
      .select('id, employee_id, employment_status, hire_date')
      .eq('employer_id', effectiveEmployerId)
      .neq('employee_id', effectiveEmployerId); // ✅ FIX: Exclude employer from their own employee list

    if (profile?.active_company_id) {
      teamQuery = teamQuery.or(
        `company_id.eq.${profile.active_company_id},company_id.is.null`
      );
    }

    const { data: teamMembers, error: teamError } = await teamQuery;

    if (teamError) {
      console.error('Error fetching team:', teamError);
      // Don't return error, continue with empty array
    }

    // ✅ FIX: Also get promoters from parties (they're also employees)
    let promotersFromParty: any[] = [];
    if (partyId) {
      // Get party's contact_email to exclude employer from employee list
      const { data: party } = await supabase
        .from('parties')
        .select('contact_email, type')
        .eq('id', partyId)
        .single();

      const employerEmail = party?.contact_email?.toLowerCase();

      // ✅ FIX: Get all employer parties' emails to filter out employers
      const { data: allEmployerParties } = await supabase
        .from('parties')
        .select('contact_email')
        .eq('type', 'Employer')
        .not('contact_email', 'is', null);

      const employerEmails = new Set(
        (allEmployerParties || [])
          .map((p: any) => p.contact_email?.toLowerCase())
          .filter(Boolean)
      );

      const { data: partyPromoters } = await supabase
        .from('promoters')
        .select('id, status, created_at, email')
        .eq('employer_id', partyId)
        .eq('status', 'active');

      if (partyPromoters) {
        // ✅ FIX: Filter out employer themselves AND any other employer parties
        promotersFromParty = partyPromoters.filter((promoter: any) => {
          const promoterEmail = promoter.email?.toLowerCase();

          // Exclude if promoter email matches current employer email
          if (employerEmail && promoterEmail === employerEmail) {
            return false;
          }

          // Exclude if promoter email matches any employer party (they're an employer, not employee)
          if (promoterEmail && employerEmails.has(promoterEmail)) {
            return false;
          }

          return true;
        });
      }
    }

    // Combine both sources - use employer_employee IDs for attendance/tasks
    const employerEmployeeIds = (teamMembers || []).map(m => m.id);

    // For promoters not in employer_employees, we can't track their attendance/tasks yet
    // But we can count them in team stats
    const _promoterIds = promotersFromParty
      .filter(p => !(teamMembers || []).some(tm => tm.employee_id === p.id))
      .map(p => p.id);

    // ✅ FIX: Team stats - include both employer_employees and promoters
    const teamStats = {
      total: (teamMembers || []).length + promotersFromParty.length,
      active:
        (teamMembers || []).filter(m => m.employment_status === 'active')
          .length + promotersFromParty.length,
      onLeave: (teamMembers || []).filter(
        m => m.employment_status === 'on_leave'
      ).length,
      newThisMonth:
        (teamMembers || []).filter(
          m => m.hire_date && m.hire_date >= startOfMonth
        ).length +
        promotersFromParty.filter(
          p => p.created_at && p.created_at >= startOfMonth
        ).length,
    };

    // 2. Attendance Analytics
    const attendanceStats = {
      todayPresent: 0,
      todayAbsent: 0,
      todayLate: 0,
      monthlyPresent: 0,
      monthlyAbsent: 0,
      monthlyLate: 0,
      averageHours: 0,
    };

    if (employerEmployeeIds.length > 0) {
      // Today's attendance
      const { data: todayAttendance } = await (
        supabaseAdmin.from('employee_attendance') as any
      )
        .select('status, total_hours')
        .in('employer_employee_id', employerEmployeeIds)
        .eq('attendance_date', today);

      if (todayAttendance) {
        attendanceStats.todayPresent = todayAttendance.filter(
          (a: any) => a.status === 'present'
        ).length;
        attendanceStats.todayLate = todayAttendance.filter(
          (a: any) => a.status === 'late'
        ).length;
        attendanceStats.todayAbsent =
          teamStats.active -
          (attendanceStats.todayPresent + attendanceStats.todayLate);
      }

      // Monthly attendance
      const { data: monthlyAttendance } = await (
        supabaseAdmin.from('employee_attendance') as any
      )
        .select('status, total_hours')
        .in('employer_employee_id', employerEmployeeIds)
        .gte('attendance_date', startOfMonth)
        .lte('attendance_date', endOfMonth);

      if (monthlyAttendance) {
        attendanceStats.monthlyPresent = monthlyAttendance.filter(
          (a: any) => a.status === 'present'
        ).length;
        attendanceStats.monthlyLate = monthlyAttendance.filter(
          (a: any) => a.status === 'late'
        ).length;
        attendanceStats.monthlyAbsent = monthlyAttendance.filter(
          (a: any) => a.status === 'absent'
        ).length;

        const totalHours = monthlyAttendance.reduce(
          (sum: number, a: any) => sum + (parseFloat(a.total_hours) || 0),
          0
        );
        const daysWithHours = monthlyAttendance.filter(
          (a: any) => a.total_hours > 0
        ).length;
        attendanceStats.averageHours =
          daysWithHours > 0 ? totalHours / daysWithHours : 0;
      }
    }

    // 3. Tasks Analytics
    const taskStats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      completedThisMonth: 0,
    };

    if (employerEmployeeIds.length > 0) {
      const { data: tasks } = await (
        supabaseAdmin.from('employee_tasks') as any
      )
        .select('id, status, due_date, completed_at')
        .in('employer_employee_id', employerEmployeeIds);

      if (tasks) {
        taskStats.total = tasks.length;
        taskStats.pending = tasks.filter(
          (t: any) => t.status === 'pending'
        ).length;
        taskStats.inProgress = tasks.filter(
          (t: any) => t.status === 'in_progress'
        ).length;
        taskStats.completed = tasks.filter(
          (t: any) => t.status === 'completed'
        ).length;
        taskStats.overdue = tasks.filter(
          (t: any) =>
            t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
        ).length;
        taskStats.completedThisMonth = tasks.filter(
          (t: any) =>
            t.status === 'completed' &&
            t.completed_at &&
            t.completed_at >= startOfMonth
        ).length;
      }
    }

    // 4. Targets Analytics
    const targetStats = {
      total: 0,
      active: 0,
      completed: 0,
      behindSchedule: 0,
      averageProgress: 0,
    };

    if (employerEmployeeIds.length > 0) {
      const { data: targets } = await (
        supabaseAdmin.from('employee_targets') as any
      )
        .select('id, status, target_value, current_value, end_date')
        .in('employer_employee_id', employerEmployeeIds);

      if (targets) {
        targetStats.total = targets.length;
        targetStats.active = targets.filter(
          (t: any) => t.status === 'active'
        ).length;
        targetStats.completed = targets.filter(
          (t: any) => t.status === 'completed'
        ).length;

        // Calculate behind schedule (active targets with less than expected progress)
        targetStats.behindSchedule = targets.filter((t: any) => {
          if (t.status !== 'active' || !t.end_date) return false;
          const progress = (t.current_value || 0) / (t.target_value || 1);
          const endDate = new Date(t.end_date);
          const daysRemaining = Math.max(
            0,
            (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          const totalDays = 30; // Assuming 30-day targets on average
          const expectedProgress = 1 - daysRemaining / totalDays;
          return progress < expectedProgress;
        }).length;

        // Average progress
        const activeTargets = targets.filter((t: any) => t.status === 'active');
        if (activeTargets.length > 0) {
          const totalProgress = activeTargets.reduce((sum: number, t: any) => {
            return sum + ((t.current_value || 0) / (t.target_value || 1)) * 100;
          }, 0);
          targetStats.averageProgress = totalProgress / activeTargets.length;
        }
      }
    }

    // 5. Recent Activity
    const recentActivity: any[] = [];

    // Get recent attendance check-ins
    if (employerEmployeeIds.length > 0) {
      const { data: recentAttendance } = await (
        supabaseAdmin.from('employee_attendance') as any
      )
        .select(
          `
          id,
          check_in,
          status,
          employer_employee:employer_employee_id (
            employee:employee_id (
              full_name
            )
          )
        `
        )
        .in('employer_employee_id', employerEmployeeIds)
        .not('check_in', 'is', null)
        .order('check_in', { ascending: false })
        .limit(5);

      if (recentAttendance) {
        recentAttendance.forEach((a: any) => {
          recentActivity.push({
            type: 'attendance',
            message: `${a.employer_employee?.employee?.full_name || 'Employee'} checked in`,
            timestamp: a.check_in,
            status: a.status,
          });
        });
      }

      // Get recently completed tasks
      const { data: recentTasks } = await (
        supabaseAdmin.from('employee_tasks') as any
      )
        .select(
          `
          id,
          title,
          completed_at,
          employer_employee:employer_employee_id (
            employee:employee_id (
              full_name
            )
          )
        `
        )
        .in('employer_employee_id', employerEmployeeIds)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (recentTasks) {
        recentTasks.forEach((t: any) => {
          recentActivity.push({
            type: 'task',
            message: `${t.employer_employee?.employee?.full_name || 'Employee'} completed "${t.title}"`,
            timestamp: t.completed_at,
          });
        });
      }
    }

    // Sort recent activity by timestamp
    recentActivity.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      analytics: {
        team: teamStats,
        attendance: attendanceStats,
        tasks: taskStats,
        targets: targetStats,
        recentActivity: recentActivity.slice(0, 10),
      },
      period: {
        month: now.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        }),
        startOfMonth,
        endOfMonth,
        today,
      },
    });
  } catch (error) {
    console.error('Error in analytics GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
