import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const _period = searchParams.get('period') || 'today';

    // Mock data for the beautiful dashboard
    const mockMetrics = {
      totalPromoters: 24,
      activePromoters: 18,
      totalContracts: 156,
      activeContracts: 89,
      totalRevenue: 125000,
      monthlyGrowth: 12.5,
      attendanceRate: 87.3,
      completionRate: 94.2,
      averageRating: 4.6,
      totalTasks: 342,
      completedTasks: 298,
      pendingTasks: 44,
      overdueTasks: 8,
      topPerformers: [
        {
          id: 1,
          name: 'Sarah Johnson',
          performance: 98,
          tasks: 45,
          rating: 4.9,
        },
        { id: 2, name: 'Mike Chen', performance: 95, tasks: 42, rating: 4.8 },
        { id: 3, name: 'Emma Davis', performance: 92, tasks: 38, rating: 4.7 },
        {
          id: 4,
          name: 'Alex Rodriguez',
          performance: 89,
          tasks: 35,
          rating: 4.6,
        },
        { id: 5, name: 'Lisa Wang', performance: 87, tasks: 33, rating: 4.5 },
      ],
      recentActivity: [
        {
          id: 1,
          type: 'contract_signed',
          title: 'New Contract Signed',
          description: 'Contract #CTR-2024-001 signed by ABC Corp',
          timestamp: new Date().toISOString(),
          status: 'completed',
        },
        {
          id: 2,
          type: 'promoter_added',
          title: 'New Promoter Added',
          description: 'Sarah Johnson joined the team',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'completed',
        },
        {
          id: 3,
          type: 'task_completed',
          title: 'Task Completed',
          description: 'Product launch campaign completed',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          status: 'completed',
        },
        {
          id: 4,
          type: 'payment_received',
          title: 'Payment Received',
          description: 'Payment of $5,000 received from XYZ Inc',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          status: 'completed',
        },
        {
          id: 5,
          type: 'meeting_scheduled',
          title: 'Meeting Scheduled',
          description: 'Client meeting scheduled for tomorrow',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          status: 'pending',
        },
      ],
      performanceTrends: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        promoters: [18, 20, 22, 21, 24, 24],
        contracts: [45, 52, 58, 63, 71, 89],
        revenue: [45000, 52000, 58000, 63000, 71000, 125000],
      },
    };

    return NextResponse.json(mockMetrics);
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
