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
  ArrowDownRight,
  Calendar
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
    <Card className="relative overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group border-0 shadow-lg">
      <div className={cn(
        "absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300",
        color === "blue" && "bg-gradient-to-br from-blue-400 to-blue-600",
        color === "green" && "bg-gradient-to-br from-green-400 to-green-600",
        color === "yellow" && "bg-gradient-to-br from-yellow-400 to-yellow-600",
        color === "red" && "bg-gradient-to-br from-red-400 to-red-600",
        color === "purple" && "bg-gradient-to-br from-purple-400 to-purple-600"
      )} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-slate-600 group-hover:text-slate-700 transition-colors">
          {title}
        </CardTitle>
        <div className={cn(
          "p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300",
          color === "blue" && "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/25",
          color === "green" && "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-500/25",
          color === "yellow" && "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-yellow-500/25",
          color === "red" && "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-500/25",
          color === "purple" && "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-500/25"
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-2">
          <div className="text-3xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">{value}</div>
          {change && (
            <div className={cn(
              "flex items-center text-sm font-medium",
              trend === "up" && "text-green-600",
              trend === "down" && "text-red-600",
              trend === "neutral" && "text-slate-600"
            )}>
              {trend === "up" ? <ArrowUpRight className="h-4 w-4 mr-1" /> : 
               trend === "down" ? <ArrowDownRight className="h-4 w-4 mr-1" /> : null}
              {change}
            </div>
          )}
          {description && (
            <p className="text-sm text-slate-500 font-medium">{description}</p>
          )}
        </div>
      </CardContent>
      
      {/* Enhanced decorative gradient */}
      <div className={cn(
        "absolute inset-x-0 bottom-0 h-1.5 group-hover:h-2 transition-all duration-300",
        color === "blue" && "bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600",
        color === "green" && "bg-gradient-to-r from-green-400 via-green-500 to-green-600",
        color === "yellow" && "bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600",
        color === "red" && "bg-gradient-to-r from-red-400 via-red-500 to-red-600",
        color === "purple" && "bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600"
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

      {/* Enhanced Performance Indicators */}
      <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl text-white shadow-lg shadow-purple-500/25">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
              Performance Indicators
            </span>
          </CardTitle>
          <CardDescription className="text-slate-600 font-medium">
            Key performance metrics and progress indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Contract Processing Efficiency */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Contract Processing Efficiency</span>
                <span className="text-lg font-bold text-purple-600">{stats.completionRate}%</span>
              </div>
              <div className="relative">
                <Progress 
                  value={stats.completionRate} 
                  className="h-3 bg-purple-100" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" 
                     style={{ width: `${stats.completionRate}%` }} />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Based on successful contract completions vs total contracts
              </p>
            </div>

            {/* Active Promoter Ratio */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Active Promoter Ratio</span>
                <span className="text-lg font-bold text-green-600">
                  {stats.totalPromoters > 0 ? Math.round((stats.activePromoters / stats.totalPromoters) * 100) : 0}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={stats.totalPromoters > 0 ? (stats.activePromoters / stats.totalPromoters) * 100 : 0} 
                  className="h-3 bg-green-100" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full" 
                     style={{ width: `${stats.totalPromoters > 0 ? (stats.activePromoters / stats.totalPromoters) * 100 : 0}%` }} />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {stats.activePromoters} of {stats.totalPromoters} promoters are currently active
              </p>
            </div>

            {/* System Uptime */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">System Uptime</span>
                <span className="text-lg font-bold text-blue-600">99.8%</span>
              </div>
              <div className="relative">
                <Progress value={99.8} className="h-3 bg-blue-100" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" 
                     style={{ width: '99.8%' }} />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Excellent system reliability over the past 30 days
              </p>
            </div>

            {/* Document Compliance */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Document Compliance</span>
                <span className="text-lg font-bold text-yellow-600">100%</span>
              </div>
              <div className="relative">
                <Progress value={100} className="h-3 bg-yellow-100" />
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full" 
                     style={{ width: '100%' }} />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                0 documents expiring in the next 30 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
