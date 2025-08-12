import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock data for promoter achievements
    const mockAchievements = {
      earned: [
        {
          id: 1,
          name: 'Top Performer',
          icon: '🏆',
          description: 'Achieved highest performance rating in the team',
          date: '2024-06-01',
          points: 100,
          category: 'Performance',
          rarity: 'rare',
          progress: 100,
          totalRequired: 1,
        },
        {
          id: 2,
          name: 'Perfect Attendance',
          icon: '📅',
          description: 'Maintained perfect attendance for 30 consecutive days',
          date: '2024-05-15',
          points: 75,
          category: 'Attendance',
          rarity: 'uncommon',
          progress: 100,
          totalRequired: 30,
        },
        {
          id: 3,
          name: 'Client Favorite',
          icon: '⭐',
          description: 'Received highest client satisfaction rating',
          date: '2024-04-20',
          points: 50,
          category: 'Client Relations',
          rarity: 'common',
          progress: 100,
          totalRequired: 1,
        },
        {
          id: 4,
          name: 'Task Master',
          icon: '✅',
          description: 'Successfully completed 100+ tasks',
          date: '2024-03-10',
          points: 25,
          category: 'Productivity',
          rarity: 'common',
          progress: 100,
          totalRequired: 100,
        },
        {
          id: 5,
          name: 'Early Bird',
          icon: '🌅',
          description: 'Completed 10 tasks before 9 AM',
          date: '2024-02-28',
          points: 30,
          category: 'Productivity',
          rarity: 'uncommon',
          progress: 100,
          totalRequired: 10,
        },
      ],
      available: [
        {
          id: 6,
          name: 'Social Butterfly',
          icon: '🦋',
          description: 'Engage with 50+ clients on social media',
          date: null,
          points: 40,
          category: 'Social Media',
          rarity: 'common',
          progress: 35,
          totalRequired: 50,
        },
        {
          id: 7,
          name: 'Revenue Champion',
          icon: '💰',
          description: 'Generate $10,000 in revenue in a single month',
          date: null,
          points: 150,
          category: 'Sales',
          rarity: 'rare',
          progress: 65,
          totalRequired: 10000,
        },
        {
          id: 8,
          name: 'Mentor',
          icon: '👨‍🏫',
          description: 'Train 5 new team members',
          date: null,
          points: 80,
          category: 'Leadership',
          rarity: 'uncommon',
          progress: 60,
          totalRequired: 5,
        },
        {
          id: 9,
          name: 'Innovator',
          icon: '💡',
          description: 'Suggest 3 improvements that get implemented',
          date: null,
          points: 60,
          category: 'Innovation',
          rarity: 'uncommon',
          progress: 33,
          totalRequired: 3,
        },
        {
          id: 10,
          name: 'Consistency King',
          icon: '👑',
          description: 'Maintain 95%+ completion rate for 3 months',
          date: null,
          points: 120,
          category: 'Performance',
          rarity: 'rare',
          progress: 85,
          totalRequired: 3,
        },
      ],
      stats: {
        totalEarned: 5,
        totalAvailable: 10,
        totalPoints: 280,
        rank: 'Gold',
        nextAchievement: 'Social Butterfly',
        progressToNext: 35,
      },
      leaderboard: {
        rank: 1,
        totalParticipants: 24,
        topAchievers: [
          { rank: 1, name: 'Sarah Johnson', points: 280, achievements: 5 },
          { rank: 2, name: 'Mike Chen', points: 245, achievements: 4 },
          { rank: 3, name: 'Emma Davis', points: 220, achievements: 4 },
          { rank: 4, name: 'Alex Rodriguez', points: 195, achievements: 3 },
          { rank: 5, name: 'Lisa Wang', points: 170, achievements: 3 },
        ],
      },
    };

    return NextResponse.json(mockAchievements);
  } catch (error) {
    console.error('Promoter achievements error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch promoter achievements',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
