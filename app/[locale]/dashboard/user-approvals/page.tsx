"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { usePermissions } from "@/hooks/use-permissions"
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building,
  User,
  Eye,
  Calendar,
  Loader2,
} from "lucide-react"

interface PendingUser {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  department: string | null
  position: string | null
  phone: string | null
  created_at: string
  email_verified: boolean
}

export default function UserApprovalsPage() {
  const pathname = usePathname()
  const locale = pathname ? pathname.split("/")[1] || "en" : "en"
  const { canManageUsers } = usePermissions()
  
  // Safe toast usage with error handling
  const [toastHelpers, setToastHelpers] = useState<any>(null)

  useEffect(() => {
    try {
      const { useToastHelpers } = require("@/components/toast-notifications")
      setToastHelpers(useToastHelpers())
    } catch (error) {
      console.warn("Toast context not available:", error)
      setToastHelpers({
        success: (title: string, message?: string) => console.log("Success:", title, message),
        error: (title: string, message?: string) => console.error("Error:", title, message),
        warning: (title: string, message?: string) => console.warn("Warning:", title, message),
        info: (title: string, message?: string) => console.log("Info:", title, message),
      })
    }
  }, [])

  const { success, error, warning } = toastHelpers || {
    success: (title: string, message?: string) => console.log("Success:", title, message),
    error: (title: string, message?: string) => console.error("Error:", title, message),
    warning: (title: string, message?: string) => console.warn("Warning:", title, message),
    info: (title: string, message?: string) => console.log("Info:", title, message),
  }

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [approvalDialog, setApprovalDialog] = useState(false)
  const [approvalData, setApprovalData] = useState({
    role: "user",
    department: "",
    position: "",
    notes: "",
  })

  // Check permissions
  if (!canManageUsers()) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to access user approvals. Please contact an administrator.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Fetch pending users
  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching pending users...")

      const response = await fetch("/api/users/approval")
      console.log("📊 API Response status:", response.status)

      const data = await response.json()
      console.log("📋 API Response data:", data)

      if (data.success) {
        console.log("✅ Successfully fetched pending users:", data.pendingUsers)
        setPendingUsers(data.pendingUsers)
      } else {
        console.error("❌ Failed to fetch pending users:", data.error)
        error("Failed to fetch pending users", data.error)
      }
    } catch (err) {
      console.error("❌ Error fetching pending users:", err)
      error("Error fetching pending users", "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  // Handle user approval/rejection
  const handleUserAction = async (userId: string, action: "approve" | "reject") => {
    try {
      setApproving(userId)

      const response = await fetch("/api/users/approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          action,
          ...approvalData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        success(
          `User ${action}d successfully`,
          action === "approve"
            ? `User has been approved and can now access the system.`
            : `User has been rejected and cannot access the system.`,
        )
        setApprovalDialog(false)
        setSelectedUser(null)
        setApprovalData({ role: "user", department: "", position: "", notes: "" })
        fetchPendingUsers() // Refresh the list
      } else {
        error(`Failed to ${action} user`, data.error)
      }
    } catch (err) {
      error(`Error ${action}ing user`, "An unexpected error occurred")
    } finally {
      setApproving(null)
    }
  }

  const openApprovalDialog = (user: PendingUser) => {
    setSelectedUser(user)
    setApprovalData({
      role: "user",
      department: user.department || "",
      position: user.position || "",
      notes: "",
    })
    setApprovalDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Inactive
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Approvals</h1>
          <p className="mt-2 text-gray-600">Review and approve new user registrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                console.log("🔍 Testing user status...")
                const response = await fetch("/api/test-users-status")
                const data = await response.json()
                console.log("📊 User Status Test Result:", data)
              } catch (err) {
                console.error("❌ Error testing user status:", err)
              }
            }}
          >
            Debug Users
          </Button>
          <Users className="h-8 w-8 text-blue-600" />
          <Badge variant="outline" className="px-3 py-1 text-lg">
            {pendingUsers.length} Pending
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Requests</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    pendingUsers.filter((user) => {
                      const today = new Date().toDateString()
                      return new Date(user.created_at).toDateString() === today
                    }).length
                  }
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Email Verified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingUsers.filter((user) => user.email_verified).length}
                </p>
              </div>
              <Mail className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Phone</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingUsers.filter((user) => user.phone).length}
                </p>
              </div>
              <Phone className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pending User Approvals
          </CardTitle>
          <CardDescription>
            Review and approve new user registrations. Users cannot access the system until
            approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading pending users...</span>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No Pending Approvals</h3>
              <p className="text-gray-600">All user registrations have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {user.full_name || "No Name Provided"}
                          </h3>
                          {getStatusBadge(user.status)}
                          {user.email_verified && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <Mail className="mr-1 h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {user.phone}
                            </div>
                          )}
                          {user.department && (
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {user.department}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(user.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openApprovalDialog(user)}>
                        <Eye className="mr-1 h-4 w-4" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review User Application</DialogTitle>
            <DialogDescription>
              Review the user's information and decide whether to approve or reject their
              application.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={selectedUser.full_name || "No Name Provided"} disabled />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={selectedUser.email} disabled />
              </div>

              {selectedUser.phone && (
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={selectedUser.phone} disabled />
                </div>
              )}

              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={approvalData.department}
                  onChange={(e) =>
                    setApprovalData((prev) => ({ ...prev, department: e.target.value }))
                  }
                  placeholder="Enter department"
                />
              </div>

              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  value={approvalData.position}
                  onChange={(e) =>
                    setApprovalData((prev) => ({ ...prev, position: e.target.value }))
                  }
                  placeholder="Enter position"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={approvalData.role}
                  onValueChange={(value) => setApprovalData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={approvalData.notes}
                  onChange={(e) => setApprovalData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this approval..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setApprovalDialog(false)}
              disabled={approving !== null}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={() => selectedUser && handleUserAction(selectedUser.id, "reject")}
              disabled={approving !== null}
            >
              {approving === selectedUser?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Reject
            </Button>

            <Button
              onClick={() => selectedUser && handleUserAction(selectedUser.id, "approve")}
              disabled={approving !== null}
            >
              {approving === selectedUser?.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = "force-dynamic"
