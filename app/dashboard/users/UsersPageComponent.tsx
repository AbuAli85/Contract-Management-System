"use client"

import { useEffect, useState, useCallback } from "react"
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
} from "lucide-react"
import { debounce } from "lodash"

const ROLES = ["admin", "manager", "user", "viewer"]
const STATUS = ["active", "inactive", "pending"]
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getInitials(email: string) {
  return email.substring(0, 2).toUpperCase()
}

function relativeTime(date: string | null) {
  if (!date) return "Never"
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export default function UsersPageComponent() {
  // Basic state
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)

  // Form states
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState(ROLES[0])
  const [newStatus, setNewStatus] = useState(STATUS[0])
  const [newAvatarUrl, setNewAvatarUrl] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  // Loading states
  const [addLoading, setAddLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Filter and search states
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Pagination states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1])

  // Sorting states
  const [sortBy, setSortBy] = useState("created_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const { toast } = useToast()

  // Simulate current user role
  const currentUserRole = "admin"

  // Filtered and paginated users - using simple state instead of useMemo
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [paginatedUsers, setPaginatedUsers] = useState<any[]>([])

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
        const searchResults = []
        for (let i = 0; i < result.length; i++) {
          const user = result[i]
          if (user && typeof user === "object") {
            const emailMatch =
              user.email &&
              typeof user.email === "string" &&
              user.email.toLowerCase().includes(searchLower)
            const roleMatch =
              user.role &&
              typeof user.role === "string" &&
              user.role.toLowerCase().includes(searchLower)
            if (emailMatch || roleMatch) {
              searchResults.push(user)
            }
          }
        }
        result = searchResults
      }

      // Apply role filter
      if (roleFilter && typeof roleFilter === "string") {
        const roleResults = []
        for (let i = 0; i < result.length; i++) {
          const user = result[i]
          if (user && typeof user === "object" && user.role === roleFilter) {
            roleResults.push(user)
          }
        }
        result = roleResults
      }

      // Apply status filter
      if (statusFilter && typeof statusFilter === "string") {
        const statusResults = []
        for (let i = 0; i < result.length; i++) {
          const user = result[i]
          if (user && typeof user === "object" && user.status === statusFilter) {
            statusResults.push(user)
          }
        }
        result = statusResults
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
            valA = valA ? new Date(valA).getTime() : 0
            valB = valB ? new Date(valB).getTime() : 0
          }

          // Handle string sorting
          if (typeof valA === "string" && typeof valB === "string") {
            return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA)
          }

          // Handle number sorting
          return sortDir === "asc" ? valA - valB : valB - valA
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
  }, [users, search, roleFilter, statusFilter, sortBy, sortDir, page, pageSize])

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
          let usersArray = data.users || data || []

          if (!Array.isArray(usersArray)) {
            console.warn("API returned non-array users data:", usersArray)
            usersArray = []
          }

          usersArray = usersArray.filter(
            (user: any) => user && typeof user === "object" && user.email && user.role,
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

  // Initial load
  useEffect(() => {
    fetchUsers()
    return () => {
      debouncedSearch.cancel()
    }
  }, [])

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
            placeholder="Search users..."
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
            <SelectItem value="">All roles</SelectItem>
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
            <SelectItem value="">All statuses</SelectItem>
            {STATUS.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                      <th className="p-4 text-left font-medium">User</th>
                      <th className="p-4 text-left font-medium">Role</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-left font-medium">Created</th>
                      <th className="p-4 text-left font-medium">Last Login</th>
                      {["admin", "manager", "user"].includes(currentUserRole) && (
                        <th className="p-4 text-right font-medium">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
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
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{relativeTime(user.created_at)}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{relativeTime(user.last_login)}</span>
                          </div>
                        </td>
                        {["admin", "manager", "user"].includes(currentUserRole) && (
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setNewEmail(user.email)
                                  setNewRole(user.role)
                                  setNewStatus(user.status)
                                  setNewAvatarUrl(user?.avatar_url || "")
                                  setShowEditModal(true)
                                }}
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

      {/* Add User Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
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
              <label className="mb-2 block text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
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
            <div>
              <label className="mb-2 block text-sm font-medium">Avatar URL (Optional)</label>
              <Input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={newAvatarUrl}
                onChange={(e) => setNewAvatarUrl(e.target.value)}
              />
            </div>
            {formError && <div className="text-sm text-red-600">{formError}</div>}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button disabled={addLoading}>
                {addLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add User"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
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
              <label className="mb-2 block text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
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
            <div>
              <label className="mb-2 block text-sm font-medium">Avatar URL (Optional)</label>
              <Input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={newAvatarUrl}
                onChange={(e) => setNewAvatarUrl(e.target.value)}
              />
            </div>
            {formError && <div className="text-sm text-red-600">{formError}</div>}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button disabled={editLoading}>
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
              Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={deleteLoading}>
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
    </div>
  )
}
