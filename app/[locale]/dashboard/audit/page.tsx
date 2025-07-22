"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  User,
  FileText,
  Users,
  Building2
} from "lucide-react"

export default function DashboardAuditPage() {
  // Mock audit data
  const auditLogs = [
    {
      id: 1,
      timestamp: "2024-01-15 10:30:00",
      user: "admin@example.com",
      action: "Contract Created",
      resource: "Contract #CTR-001",
      ip: "192.168.1.100",
      status: "success"
    },
    {
      id: 2,
      timestamp: "2024-01-15 09:15:00",
      user: "manager@example.com",
      action: "User Updated",
      resource: "User Profile",
      ip: "192.168.1.101",
      status: "success"
    },
    {
      id: 3,
      timestamp: "2024-01-15 08:45:00",
      user: "user@example.com",
      action: "Login",
      resource: "Authentication",
      ip: "192.168.1.102",
      status: "success"
    },
    {
      id: 4,
      timestamp: "2024-01-14 16:20:00",
      user: "admin@example.com",
      action: "System Settings Updated",
      resource: "Configuration",
      ip: "192.168.1.100",
      status: "success"
    },
    {
      id: 5,
      timestamp: "2024-01-14 14:30:00",
      user: "unknown",
      action: "Failed Login Attempt",
      resource: "Authentication",
      ip: "192.168.1.105",
      status: "failed"
    }
  ]

  const getActionIcon = (action: string) => {
    if (action.includes("Contract")) return <FileText className="h-4 w-4" />
    if (action.includes("User")) return <User className="h-4 w-4" />
    if (action.includes("Login")) return <Shield className="h-4 w-4" />
    if (action.includes("Settings")) return <Shield className="h-4 w-4" />
    return <Shield className="h-4 w-4" />
  }

  const getStatusBadge = (status: string) => {
    return status === "success" ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>
    ) : (
      <Badge variant="destructive">Failed</Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          View system audit logs and activity tracking
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="search" placeholder="Search logs..." className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Input id="user" placeholder="Filter by user" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Input id="action" placeholder="Filter by action" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date Range</Label>
              <Input id="date" type="date" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button>Apply Filters</Button>
            <Button variant="outline">Clear</Button>
            <Button variant="outline" className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            System activity and user actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {log.timestamp}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {log.user}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      {log.action}
                    </div>
                  </TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.ip}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(log.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">
              +5 from yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              -2 from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Good</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}