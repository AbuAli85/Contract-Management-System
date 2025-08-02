"use client"

import { useEffect, useState, useCallback, lazy, Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Edit,
  Trash2,
  RefreshCw,
  UserPlus,
  Calendar,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Download,
  Upload,
  Shield,
  Lock,
  Users,
} from "lucide-react"
import { debounce } from "lodash"
import { usePendingUsersCount } from "@/hooks/use-pending-users"

// Lazy load components
const PermissionsManager = lazy(() => import("@/components/user-management/PermissionsManager"))
const CreateUserForm = lazy(() => import("@/components/user-management/create-user-form"))
const ChangePasswordForm = lazy(() => import("@/components/user-management/change-password-form"))

// TypeScript interfaces for better type safety
interface User {
  id: string
  email: string
  full_name?: string
  role: UserRole
  status: UserStatus
  avatar_url?: string
  created_at: string
  last_login?: string
  phone?: string
  department?: string
  position?: string
}

type UserRole = "admin" | "manager" | "user" | "viewer"
type UserStatus = "active" | "inactive" | "pending"

interface UserFormData {
  email: string
  full_name?: string
  role: UserRole
  status: UserStatus
  avatar_url?: string
  phone?: string
  department?: string
  position?: string
}

// Constants
const ROLES: UserRole[] = ["admin", "manager", "user", "viewer"]
const STATUS: UserStatus[] = ["active", "inactive", "pending"]
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
const DEPARTMENTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations", "Support"]
const POSITIONS = ["Manager", "Senior", "Junior", "Lead", "Director", "VP", "C-Level"]

// Utility functions
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getInitials(email: string): string {
  return email.substring(0, 2).toUpperCase()
}

