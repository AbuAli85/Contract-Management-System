import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  differenceInDays,
} from 'date-fns';

/**
 * GET /api/analytics/hr
 *
 * Comprehensive HR Analytics API
 * Returns analytics for:
 * - Employee metrics
 * - Attendance analytics
 * - Document compliance
 * - Tasks and targets
 * - Leave management
 * - Performance metrics
 */
export const GET = withAnyRBAC(
  ['company:read:all', 'admin:all'],
  async (request: NextRequest) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || 'month'; // month, quarter, year
      const companyId = searchParams.get('company_id');

      // Get user's company context
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_company_id, role')
        .eq('id', user.id)
        .single();

      const targetCompanyId = companyId || profile?.active_company_id;

      // Calculate date range
      const now = new Date();
      const startDate =
        period === 'year'
          ? startOfMonth(subMonths(now, 11))
          : period === 'quarter'
            ? startOfMonth(subMonths(now, 2))
            : startOfMonth(now);
      const endDate = endOfMonth(now);

      // 1. EMPLOYEE METRICS
      let employeesQuery = supabase.from('employer_employees').select(
        `
          id,
          employment_status,
          employment_type,
          hire_date,
          department,
          job_title,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            email,
            full_name
          )
        `,
        { count: 'exact' }
      );

      if (targetCompanyId) {
        employeesQuery = employeesQuery.eq('company_id', targetCompanyId);
      }

      const { data: employees, count: totalEmployees } = await employeesQuery;

      const employeeMetrics = {
        total: totalEmployees || 0,
        active:
          employees?.filter(e => e.employment_status === 'active').length || 0,
        onLeave:
          employees?.filter(e => e.employment_status === 'on_leave').length ||
          0,
        terminated:
          employees?.filter(e => e.employment_status === 'terminated').length ||
          0,
        byDepartment: {} as Record<string, number>,
        byEmploymentType: {} as Record<string, number>,
        newHires:
          employees?.filter(e => {
            if (!e.hire_date) return false;
            const hireDate = new Date(e.hire_date);
            return hireDate >= startDate && hireDate <= endDate;
          }).length || 0,
      };

      // Group by department and employment type
      employees?.forEach(emp => {
        if (emp.department) {
          employeeMetrics.byDepartment[emp.department] =
            (employeeMetrics.byDepartment[emp.department] || 0) + 1;
        }
        if (emp.employment_type) {
          employeeMetrics.byEmploymentType[emp.employment_type] =
            (employeeMetrics.byEmploymentType[emp.employment_type] || 0) + 1;
        }
      });

      // 2. ATTENDANCE ANALYTICS
      let attendanceQuery = supabase
        .from('employee_attendance')
        .select(
          `
          id,
          attendance_date,
          status,
          total_hours,
          overtime_hours,
          employer_employee:employer_employees!inner(
            company_id
          )
        `
        )
        .gte('attendance_date', format(startDate, 'yyyy-MM-dd'))
        .lte('attendance_date', format(endDate, 'yyyy-MM-dd'));

      if (targetCompanyId) {
        attendanceQuery = attendanceQuery.eq(
          'employer_employee.company_id',
          targetCompanyId
        );
      }

      const { data: attendanceRecords } = await attendanceQuery;

      const attendanceMetrics = {
        totalDays: attendanceRecords?.length || 0,
        present:
          attendanceRecords?.filter(a => a.status === 'present').length || 0,
        absent:
          attendanceRecords?.filter(a => a.status === 'absent').length || 0,
        late: attendanceRecords?.filter(a => a.status === 'late').length || 0,
        leave: attendanceRecords?.filter(a => a.status === 'leave').length || 0,
        totalHours:
          attendanceRecords?.reduce(
            (sum, a) => sum + (parseFloat(a.total_hours) || 0),
            0
          ) || 0,
        overtimeHours:
          attendanceRecords?.reduce(
            (sum, a) => sum + (parseFloat(a.overtime_hours) || 0),
            0
          ) || 0,
        attendanceRate: 0,
        dailyAttendance: [] as Array<{
          date: string;
          present: number;
          absent: number;
          late: number;
        }>,
      };

      // Calculate attendance rate
      if (employeeMetrics.active > 0 && attendanceMetrics.totalDays > 0) {
        const expectedDays =
          employeeMetrics.active * (differenceInDays(endDate, startDate) + 1);
        const actualDays = attendanceMetrics.present;
        attendanceMetrics.attendanceRate =
          expectedDays > 0 ? (actualDays / expectedDays) * 100 : 0;
      }

      // Group by date
      const attendanceByDate = new Map<
        string,
        { present: number; absent: number; late: number }
      >();
      attendanceRecords?.forEach(record => {
        if (!record.attendance_date) return;
        try {
          const date = format(new Date(record.attendance_date), 'yyyy-MM-dd');
          if (date === 'Invalid Date') return;
          const existing = attendanceByDate.get(date) || {
            present: 0,
            absent: 0,
            late: 0,
          };
          if (record.status === 'present') existing.present++;
          if (record.status === 'absent') existing.absent++;
          if (record.status === 'late') existing.late++;
          attendanceByDate.set(date, existing);
        } catch (error) {
        }
      });

      attendanceMetrics.dailyAttendance = Array.from(attendanceByDate.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 3. DOCUMENT COMPLIANCE
      let documentsQuery = supabase
        .from('employee_documents')
        .select(
          `
          id,
          document_type,
          expiry_date,
          status,
          employer_employee:employer_employees!inner(
            company_id
          )
        `
        )
        .eq('status', 'verified');

      if (targetCompanyId) {
        documentsQuery = documentsQuery.eq(
          'employer_employee.company_id',
          targetCompanyId
        );
      }

      const { data: documents } = await documentsQuery;

      const nowDate = new Date();
      const documentMetrics = {
        total: documents?.length || 0,
        expired:
          documents?.filter(d => {
            if (!d.expiry_date) return false;
            return new Date(d.expiry_date) < nowDate;
          }).length || 0,
        expiringSoon:
          documents?.filter(d => {
            if (!d.expiry_date) return false;
            const expiry = new Date(d.expiry_date);
            const daysUntil = differenceInDays(expiry, nowDate);
            return daysUntil > 0 && daysUntil <= 30;
          }).length || 0,
        compliant:
          documents?.filter(d => {
            if (!d.expiry_date) return true;
            const expiry = new Date(d.expiry_date);
            const daysUntil = differenceInDays(expiry, nowDate);
            return daysUntil > 30;
          }).length || 0,
        byType: {} as Record<string, number>,
        complianceRate: 0,
      };

      documents?.forEach(doc => {
        documentMetrics.byType[doc.document_type] =
          (documentMetrics.byType[doc.document_type] || 0) + 1;
      });

      if (documentMetrics.total > 0) {
        documentMetrics.complianceRate =
          (documentMetrics.compliant / documentMetrics.total) * 100;
      }

      // 4. TASKS ANALYTICS
      let tasksQuery = supabase
        .from('employee_tasks')
        .select(
          `
          id,
          status,
          priority,
          due_date,
          completed_at,
          assigned_at,
          employer_employee:employer_employees!inner(
            company_id
          )
        `
        )
        .gte('assigned_at', startDate.toISOString())
        .lte('assigned_at', endDate.toISOString());

      if (targetCompanyId) {
        tasksQuery = tasksQuery.eq(
          'employer_employee.company_id',
          targetCompanyId
        );
      }

      const { data: tasks } = await tasksQuery;

      const taskMetrics = {
        total: tasks?.length || 0,
        completed: tasks?.filter(t => t.status === 'completed').length || 0,
        pending: tasks?.filter(t => t.status === 'pending').length || 0,
        inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
        overdue:
          tasks?.filter(t => {
            if (!t.due_date || t.status === 'completed') return false;
            return new Date(t.due_date) < nowDate;
          }).length || 0,
        byPriority: {} as Record<string, number>,
        completionRate: 0,
        avgCompletionTime: 0,
      };

      tasks?.forEach(task => {
        if (task.priority) {
          taskMetrics.byPriority[task.priority] =
            (taskMetrics.byPriority[task.priority] || 0) + 1;
        }
      });

      if (taskMetrics.total > 0) {
        taskMetrics.completionRate =
          (taskMetrics.completed / taskMetrics.total) * 100;
      }

      // Calculate average completion time
      const completedTasks =
        tasks?.filter(
          t => t.status === 'completed' && t.assigned_at && t.completed_at
        ) || [];

      if (completedTasks.length > 0) {
        const totalTime = completedTasks.reduce((sum, task) => {
          const assigned = new Date(task.assigned_at);
          const completed = new Date(task.completed_at);
          return sum + differenceInDays(completed, assigned);
        }, 0);
        taskMetrics.avgCompletionTime = totalTime / completedTasks.length;
      }

      // 5. TARGETS ANALYTICS
      let targetsQuery = supabase
        .from('employee_targets')
        .select(
          `
          id,
          target_value,
          current_value,
          status,
          start_date,
          end_date,
          employer_employee:employer_employees!inner(
            company_id
          )
        `
        )
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('start_date', format(endDate, 'yyyy-MM-dd'));

      if (targetCompanyId) {
        targetsQuery = targetsQuery.eq(
          'employer_employee.company_id',
          targetCompanyId
        );
      }

      const { data: targets } = await targetsQuery;

      const targetMetrics = {
        total: targets?.length || 0,
        achieved:
          targets?.filter(t => {
            const current = parseFloat(t.current_value) || 0;
            const target = parseFloat(t.target_value) || 0;
            return target > 0 && current >= target;
          }).length || 0,
        inProgress:
          targets?.filter(t => t.status === 'in_progress').length || 0,
        notStarted: targets?.filter(t => t.status === 'pending').length || 0,
        achievementRate: 0,
        avgProgress: 0,
      };

      if (targetMetrics.total > 0) {
        targetMetrics.achievementRate =
          (targetMetrics.achieved / targetMetrics.total) * 100;

        const totalProgress =
          targets?.reduce((sum, t) => {
            const current = parseFloat(t.current_value) || 0;
            const target = parseFloat(t.target_value) || 0;
            return sum + (target > 0 ? (current / target) * 100 : 0);
          }, 0) || 0;
        targetMetrics.avgProgress = totalProgress / targetMetrics.total;
      }

      // 6. LEAVE ANALYTICS
      let leaveQuery = supabase
        .from('leave_requests')
        .select(
          `
          id,
          leave_type,
          status,
          start_date,
          end_date,
          employer_employee:employer_employees!inner(
            company_id
          )
        `
        )
        .gte('start_date', format(startDate, 'yyyy-MM-dd'))
        .lte('start_date', format(endDate, 'yyyy-MM-dd'));

      if (targetCompanyId) {
        leaveQuery = leaveQuery.eq(
          'employer_employee.company_id',
          targetCompanyId
        );
      }

      const { data: leaveRequests } = await leaveQuery;

      const leaveMetrics = {
        total: leaveRequests?.length || 0,
        approved:
          leaveRequests?.filter(l => l.status === 'approved').length || 0,
        pending: leaveRequests?.filter(l => l.status === 'pending').length || 0,
        rejected:
          leaveRequests?.filter(l => l.status === 'rejected').length || 0,
        byType: {} as Record<string, number>,
        totalDays: 0,
      };

      leaveRequests?.forEach(leave => {
        if (leave.leave_type) {
          leaveMetrics.byType[leave.leave_type] =
            (leaveMetrics.byType[leave.leave_type] || 0) + 1;
        }
        if (leave.start_date && leave.end_date && leave.status === 'approved') {
          const start = new Date(leave.start_date);
          const end = new Date(leave.end_date);
          leaveMetrics.totalDays += differenceInDays(end, start) + 1;
        }
      });

      // 7. PERFORMANCE TRENDS (Monthly)
      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(monthStart);
        const monthKey = format(monthStart, 'MMM yyyy');

        // Count employees hired in this month
        const newHires =
          employees?.filter(e => {
            if (!e.hire_date) return false;
            const hireDate = new Date(e.hire_date);
            return hireDate >= monthStart && hireDate <= monthEnd;
          }).length || 0;

        // Count attendance in this month
        const monthAttendance =
          attendanceRecords?.filter(a => {
            const date = new Date(a.attendance_date);
            return date >= monthStart && date <= monthEnd;
          }).length || 0;

        monthlyTrends.push({
          month: monthKey,
          newHires,
          attendance: monthAttendance,
          employees: employeeMetrics.total,
        });
      }

      return NextResponse.json({
        success: true,
        period,
        dateRange: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
        },
        metrics: {
          employees: employeeMetrics,
          attendance: attendanceMetrics,
          documents: documentMetrics,
          tasks: taskMetrics,
          targets: targetMetrics,
          leave: leaveMetrics,
        },
        trends: {
          monthly: monthlyTrends,
        },
      });
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Internal server error',
        },
        { status: 500 }
      );
    }
  }
);
