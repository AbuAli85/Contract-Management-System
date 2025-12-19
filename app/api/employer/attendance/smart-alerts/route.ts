import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { startOfDay, endOfDay, subDays, parseISO, differenceInMinutes } from 'date-fns';

export const dynamic = 'force-dynamic';

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
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
    }

    const today = new Date();
    const todayStart = startOfDay(today).toISOString();
    const weekAgo = subDays(today, 7);

    // Get today's attendance
    const { data: todayAttendance } = await (supabaseAdmin.from('employee_attendance') as any)
      .select(`
        *,
        employer_employee:employer_employees!inner(
          company_id,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            full_name
          )
        )
      `)
      .eq('employer_employee.company_id', companyId)
      .gte('attendance_date', todayStart.split('T')[0])
      .lte('attendance_date', todayStart.split('T')[0]);

    // Get recent attendance for pattern detection
    const { data: recentAttendance } = await (supabaseAdmin.from('employee_attendance') as any)
      .select(`
        *,
        employer_employee:employer_employees!inner(
          company_id,
          employee:profiles!employer_employees_employee_id_fkey(
            id,
            full_name
          )
        )
      `)
      .eq('employer_employee.company_id', companyId)
      .gte('attendance_date', weekAgo.toISOString().split('T')[0]);

    const alerts: any[] = [];

    // Analyze today's attendance for alerts
    (todayAttendance || []).forEach((record: any) => {
      const employeeName = record.employer_employee?.employee?.full_name || 'Unknown';
      const checkInTime = record.check_in ? parseISO(record.check_in) : null;
      const expectedCheckIn = new Date(today);
      expectedCheckIn.setHours(9, 0, 0, 0); // 9:00 AM

      // Late check-in detection
      if (checkInTime && differenceInMinutes(checkInTime, expectedCheckIn) > 15) {
        const minutesLate = differenceInMinutes(checkInTime, expectedCheckIn);
        alerts.push({
          id: `late-${record.id}`,
          type: 'late',
          severity: minutesLate > 60 ? 'high' : minutesLate > 30 ? 'medium' : 'low',
          title: 'Late Check-In Detected',
          description: `${employeeName} checked in ${minutesLate} minutes late today.`,
          employeeName,
          date: record.attendance_date,
          actionRequired: minutesLate > 30,
        });
      }

      // Missing check-in detection
      if (!record.check_in && record.status === 'absent') {
        alerts.push({
          id: `missing-${record.id}`,
          type: 'missing',
          severity: 'high',
          title: 'Missing Check-In',
          description: `${employeeName} has not checked in today.`,
          employeeName,
          date: record.attendance_date,
          actionRequired: true,
        });
      }

      // Location verification alert
      if (!record.latitude || !record.longitude) {
        alerts.push({
          id: `location-${record.id}`,
          type: 'location',
          severity: 'medium',
          title: 'Location Not Captured',
          description: `${employeeName}'s check-in location was not captured.`,
          employeeName,
          date: record.attendance_date,
          actionRequired: false,
        });
      }
    });

    // Pattern detection - check for unusual patterns
    const employeePatterns = new Map<string, any[]>();
    (recentAttendance || []).forEach((record: any) => {
      const employeeId = record.employer_employee?.employee?.id;
      if (employeeId) {
        if (!employeePatterns.has(employeeId)) {
          employeePatterns.set(employeeId, []);
        }
        employeePatterns.get(employeeId)!.push(record);
      }
    });

    // Detect patterns (e.g., consistently late, frequent absences)
    employeePatterns.forEach((records, employeeId) => {
      const employeeName = records[0]?.employer_employee?.employee?.full_name || 'Unknown';
      const lateCount = records.filter((r) => r.status === 'late').length;
      const absentCount = records.filter((r) => r.status === 'absent').length;

      if (lateCount >= 3) {
        alerts.push({
          id: `pattern-late-${employeeId}`,
          type: 'pattern',
          severity: 'medium',
          title: 'Frequent Late Arrivals',
          description: `${employeeName} has been late ${lateCount} times in the past week.`,
          employeeName,
          date: today.toISOString(),
          actionRequired: true,
        });
      }

      if (absentCount >= 2) {
        alerts.push({
          id: `pattern-absent-${employeeId}`,
          type: 'pattern',
          severity: 'high',
          title: 'Frequent Absences',
          description: `${employeeName} has been absent ${absentCount} times in the past week.`,
          employeeName,
          date: today.toISOString(),
          actionRequired: true,
        });
      }
    });

    return NextResponse.json({
      success: true,
      alerts: alerts.slice(0, 20), // Limit to 20 most recent alerts
      count: alerts.length,
    });
  } catch (error: any) {
    console.error('Error fetching smart alerts:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

