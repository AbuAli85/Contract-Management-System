import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'

    // Mock data for promoter metrics
    const mockPromoterMetrics = {
      personalStats: {
        totalTasks: 156,
        completedTasks: 142,
        pendingTasks: 14,
        overdueTasks: 0,
        completionRate: 91.0,
        averageRating: 4.9,
        totalEarnings: 12500,
        thisMonthEarnings: 2800,
        attendanceRate: 100,
        performanceScore: 98
      },
      performanceTrends: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        tasksCompleted: [8, 12, 10, 15, 9, 6, 4],
        ratings: [4.8, 4.9, 4.7, 5.0, 4.8, 4.9, 4.8],
        earnings: [200, 300, 250, 400, 280, 180, 120]
      },
      achievements: [
        { id: 1, name: "Top Performer", icon: "🏆", description: "Achieved highest performance rating", date: "2024-06-01", points: 100 },
        { id: 2, name: "Perfect Attendance", icon: "📅", description: "30 days of perfect attendance", date: "2024-05-15", points: 75 },
        { id: 3, name: "Client Favorite", icon: "⭐", description: "Highest client satisfaction rating", date: "2024-04-20", points: 50 },
        { id: 4, name: "Task Master", icon: "✅", description: "Completed 100+ tasks", date: "2024-03-10", points: 25 }
      ],
      leaderboard: {
        rank: 1,
        totalParticipants: 24,
        topPerformers: [
          { rank: 1, name: "Sarah Johnson", score: 98, tasks: 156 },
          { rank: 2, name: "Mike Chen", score: 95, tasks: 142 },
          { rank: 3, name: "Emma Davis", score: 92, tasks: 138 },
          { rank: 4, name: "Alex Rodriguez", score: 89, tasks: 135 },
          { rank: 5, name: "Lisa Wang", score: 87, tasks: 132 }
        ]
      },
      recentActivity: [
        {
          id: 1,
          type: "task_completed",
          title: "Task Completed",
          description: "Social Media Campaign finished successfully",
          timestamp: new Date().toISOString(),
          points: 50
        },
        {
          id: 2,
          type: "achievement_earned",
          title: "Achievement Earned",
          description: "Earned 'Perfect Attendance' badge",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          points: 100
        },
        {
          id: 3,
          type: "client_feedback",
          title: "Positive Feedback",
          description: "Received 5-star rating from client",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          points: 25
        },
        {
          id: 4,
          type: "payment_received",
          title: "Payment Received",
          description: "Payment of $500 received for completed task",
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          points: 0
        }
      ]
    }

    return NextResponse.json(mockPromoterMetrics)

  } catch (error) {
    console.error('Promoter metrics error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch promoter metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 