"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Building2,
} from "lucide-react"

export default function DashboardReportsPage() {
  const reportTypes = [
    {
      id: "contracts",
      title: "Contract Reports",
      description: "Generate reports on contract performance and status",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "promoters",
      title: "Promoter Reports",
      description: "Analyze promoter performance and activity",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "parties",
      title: "Party Reports",
      description: "Reports on contract parties and organizations",
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "analytics",
      title: "Analytics Reports",
      description: "Comprehensive analytics and insights",
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  const recentReports = [
    {
      id: 1,
      name: "Monthly Contract Summary",
      type: "contracts",
      generated: "2024-01-15",
      status: "completed",
      size: "2.3 MB",
    },
    {
      id: 2,
      name: "Promoter Performance Q4 2023",
      type: "promoters",
      generated: "2024-01-14",
      status: "completed",
      size: "1.8 MB",
    },
    {
      id: 3,
      name: "System Activity Report",
      type: "analytics",
      generated: "2024-01-13",
      status: "processing",
      size: "4.1 MB",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and manage system reports</p>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map((report) => (
          <Card key={report.id} className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className={`w-fit rounded-lg p-2 ${report.bgColor}`}>
                <report.icon className={`h-6 w-6 ${report.color}`} />
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Generate Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Quick Report Generator
          </CardTitle>
          <CardDescription>Generate custom reports with specific parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <select
                id="report-type"
                className="w-full rounded-md border p-2"
                defaultValue=""
                aria-label="Select report type"
              >
                <option value="">Select report type</option>
                <option value="contracts">Contract Reports</option>
                <option value="promoters">Promoter Reports</option>
                <option value="parties">Party Reports</option>
                <option value="analytics">Analytics Reports</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input id="date-from" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input id="date-to" type="date" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Advanced Options
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Your recently generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-muted p-2">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Generated on {report.generated} • {report.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={report.status === "completed" ? "default" : "secondary"}>
                    {report.status === "completed" ? "Ready" : "Processing"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Statistics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+8 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-muted-foreground">Currently processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 GB</div>
            <p className="text-xs text-muted-foreground">+156 MB this month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
