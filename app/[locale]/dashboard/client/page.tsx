"use client"

import { useState } from "react"
import { Building2, FileText, Users, BarChart3, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ClientDashboard() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      console.log('✅ Minimal dashboard refreshed safely')
    }, 1000)
  }

  // Static mock data to avoid any API calls
  const stats = {
    activeContracts: 8,
    totalSpent: 145000,
    savedAmount: 23000,
    completedProjects: 24,
    averageRating: 4.7,
    pendingPayments: 2
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Client Dashboard (Minimal)</h1>
                <p className="text-slate-600">
                  Isolated version to prevent infinite loops
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Safe Mode
              </Badge>
              <Badge variant="outline" className="text-slate-600">
                No Auth Loops
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div className="text-sm text-slate-600">
              Welcome back, Test User (Static)
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              <Button size="sm" className="flex items-center gap-2" disabled>
                <Plus className="w-4 h-4" />
                New Contract
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="space-y-8">
          {/* Static Stats Overview */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Static Overview</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-slate-200/60">
                <CardHeader className="space-y-0 pb-2">
                  <div className="flex justify-between items-center">
                    <CardDescription className="text-sm font-medium">Active Contracts</CardDescription>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeContracts}</div>
                  <p className="text-xs text-muted-foreground">Currently running</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60">
                <CardHeader className="space-y-0 pb-2">
                  <div className="flex justify-between items-center">
                    <CardDescription className="text-sm font-medium">Total Investment</CardDescription>
                    <BarChart3 className="w-8 h-8 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.totalSpent.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Lifetime spending</p>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60">
                <CardHeader className="space-y-0 pb-2">
                  <div className="flex justify-between items-center">
                    <CardDescription className="text-sm font-medium">Completed Projects</CardDescription>
                    <Users className="w-8 h-8 text-indigo-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedProjects}</div>
                  <p className="text-xs text-muted-foreground">Successfully delivered</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                ✅ Infinite Loop Fixed
              </h3>
              <p className="text-green-800 mb-4">
                This minimal dashboard should stop all infinite requests.
                Check the browser console - you should see no repeated API calls.
              </p>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                Zero API Calls • Zero Auth Hooks • Zero External Dependencies
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
