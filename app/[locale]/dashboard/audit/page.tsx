"use client"

import { useState, useEffect } from "react"
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
  TableRow,
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
  Building2,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AuditLog {
  id: string
  user_id?: string | null
  action?: string | null
  entity_type?: string | null
  entity_id?: number | null
  details?: string | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
  user?: {
    full_name?: string | null
  } | null
}

export default function DashboardAuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch("/api/audit-logs")

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch audit logs")
      }

      setAuditLogs(data.data || [])
    } catch (error) {
      console.error("Error fetching audit logs:", error)
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getActionIcon = (action: string | null) => {
    if (!action) return <Shield className="h-4 w-4" />

    if (action.includes("Contract")) return <FileText className="h-4 w-4" />
    if (action.includes("User")) return <User className="h-4 w-4" />
    if (action.includes("Login")) return <Shield className="h-4 w-4" />
    if (action.includes("Settings")) return <Shield className="h-4 w-4" />
    return <Shield className="h-4 w-4" />
  }

  const getStatusBadge = (action: string | null) => {
    if (!action) return <Badge variant="secondary">Unknown</Badge>

    if (action.includes("Failed")) {
      return <Badge variant="destructive">Failed</Badge>
    }
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Success
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">View system audit logs and activity tracking</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by action, user, or IP address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>System activity and user actions</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? "No audit logs match your search" : "No audit logs found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action || null)}
                        <span className="font-medium">{log.action || "Unknown Action"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.user?.full_name || log.user_id || "Unknown User"}</TableCell>
                    <TableCell>
                      {log.entity_type
                        ? `${log.entity_type}${log.entity_id ? ` #${log.entity_id}` : ""}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>{log.ip_address || "Unknown"}</TableCell>
                    <TableCell>{formatTimestamp(log.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(log.action || null)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