function relativeTime(date: string | null): string {
  if (!date) return "Never"
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function NewUsersPage() {
  // Hooks
  const { count: pendingUsersCount } = usePendingUsersCount()
  
  // Basic state
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  // Form states
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    full_name: "",
    role: "user",
    status: "active",
    avatar_url: "",
    phone: "",
    department: "",
    position: "",
  })
  const [formError, setFormError] = useState<string | null>(null)

  // Loading states
  const [addLoading, setAddLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)

  // Filter and search states
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  // Pagination states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1])

  // Sorting states
  const [sortBy, setSortBy] = useState<keyof User>("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
  })

  const { toast } = useToast()

  // Simulate current user role (in real app, get from auth context)
  const currentUserRole: UserRole = "admin"

  // Filtered and paginated users - using simple state instead of useMemo
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([])

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Update filtered users whenever dependencies change
  useEffect(() => {
    try {
      // Start with users array
      let result = Array.isArray(users) ? [...users] : []

      // Apply search filter
      if (search && typeof search === "string") {
        const searchLower = search.toLowerCase()
        const searchResults: User[] = []
        for (let i = 0; i < result.length; i++) {
          const user = result[i]
          if (user && typeof user === "object") {
            const emailMatch =
              user.email &&
              typeof user.email === "string" &&
              user.email.toLowerCase().includes(searchLower)
            const nameMatch =
              user.full_name &&
              typeof user.full_name === "string" &&
              user.full_name.toLowerCase().includes(searchLower)
            const roleMatch =
              user.role &&
              typeof user.role === "string" &&
              user.role.toLowerCase().includes(searchLower)
            const departmentMatch =
              user.department &&
              typeof user.department === "string" &&
              user.department.toLowerCase().includes(searchLower)
            if (emailMatch || nameMatch || roleMatch || departmentMatch) {
              searchResults.push(user)
            }
          }
        }
        result = searchResults
      }

      // Apply role filter
      if (roleFilter && typeof roleFilter === "string" && roleFilter !== "all") {
        const roleResults: User[] = []
        for (let i = 0; i < result.length; i++) {
          const user = result[i]
          if (user && typeof user === "object" && user.role === roleFilter) {
            roleResults.push(user)
          }
        }
        result = roleResults
      }

      // Apply status filter
      if (statusFilter && typeof statusFilter === "string" && statusFilter !== "all") {
        const statusResults: User[] = []
        for (let i = 0; i < result.length; i++) {
          const user = result[i]
          if (user && typeof user === "object" && user.status === statusFilter) {
            statusResults.push(user)
          }
        }
        result = statusResults
      }

      // Apply department filter
      if (departmentFilter && typeof departmentFilter === "string" && departmentFilter !== "all") {
        const departmentResults: User[] = []
        for (let i = 0; i < result.length; i++) {
          const user = result[i]
          if (user && typeof user === "object" && user.department === departmentFilter) {
            departmentResults.push(user)
          }
        }
        result = departmentResults
      }

      // Apply sorting
      if (Array.isArray(result)) {
        result = [...result].sort((a, b) => {
          if (!a || !b) return 0

          let valA = a[sortBy]
          let valB = b[sortBy]

          // Handle null/undefined values
          if (valA === null || valA === undefined) valA = ""
          if (valB === null || valB === undefined) valB = ""

          // Handle date sorting
          if (sortBy === "created_at" || sortBy === "last_login") {
            const timeA = valA ? new Date(valA as string).getTime() : 0
            const timeB = valB ? new Date(valB as string).getTime() : 0
            return sortDir === "asc" ? timeA - timeB : timeB - timeA
          }

          // Handle string sorting
          if (typeof valA === "string" && typeof valB === "string") {
            return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
          }

          // Handle number sorting
          if (typeof valA === "number" && typeof valB === "number") {
            return sortDir === "asc" ? valA - valB : valB - valA
          }
          return 0
        })
      }

      // Ensure result is always an array
      if (!Array.isArray(result)) {
        console.error("Result is not an array after processing:", result)
        setFilteredUsers([])
        setPaginatedUsers([])
      } else {
        setFilteredUsers(result)

        // Update paginated users
        const start = (page - 1) * pageSize
        const paginated = result.slice(start, start + pageSize)
        setPaginatedUsers(Array.isArray(paginated) ? paginated : [])
      }
    } catch (error) {
      console.error("Error in filtering effect:", error)
      setFilteredUsers([])
      setPaginatedUsers([])
    }
  }, [users, search, roleFilter, statusFilter, departmentFilter, sortBy, sortDir, page, pageSize])

  // Update statistics when users change
  useEffect(() => {
    if (Array.isArray(users)) {
      setStats({
        total: users.length,
        active: users.filter((u) => u.status === "active").length,
        inactive: users.filter((u) => u.status === "inactive").length,
        pending: users.filter((u) => u.status === "pending").length,
      })
    }
  }, [users])

  // Fetch users
  const fetchUsers = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const response = await fetch("/api/users", {
          cache: "no-store",
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          let usersArray: User[] = data.users || data || []

          if (!Array.isArray(usersArray)) {
            console.warn("API returned non-array users data:", usersArray)
            usersArray = []
          }

          // Validate and filter users
          usersArray = usersArray.filter(
            (user) => user && typeof user === "object" && user.email && user.role && user.status,
          )

          setUsers(usersArray)
          if (showRefresh) {
            toast({
              title: "Users refreshed",
              description: `Loaded ${usersArray.length || 0} users`,
            })
          }
        } else {
          setError("Failed to fetch users")
          setUsers([])
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        setError("Failed to fetch users. Please check your connection and try again.")
        setUsers([])
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [toast],
  )

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearch(value)
      setPage(1)
    }, 300),
    [],
  )

  // Handle form submission
  const handleSubmit = useCallback(
    async (isEdit: boolean = false) => {
      setFormError(null)

      // Validate form
      if (!formData.email || !isValidEmail(formData.email)) {
        setFormError("Please enter a valid email address")
        return
      }

      if (!formData.role || !ROLES.includes(formData.role)) {
        setFormError("Please select a valid role")
        return
      }

      if (!formData.status || !STATUS.includes(formData.status)) {
        setFormError("Please select a valid status")
        return
      }

      try {
        if (isEdit) {
          setEditLoading(true)
          const response = await fetch("/api/users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              userId: selectedUser?.id,
              ...formData,
            }),
          })

          if (response.ok) {
            toast({
              title: "User updated",
              description: "User information has been updated successfully.",
            })
            setShowEditModal(false)
          } else {
            const error = await response.json()
            setFormError(error.error || "Failed to update user")
          }
        } else {
          setAddLoading(true)
          const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(formData),
          })

          if (response.ok) {
            toast({
              title: "User added",
              description: "New user has been added successfully.",
            })
            setShowAddModal(false)
          } else {
            const error = await response.json()
            setFormError(error.error || "Failed to create user")
          }
        }

        // Refresh users list
        await fetchUsers(true)

        // Reset form
        setFormData({
          email: "",
          full_name: "",
          role: "user",
          status: "active",
          avatar_url: "",
          phone: "",
          department: "",
          position: "",
        })
      } catch (error) {
        console.error("Error saving user:", error)
        setFormError("Failed to save user. Please try again.")
      } finally {
        setEditLoading(false)
        setAddLoading(false)
      }
    },
    [formData, selectedUser, fetchUsers, toast],
  )

  // Handle delete user
  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast({
          title: "User deleted",
          description: "User has been deleted successfully.",
        })
        setShowDeleteModal(false)
        await fetchUsers(true)
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }, [selectedUser, fetchUsers, toast])

  // Handle user approval/status change
  const handleApproveUser = useCallback(async (userId: string, status: string, role?: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status, role }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "User Status Updated",
          description: result.message || `User ${status === 'active' ? 'approved' : status === 'inactive' ? 'deactivated' : 'updated'} successfully.`,
        })
        await fetchUsers(true) // Refresh the users list
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update user status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      })
    }
  }, [fetchUsers, toast])

  // Handle bulk actions
  const handleBulkAction = useCallback(
    async (action: "delete" | "activate" | "deactivate") => {
      if (selectedUsers.size === 0) return

      setBulkLoading(true)
      try {
        // TODO: Implement bulk actions API call
        toast({
          title: "Bulk action completed",
          description: `${action} action applied to ${selectedUsers.size} users.`,
        })
        setSelectedUsers(new Set())
        setShowBulkActions(false)
        await fetchUsers(true)
      } catch (error) {
        console.error("Error performing bulk action:", error)
        toast({
          title: "Error",
          description: "Failed to perform bulk action. Please try again.",
          variant: "destructive",
        })
      } finally {
        setBulkLoading(false)
      }
    },
    [selectedUsers, fetchUsers, toast],
  )

  // Handle sorting
  const handleSort = useCallback(
    (column: keyof User) => {
      if (sortBy === column) {
        setSortDir(sortDir === "asc" ? "desc" : "asc")
      } else {
        setSortBy(column)
        setSortDir("asc")
      }
      setPage(1)
    },
    [sortBy, sortDir],
  )

  // Initial load
  useEffect(() => {
    fetchUsers()
    return () => {
      debouncedSearch.cancel()
    }
  }, [fetchUsers, debouncedSearch])

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))

  // Don't render anything until mounted to prevent hydration mismatches
  if (!mounted) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage users, roles, and permissions.</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 animate-spin" /> Loading...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/users/approvals">
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              User Approvals
              {pendingUsersCount > 0 && (
                <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                  {pendingUsersCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {["admin", "manager", "user"].includes(currentUserRole) && (
            <Button onClick={() => setShowAddModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <UserPlus className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-400" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            placeholder="Search users by email, name, role, or department..."
            value={search}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={departmentFilter}
          onValueChange={(value) => {
            setDepartmentFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
          <span className="text-sm font-medium">{selectedUsers.size} user(s) selected</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("activate")}
              disabled={bulkLoading}
            >
              Activate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction("deactivate")}
              disabled={bulkLoading}
            >
              Deactivate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkAction("delete")}
              disabled={bulkLoading}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 animate-spin" /> Loading users...
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left font-medium">
                        <input
                          type="checkbox"
                          checked={
                            selectedUsers.size === paginatedUsers.length &&
                            paginatedUsers.length > 0
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(new Set(paginatedUsers.map((u) => u.id)))
                            } else {
                              setSelectedUsers(new Set())
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="p-4 text-left font-medium">User</th>
                      <th
                        className="cursor-pointer p-4 text-left font-medium hover:bg-gray-50"
                        onClick={() => handleSort("role")}
                      >
                        <div className="flex items-center gap-1">
                          Role
                          {sortBy === "role" &&
                            (sortDir === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer p-4 text-left font-medium hover:bg-gray-50"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortBy === "status" &&
                            (sortDir === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th className="p-4 text-left font-medium">Department</th>
                      <th
                        className="cursor-pointer p-4 text-left font-medium hover:bg-gray-50"
                        onClick={() => handleSort("created_at")}
                      >
                        <div className="flex items-center gap-1">
                          Created
                          {sortBy === "created_at" &&
                            (sortDir === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      <th
                        className="cursor-pointer p-4 text-left font-medium hover:bg-gray-50"
                        onClick={() => handleSort("last_login")}
                      >
                        <div className="flex items-center gap-1">
                          Last Login
                          {sortBy === "last_login" &&
                            (sortDir === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </th>
                      {["admin", "manager", "user"].includes(currentUserRole) && (
                        <th className="p-4 text-right font-medium">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedUsers)
                              if (e.target.checked) {
                                newSelected.add(user.id)
                              } else {
                                newSelected.delete(user.id)
                              }
                              setSelectedUsers(newSelected)
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={user?.avatar_url || ""} />
                              <AvatarFallback>{getInitials(user?.email || "")}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.email}</p>
                              {user.full_name && (
                                <p className="text-sm text-gray-500">{user.full_name}</p>
                              )}
                              {user.position && (
                                <p className="text-xs text-gray-400">{user.position}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">{user.role}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {user.status === "active" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : user.status === "inactive" ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                            <Badge variant="outline">{user.status}</Badge>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{user.department || "-"}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{formatDate(user.created_at)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{relativeTime(user.last_login ?? null)}</span>
                          </div>
                        </td>
                        {["admin", "manager", "user"].includes(currentUserRole) && (
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {/* Approval buttons for pending users */}
                              {currentUserRole === "admin" && user.status === "pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApproveUser(user.id, "active", "user")}
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                    title="Approve as User"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleApproveUser(user.id, "inactive")}
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    title="Reject User"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              
                              {/* Status toggle buttons for active/inactive users */}
                              {currentUserRole === "admin" && user.status === "active" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApproveUser(user.id, "inactive")}
                                  className="text-red-600 hover:text-red-700"
                                  title="Deactivate User"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {currentUserRole === "admin" && user.status === "inactive" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApproveUser(user.id, "active")}
                                  className="text-green-600 hover:text-green-700"
                                  title="Reactivate User"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}

                              {currentUserRole === "admin" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setShowPermissionsModal(true)
                                  }}
                                  title="Manage Permissions"
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowChangePasswordModal(true)
                                }}
                                title="Change Password"
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setFormData({
                                    email: user.email,
                                    full_name: user.full_name || "",
                                    role: user.role,
                                    status: user.status,
                                    avatar_url: user?.avatar_url || "",
                                    phone: user.phone || "",
                                    department: user.department || "",
                                    position: user.position || "",
                                  })
                                  setShowEditModal(true)
                                }}
                                title="Edit User"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowDeleteModal(true)
                                }}
                                className="text-red-600 hover:text-red-700"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Showing {(page - 1) * pageSize + 1} to{" "}
                    {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length}{" "}
                    users
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-2 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <Suspense
        fallback={
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 animate-spin" />
                Loading create user form...
              </div>
            </DialogContent>
          </Dialog>
        }
      >
        <CreateUserForm
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onUserCreated={fetchUsers}
        />
      </Suspense>

      {/* Change Password Modal */}
      <Suspense
        fallback={
          <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
            <DialogContent>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 animate-spin" />
                Loading change password form...
              </div>
            </DialogContent>
          </Dialog>
        }
      >
        <ChangePasswordForm
          open={showChangePasswordModal}
          onOpenChange={setShowChangePasswordModal}
          userId={selectedUser?.id}
        />
      </Suspense>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Full Name</label>
                <Input
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Role *</label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Status *</label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as UserStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Department</label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Position</label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Phone</label>
                <Input
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Avatar URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                />
              </div>
            </div>
            {formError && <div className="text-sm text-red-600">{formError}</div>}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button disabled={editLoading} onClick={() => handleSubmit(true)}>
                {editLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update User"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete <strong>{selectedUser?.email}</strong>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={deleteLoading} onClick={handleDeleteUser}>
                {deleteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete User"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permissions Manager Modal */}
      <Suspense
        fallback={
          <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
            <DialogContent>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 animate-spin" />
                Loading permissions manager...
              </div>
            </DialogContent>
          </Dialog>
        }
      >
        <PermissionsManager
          user={selectedUser}
          open={showPermissionsModal}
          onOpenChange={setShowPermissionsModal}
          onPermissionsUpdate={fetchUsers}
        />
      </Suspense>
    </div>
  )
}
