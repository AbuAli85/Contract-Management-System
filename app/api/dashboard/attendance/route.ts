import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'

    // Generate mock attendance data for the heatmap
    const generateAttendanceData = () => {
      const data = []
      const today = new Date()
      
      // Generate data for the last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        // Generate random attendance data
        const totalPromoters = 24
        const present = Math.floor(Math.random() * totalPromoters) + Math.floor(totalPromoters * 0.7) // 70-100% attendance
        const absent = totalPromoters - present
        const late = Math.floor(Math.random() * Math.floor(present * 0.3)) // 0-30% of present are late
        
        data.push({
          date: date.toISOString().split('T')[0],
          present,
          absent,
          late,
          total: totalPromoters,
          attendanceRate: Math.round((present / totalPromoters) * 100)
        })
      }
      
      return data
    }

    const mockAttendance = {
      period,
      data: generateAttendanceData(),
      summary: {
        averageAttendance: 87.3,
        totalDays: 30,
        bestDay: "2024-06-15",
        worstDay: "2024-06-08",
        totalPresent: 628,
        totalAbsent: 92,
        totalLate: 156
      },
      heatmapData: generateAttendanceData().map(day => ({
        date: day.date,
        value: day.attendanceRate,
        present: day.present,
        absent: day.absent,
        late: day.late
      }))
    }

    return NextResponse.json(mockAttendance.data)

  } catch (error) {
    console.error('Dashboard attendance error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch attendance data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 