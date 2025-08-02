"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"

interface DashboardStatsProps {
  stats: {
    totalContracts: number
    activeContracts: number
    pendingContracts: number
    completedContracts: number
    totalPromoters: number
    activePromoters: number
    totalParties: number
    pendingApprovals: number
    recentActivity: number
    expiringDocuments: number
    contractsByStatus: Record<string, number>
    monthlyData: Array<{
      month: string
      total: number
      active: number
      pending: number
      completed: number
    }>
    contractGrowth: number
    promoterGrowth: number
    completionRate: number
    avgProcessingTime: string
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = "blue", 
    description,
    trend = "up"
  }: {
    title: string
    value: string | number
    change?: string
    icon: React.ComponentType<any>
    color?: string
    description?: string
    trend?: "up" | "down" | "neutral"
  }) => (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-lg",
          color === "blue" && "bg-blue-100 text-blue-600",
          color === "green" && "bg-green-100 text-green-600",
          color === "yellow" && "bg-yellow-100 text-yellow-600",
          color === "red" && "bg-red-100 text-red-600",
          color === "purple" && "bg-purple-100 text-purple-600"
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {change && (
              <div className={cn(
                "flex items-center text-xs mt-1",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-gray-600"
              )}>
                {trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                 trend === "down" ? <ArrowDownRight className="h-3 w-3 mr-1" /> : null}
                {change}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
      {/* Decorative gradient */}
      <div className={cn(
        "absolute inset-x-0 bottom-0 h-1",
        color === "blue" && "bg-gradient-to-r from-blue-400 to-blue-600",
        color === "green" && "bg-gradient-to-r from-green-400 to-green-600",
        color === "yellow" && "bg-gradient-to-r from-yellow-400 to-yellow-600",
        color === "red" && "bg-gradient-to-r from-red-400 to-red-600",
        color === "purple" && "bg-gradient-to-r from-purple-400 to-purple-600"
      )} />
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Contracts"
          value={stats.totalContracts}
          change={`+${stats.contractGrowth}% from last month`}
          icon={FileText}
          color="blue"
          description="All contracts in system"
        />
        <StatCard
          title="Active Promoters"
          value={stats.activePromoters}
          change={`+${stats.promoterGrowth}% growth`}
          icon={Users}
          color="green"
          description={`${stats.totalPromoters} total promoters`}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={Clock}
          color="yellow"
          description="Requires immediate attention"
        />
        <StatCard
          title="System Health"
          value="98%"
          icon={Activity}
          color="green"
          description="All systems operational"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={Target}
          color="purple"
          description="Contract completion efficiency"
        />
        <StatCard
          title="Avg Processing Time"
          value={`${stats.avgProcessingTime} days`}
          icon={Zap}
          color="blue"
          description="Time to complete contracts"
        />
        <StatCard
          title="Expiring Documents"
          value={stats.expiringDocuments}
          icon={AlertTriangle}
          color={stats.expiringDocuments > 0 ? "red" : "green"}
          description="Next 30 days"
        />
        <StatCard
          title="Recent Activity"
          value={stats.recentActivity}
          icon={Calendar}
          color="green"
          description="Last 7 days"
        />
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contract Status Distribution */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Contract Status Overview
            </CardTitle>
            <CardDescription>
              Current breakdown of all contracts by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.contractsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      status === "active" && "bg-green-500",
                      status === "pending" && "bg-yellow-500",
                      status === "completed" && "bg-blue-500",
                      status === "cancelled" && "bg-red-500"
                    )} />
                    <span className="text-sm font-medium capitalize">{status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{count}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full",
                          status === "active" && "bg-green-500",
                          status === "pending" && "bg-yellow-500",
                          status === "completed" && "bg-blue-500",
                          status === "cancelled" && "bg-red-500"
                        )}
                        style={{ 
                          width: `${(count / Math.max(stats.totalContracts, 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends Summary */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Recent Trends
            </CardTitle>
            <CardDescription>
              Summary of recent contract activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.monthlyData[stats.monthlyData.length - 1]?.total || 0}
                  </div>
                  <p className="text-sm text-blue-600">This Month</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.monthlyData[stats.monthlyData.length - 1]?.completed || 0}
                  </div>
                  <p className="text-sm text-green-600">Completed</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  📈 Contract creation is {stats.contractGrowth > 0 ? 'trending up' : 'stable'} 
                  with {stats.contractGrowth}% growth this month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Performance Indicators
          </CardTitle>
          <CardDescription>
            Key performance metrics and progress indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Contract Processing Efficiency */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Contract Processing Efficiency</span>
                <span className="text-sm text-muted-foreground">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Based on successful contract completions vs. total contracts
              </p>
            </div>

            {/* Active Promoter Ratio */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Promoter Ratio</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((stats.activePromoters / Math.max(stats.totalPromoters, 1)) * 100)}%
                </span>
              </div>
              <Progress 
                value={(stats.activePromoters / Math.max(stats.totalPromoters, 1)) * 100} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                {stats.activePromoters} of {stats.totalPromoters} promoters are currently active
              </p>
            </div>

            {/* System Uptime */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Uptime</span>
                <span className="text-sm text-muted-foreground">99.8%</span>
              </div>
              <Progress value={99.8} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Excellent system reliability over the past 30 days
              </p>
            </div>

            {/* Document Compliance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Document Compliance</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((1 - (stats.expiringDocuments / Math.max(stats.totalPromoters, 1))) * 100)}%
                </span>
              </div>
              <Progress 
                value={(1 - (stats.expiringDocuments / Math.max(stats.totalPromoters, 1))) * 100} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground">
                {stats.expiringDocuments} documents expiring in the next 30 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
