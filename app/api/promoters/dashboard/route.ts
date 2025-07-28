import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const promoterId = searchParams.get('promoterId') || '1'

    // Mock data for promoter dashboard
    const mockPromoterData = {
      promoter: {
        id: promoterId,
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        role: "Senior Promoter",
        joinDate: "2023-03-15",
        status: "active",
        rating: 4.9,
        totalTasks: 156,
        completedTasks: 142,
        pendingTasks: 14,
        overdueTasks: 0,
        totalEarnings: 12500,
        thisMonthEarnings: 2800,
        achievements: [
          { id: 1, name: "Top Performer", icon: "🏆", description: "Achieved highest performance rating", date: "2024-06-01" },
          { id: 2, name: "Perfect Attendance", icon: "📅", description: "30 days of perfect attendance", date: "2024-05-15" },
          { id: 3, name: "Client Favorite", icon: "⭐", description: "Highest client satisfaction rating", date: "2024-04-20" },
          { id: 4, name: "Task Master", icon: "✅", description: "Completed 100+ tasks", date: "2024-03-10" }
        ],
        skills: ["Product Demonstrations", "Client Relations", "Sales", "Event Management", "Social Media Marketing"],
        leaderboardRank: 1,
        performanceScore: 98
      },
      tasks: [
        {
          id: 1,
          title: "Product Launch Event",
          description: "Lead product demonstration at tech conference",
          dueDate: "2024-06-25",
          priority: "high",
          status: "in_progress",
          progress: 75,
          category: "Event"
        },
        {
          id: 2,
          title: "Client Meeting - ABC Corp",
          description: "Present quarterly performance report",
          dueDate: "2024-06-22",
          priority: "medium",
          status: "pending",
          progress: 0,
          category: "Meeting"
        },
        {
          id: 3,
          title: "Social Media Campaign",
          description: "Create and manage Instagram campaign",
          dueDate: "2024-06-28",
          priority: "low",
          status: "completed",
          progress: 100,
          category: "Marketing"
        },
        {
          id: 4,
          title: "Training Session",
          description: "Train new team members on product features",
          dueDate: "2024-06-30",
          priority: "medium",
          status: "pending",
          progress: 0,
          category: "Training"
        }
      ],
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
        }
      ],
      performanceStats: {
        thisMonth: {
          tasksCompleted: 18,
          tasksPending: 4,
          attendanceRate: 100,
          clientRating: 4.9,
          earnings: 2800
        },
        lastMonth: {
          tasksCompleted: 22,
          tasksPending: 2,
          attendanceRate: 96,
          clientRating: 4.8,
          earnings: 3200
        }
      },
      upcomingEvents: [
        {
          id: 1,
          title: "Tech Conference Demo",
          date: "2024-06-25",
          time: "10:00 AM",
          location: "Convention Center",
          type: "Product Demo"
        },
        {
          id: 2,
          title: "Team Training",
          date: "2024-06-30",
          time: "2:00 PM",
          location: "Office",
          type: "Training"
        }
      ]
    }

    return NextResponse.json({
      success: true,
      data: mockPromoterData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Promoter dashboard error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch promoter dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 