/**
 * Fixed Dashboard Quick Stats Component
 * 
 * This replaces the hardcoded growth percentages in the dashboard
 * with proper calculations based on actual data.
 * 
 * Location to update: app/[locale]/dashboard/page.tsx (lines 207-240)
 */

import { FileText, Activity, Users, TrendingUp } from 'lucide-react';
import {
  calculateGrowthPercentage,
  determineGrowthTrend,
  formatPercentageChange,
} from './calculations';

interface QuickStat {
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface StatsData {
  total: number;
  active: number;
  previousMonth?: {
    total: number;
    active: number;
  };
}

interface PromoterStatsData {
  totalWorkforce: number;
  utilizationRate: number;
  previousMonth?: {
    totalWorkforce: number;
    utilizationRate: number;
  };
}

/**
 * Generate quick stats with proper growth calculations
 * 
 * @param stats - Current contract statistics
 * @param promoterStats - Current promoter statistics
 * @returns Array of QuickStat objects with calculated growth
 */
export function generateQuickStats(
  stats: StatsData | null,
  promoterStats: PromoterStatsData | null
): QuickStat[] {
  // Calculate contract growth
  const totalContractsChange = calculateGrowthPercentage(
    stats?.total || 0,
    stats?.previousMonth?.total || 0
  );

  const activeContractsChange = calculateGrowthPercentage(
    stats?.active || 0,
    stats?.previousMonth?.active || 0
  );

  const workforceChange = calculateGrowthPercentage(
    promoterStats?.totalWorkforce || 0,
    promoterStats?.previousMonth?.totalWorkforce || 0
  );

  const utilizationChange = calculateGrowthPercentage(
    promoterStats?.utilizationRate || 0,
    promoterStats?.previousMonth?.utilizationRate || 0
  );

  return [
    {
      label: 'Total Contracts',
      value: stats?.total || 0,
      change: totalContractsChange,
      trend: determineGrowthTrend(totalContractsChange),
      icon: <FileText className="h-5 w-5" />,
      color: 'blue',
    },
    {
      label: 'Active Contracts',
      value: stats?.active || 0,
      change: activeContractsChange,
      trend: determineGrowthTrend(activeContractsChange),
      icon: <Activity className="h-5 w-5" />,
      color: 'green',
    },
    {
      label: 'Workforce',
      value: promoterStats?.totalWorkforce || 0,
      change: workforceChange,
      trend: determineGrowthTrend(workforceChange),
      icon: <Users className="h-5 w-5" />,
      color: 'purple',
    },
    {
      label: 'Utilization',
      value: `${promoterStats?.utilizationRate || 0}%`,
      change: utilizationChange,
      trend: determineGrowthTrend(utilizationChange),
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'orange',
    },
  ];
}

/**
 * Example usage in dashboard component:
 * 
 * // In your DashboardContent component:
 * const quickStats = generateQuickStats(stats, promoterStats);
 * 
 * // Then render:
 * {quickStats.map((stat, index) => (
 *   <Card key={index}>
 *     <CardHeader>
 *       <div className="flex items-center justify-between">
 *         <span className="text-sm text-muted-foreground">{stat.label}</span>
 *         {stat.icon}
 *       </div>
 *     </CardHeader>
 *     <CardContent>
 *       <div className="text-3xl font-bold">{stat.value}</div>
 *       <div className="flex items-center gap-1 text-sm">
 *         {stat.trend === 'up' ? (
 *           <TrendingUp className="h-4 w-4 text-green-600" />
 *         ) : stat.trend === 'down' ? (
 *           <TrendingDown className="h-4 w-4 text-red-600" />
 *         ) : null}
 *         <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
 *           {formatPercentageChange(stat.change)}
 *         </span>
 *         <span className="text-muted-foreground">from last month</span>
 *       </div>
 *     </CardContent>
 *   </Card>
 * ))}
 */

