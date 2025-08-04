"use client"

import { useEffect, useState, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { DatePickerWithManualInput } from "@/components/date-picker-with-manual-input"
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  BellRing,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Link as LinkIcon,
} from "lucide-react"
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from "date-fns"
import clsx from "clsx"
import { toast } from "@/hooks/use-toast"

import { NotificationItem } from "@/lib/dashboard-types"

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  default: BellRing,
}

const getIconColor = (type: string) => {
  if (type === "success") return "text-green-500"
  if (type === "error") return "text-red-500"
  if (type === "warning") return "text-orange-500"
  return "text-blue-500"
}

const NOTIF_TYPES = ["success", "error", "warning", "info"]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [readFilter, setReadFilter] = useState("")
  const [userFilter, setUserFilter] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null)
  const [showModal, setShowModal] = useState(false)
  const PAGE_SIZE = 10

  // Debug: log mount/unmount
  useEffect(() => {
    console.log("NotificationsPage mounted")
    return () => {
      console.log("NotificationsPage unmounted")
    }
  }, [])

  // Fetch notifications and subscribe to real-time updates
  useEffect(() => {
    let ignore = false
    async function fetchNotifications() {
      setLoading(true)
      setError(null)
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from("notifications")
          .select("id, type, message, created_at, user_email, related_contract_id, is_read")
          .order("created_at", { ascending: false })
        if (error) throw error
        if (!ignore) {
          // Transform the data to match NotificationItem interface
          const transformedData: NotificationItem[] = (data || []).map((notification: any) => ({
            id: notification.id.toString(), // Convert number to string
            type:
              (notification.type as "success" | "error" | "warning" | "info" | "default") ||
              "default", // Ensure valid type
            message: notification.message || "", // Ensure message is not null
            created_at: notification.created_at || new Date().toISOString(), // Ensure created_at is not null
            user_email: notification.user_email || undefined,
            related_contract_id: notification.related_contract_id?.toString() || undefined,
            is_read: notification.is_read || false,
            isRead: notification.is_read || false, // Add compatibility field
          }))
          setNotifications(transformedData)
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.message || "Failed to fetch notifications")
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchNotifications()
    // Real-time subscription
    const supabase = getSupabaseClient()
    const channel = supabase
      .channel("public:notifications:feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        if (!ignore) {
          fetchNotifications()
        }
      })
      .subscribe()

    return () => {
      ignore = true
      supabase.removeChannel(channel)
    }
  }, [])

  // Get unique user emails for filter
  const userOptions = useMemo(() => {
    const emails = notifications
      .map((n) => n.user_email)
      .filter(Boolean)
      .filter((email, index, arr) => arr.indexOf(email) === index)
    return emails as string[]
  }, [notifications])

  // Filter notifications
  const filtered = useMemo(() => {
    return Array.isArray(notifications) ? notifications.filter((notif) => {
      const matchesSearch =
        !search ||
        notif.message.toLowerCase().includes(search.toLowerCase()) ||
        (notif.user_email && notif.user_email.toLowerCase().includes(search.toLowerCase()))

      const matchesType = !typeFilter || notif.type === typeFilter

      const matchesRead =
        !readFilter ||
        (readFilter === "read" && notif.is_read) ||
        (readFilter === "unread" && !notif.is_read)

      const matchesUser = !userFilter || notif.user_email === userFilter

      const matchesDate =
        (!startDate && !endDate) ||
        ((!startDate || isAfter(parseISO(notif.created_at), startDate)) &&
          (!endDate || isBefore(parseISO(notif.created_at), endDate)))

      return matchesSearch && matchesType && matchesRead && matchesUser && matchesDate
    }) : []
  }, [notifications, search, typeFilter, readFilter, userFilter, startDate, endDate])

  // Paginate filtered results
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length],
  )

  // Toggle read status
  const toggleRead = async (notif: NotificationItem) => {
    setIsUpdating(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: !notif.is_read })
        .eq("id", parseInt(notif.id))

      if (error) throw error

      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: !n.is_read } : n)),
      )

      toast({
        title: notif.is_read ? "Marked as unread" : "Marked as read",
        description: `Notification ${notif.is_read ? "marked as unread" : "marked as read"}`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update notification",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    setIsUpdating(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("notifications").update({ is_read: true }).neq("id", 0)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast({
        title: "All marked as read",
        description: "All notifications have been marked as read",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to mark all as read",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Clear all notifications
  const clearAll = async () => {
    setIsUpdating(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("notifications").delete().neq("id", 0)
      if (error) throw error

      setNotifications([])
      toast({
        title: "All cleared",
        description: "All notifications have been cleared",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to clear notifications",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "id",
      "type",
      "message",
      "created_at",
      "user_email",
      "related_contract_id",
      "related_entity_id",
      "related_entity_type",
      "is_read",
    ]
    const rows = filtered.map((n) =>
      headers
        .map((h) => {
          const value = (n as any)[h]
          return value !== undefined && value !== null ? value : ""
        })
        .join(","),
    )
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `notifications-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, readFilter, userFilter, startDate, endDate])

  // Reset page if current page is beyond total pages
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages)
    }
  }, [totalPages, page])

  return (
    <div className="space-y-6 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            All Notifications / جميع الإشعارات
          </CardTitle>
          <CardDescription>View, search, and manage all system notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Banner */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">Error loading notifications:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Filters and Actions */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-56 pl-10"
                  aria-label="Search notifications"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Filter by type"
                >
                  <option value="">All Types</option>
                  {NOTIF_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value)}
                  className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Filter by read/unread"
                >
                  <option value="">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Filter by user"
                >
                  <option value="">All Users</option>
                  {userOptions.map((email) => (
                    <option key={email} value={email}>
                      {email}
                    </option>
                  ))}
                </select>
                <DatePickerWithManualInput
                  date={startDate}
                  setDate={setStartDate}
                  placeholder="Start date"
                  aria-label="Filter by start date"
                />
                <DatePickerWithManualInput
                  date={endDate}
                  setDate={setEndDate}
                  placeholder="End date"
                  aria-label="Filter by end date"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={markAllAsRead}
                disabled={notifications.every((n) => n.is_read) || isUpdating}
                aria-label="Mark all as read"
              >
                <Eye className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
              <Button
                variant="destructive"
                onClick={clearAll}
                disabled={notifications.length === 0 || isUpdating}
                aria-label="Clear all notifications"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear all
              </Button>
              <Button variant="outline" onClick={exportToCSV} aria-label="Export to CSV">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading notifications...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <BellRing className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">No notifications found</h3>
              <p className="max-w-sm text-gray-500">
                {search || typeFilter || readFilter || userFilter || startDate || endDate
                  ? "Try adjusting your filters to see more results."
                  : "You're all caught up! New notifications will appear here."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200" role="table">
                  <thead className="sticky top-0 z-10 bg-background">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Message
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Time
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Related
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-background">
                    {paginated.map((notif) => {
                      const IconComponent = iconMap[notif.type] || iconMap.default
                      return (
                        <tr
                          key={notif.id}
                          tabIndex={0}
                          className={clsx(
                            "cursor-pointer transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary",
                            !notif.is_read ? "bg-blue-50 dark:bg-blue-900/10" : "bg-background",
                          )}
                          aria-label={`Notification: ${notif.message}`}
                          onClick={() => {
                            setSelectedNotif(notif)
                            setShowModal(true)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setSelectedNotif(notif)
                              setShowModal(true)
                            }
                          }}
                        >
                          <td className="whitespace-nowrap px-4 py-3">
                            <IconComponent
                              className={clsx("h-5 w-5", getIconColor(notif.type))}
                              aria-label={`${notif.type} notification`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-xs">
                              <p className="truncate text-sm text-gray-900" title={notif.message}>
                                {notif.message}
                              </p>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="font-mono text-sm text-gray-600">
                              {notif.user_email || "-"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(notif.created_at), {
                              addSuffix: true,
                            })}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {notif.is_read ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Read
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium font-semibold text-blue-800">
                                Unread
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {notif.related_contract_id ? (
                              <a
                                href={`/contracts/${notif.related_contract_id}`}
                                className="inline-flex items-center gap-1 text-blue-600 underline"
                                tabIndex={0}
                                aria-label="View related contract"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <LinkIcon className="h-4 w-4" />
                                Contract
                              </a>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleRead(notif)
                              }}
                              disabled={isUpdating}
                              aria-label={notif.is_read ? "Mark as unread" : "Mark as read"}
                            >
                              {notif.is_read ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent aria-modal="true" role="dialog">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>Full details for this notification.</DialogDescription>
          </DialogHeader>
          {selectedNotif && (
            <div className="space-y-2">
              <div>
                <b>Type:</b> {selectedNotif.type}
              </div>
              <div>
                <b>Message:</b> {selectedNotif.message}
              </div>
              <div>
                <b>User Email:</b> {selectedNotif.user_email || "-"}
              </div>
              <div>
                <b>Created At:</b>{" "}
                {format(new Date(selectedNotif.created_at), "yyyy-MM-dd HH:mm:ss")}
              </div>
              <div>
                <b>Status:</b> {selectedNotif.is_read ? "Read" : "Unread"}
              </div>
              {selectedNotif.related_contract_id && (
                <div>
                  <b>Related Contract:</b>{" "}
                  <a
                    href={`/contracts/${selectedNotif.related_contract_id}`}
                    className="text-blue-600 underline"
                  >
                    View Contract
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogClose asChild>
            <Button variant="outline" aria-label="Close details modal">
              Close
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}
