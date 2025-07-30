import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

import "server-only" // Mark this module as server-only
import type {
  AdminAction,
  AuditLog,
  DashboardAnalytics,
  Notification,
  PendingReview,
  ServerActionResponse,
  User,
} from "./dashboard-types"

const createSupabaseClient = async () => {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name)
          return cookie?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          await cookieStore.set({ name, value, ...options })
        },
        async remove(name: string, options: CookieOptions) {
          await cookieStore.set({ name, value: "", ...options })
        },
      },
    },
  )
}

// Server-only implementations
export async function getDashboardAnalyticsSrv(): Promise<
  ServerActionResponse<DashboardAnalytics>
> {
  const supabase = await createSupabaseClient()

  try {
    // Get contract counts
    const { data: contracts, error: contractsError } = await supabase
      .from("contracts")
      .select("id, status, created_at, contract_value")

    if (contractsError) {
      console.error("Error fetching contracts:", contractsError)
      return {
        success: false,
        message: `Failed to fetch contracts: ${contractsError.message}`,
      }
    }

    // Get parties count
    const { count: totalParties, error: partiesError } = await supabase
      .from("parties")
      .select("*", { count: "exact", head: true })

    if (partiesError) {
      console.error("Error fetching parties:", partiesError)
      return {
        success: false,
        message: `Failed to fetch parties: ${partiesError.message}`,
      }
    }

    // Get promoters count
    const { count: totalPromoters, error: promotersError } = await supabase
      .from("promoters")
      .select("*", { count: "exact", head: true })

    if (promotersError) {
      console.error("Error fetching promoters:", promotersError)
      return {
        success: false,
        message: `Failed to fetch promoters: ${promotersError.message}`,
      }
    }

    // Calculate analytics
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const totalContracts = contracts?.length || 0
    const activeContracts = contracts?.filter((c) => c.status === "active").length || 0
    const pendingContracts = contracts?.filter((c) => c.status === "pending").length || 0
    const completedContracts = contracts?.filter((c) => c.status === "completed").length || 0
    const failedContracts = contracts?.filter((c) => c.status === "failed").length || 0
    const draftContracts = contracts?.filter((c) => c.status === "draft").length || 0
    const expiredContracts = contracts?.filter((c) => c.status === "expired").length || 0

    const contractsThisMonth =
      contracts?.filter((c) => c.created_at && new Date(c.created_at) >= thisMonth).length || 0

    const contractsLastMonth =
      contracts?.filter(
        (c) =>
          c.created_at && new Date(c.created_at) >= lastMonth && new Date(c.created_at) < thisMonth,
      ).length || 0

    const revenueThisMonth =
      contracts
        ?.filter((c) => c.created_at && new Date(c.created_at) >= thisMonth && c.contract_value)
        .reduce((sum, c) => sum + (c.contract_value || 0), 0) || 0

    const revenueLastMonth =
      contracts
        ?.filter(
          (c) =>
            c.created_at &&
            new Date(c.created_at) >= lastMonth &&
            new Date(c.created_at) < thisMonth &&
            c.contract_value,
        )
        .reduce((sum, c) => sum + (c.contract_value || 0), 0) || 0

    const totalRevenue = contracts?.reduce((sum, c) => sum + (c.contract_value || 0), 0) || 0

    const analyticsData: DashboardAnalytics = {
      total_contracts: totalContracts,
      active_contracts: activeContracts,
      pending_contracts: pendingContracts,
      completed_contracts: completedContracts,
      failed_contracts: failedContracts,
      contracts_this_month: contractsThisMonth,
      contracts_last_month: contractsLastMonth,
      average_processing_time: 0, // Calculate based on actual data when needed
      success_rate: totalContracts > 0 ? (completedContracts / totalContracts) * 100 : 0,
      generated_contracts: totalContracts,
      draft_contracts: draftContracts,
      expired_contracts: expiredContracts,
      total_parties: totalParties || 0,
      total_promoters: totalPromoters || 0,
      active_promoters: totalPromoters || 0, // Calculate based on actual status when needed
      active_parties: totalParties || 0, // Calculate based on actual status when needed
      revenue_this_month: revenueThisMonth,
      revenue_last_month: revenueLastMonth,
      total_revenue: totalRevenue,
      growth_percentage:
        contractsLastMonth > 0
          ? ((contractsThisMonth - contractsLastMonth) / contractsLastMonth) * 100
          : 0,
      upcoming_expirations: 0, // Calculate based on contract end dates when needed
      monthly_trends: [], // Calculate based on historical data when needed
      status_distribution: [
        { name: "Active", value: activeContracts },
        { name: "Pending", value: pendingContracts },
        { name: "Completed", value: completedContracts },
        { name: "Failed", value: failedContracts },
        { name: "Draft", value: draftContracts },
        { name: "Expired", value: expiredContracts },
      ],
      recent_activity: [], // Fetch from audit logs when needed
    }

    return {
      success: true,
      message: "Dashboard analytics fetched successfully.",
      data: analyticsData,
    }
  } catch (error) {
    console.error("Error in getDashboardAnalytics:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${(error as Error).message}`,
    }
  }
}

export { getDashboardAnalyticsSrv }

// Add other server-only implementations
export async function getPendingReviewsSrv(): Promise<ServerActionResponse<PendingReview[]>> {
  const supabase = await createSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("id, status, updated_at, created_at")
      .in("status", ["pending", "processing", "Pending Review"])
      .order("updated_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching pending reviews:", error)
      return {
        success: false,
        message: `Failed to fetch pending reviews: ${error.message}`,
      }
    }

    const reviews: PendingReview[] = (data || []).map((contract) => ({
      id: contract.id,
      title: `Contract ${contract.id}`,
      type: "contract",
      description: `Contract pending since ${new Date(contract.created_at || Date.now()).toLocaleDateString()}`,
      priority: "medium",
      created_at: contract.created_at || new Date().toISOString(),
      updated_at: contract.updated_at || null,
    }))

    return {
      success: true,
      message: "Pending reviews fetched successfully.",
      data: reviews,
    }
  } catch (error) {
    console.error("Error in getPendingReviews:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${(error as Error).message}`,
    }
  }
}

export async function getAdminActionsSrv(): Promise<ServerActionResponse<AdminAction[]>> {
  const supabase = await createSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select(
        `
        id, action, created_at, user_id, details, entity_type, entity_id
      `,
      )
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching admin actions:", error)
      return {
        success: false,
        message: `Failed to fetch admin actions: ${error.message}`,
      }
    }

    const adminActions: AdminAction[] = (data || []).map((log) => ({
      id: log.id.toString(),
      action: log.action || "unknown",
      created_at: log.created_at || new Date().toISOString(),
      user_id: log.user_id || "",
      details: log.details ? JSON.stringify(log.details) : "",
      resource_type: log.entity_type || "unknown",
      resource_id: log.entity_id?.toString() || "unknown",
      user: null,
    }))

    return {
      success: true,
      message: "Admin actions fetched successfully.",
      data: adminActions,
    }
  } catch (error) {
    console.error("Error in getAdminActions:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${(error as Error).message}`,
    }
  }
}

export async function getAuditLogsSrv(): Promise<ServerActionResponse<AuditLog[]>> {
  const supabase = await createSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select(
        `
        id, action, created_at, user_id, details, entity_type, entity_id
      `,
      )
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching audit logs:", error)
      return { success: false, message: `Failed to fetch audit logs: ${error.message}` }
    }

    const auditLogs: AuditLog[] = (data || []).map((log) => ({
      id: log.id.toString(),
      action: log.action || "unknown",
      created_at: log.created_at || new Date().toISOString(),
      user_id: log.user_id || "",
      details: log.details ? JSON.stringify(log.details) : "",
      entity_type: log.entity_type || "unknown",
      entity_id: log.entity_id?.toString() || "unknown",
      user: null,
    }))

    return { success: true, data: auditLogs, message: "Audit logs fetched successfully." }
  } catch (error) {
    console.error("Error in getAuditLogs:", error)
    return { success: false, message: `An unexpected error occurred: ${(error as Error).message}` }
  }
}

export async function getNotificationsSrv(): Promise<ServerActionResponse<Notification[]>> {
  const supabase = await createSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching notifications:", error)
      return { success: false, message: `Failed to fetch notifications: ${error.message}` }
    }

    const notifications: Notification[] = (data || []).map((n) => ({
      id: n.id.toString(),
      message: n.message || "",
      created_at: n.created_at || new Date().toISOString(),
      isRead: n.is_read || false,
      type: (n.type as "success" | "error" | "warning" | "info" | "default") || "info",
      user_id: n.user_id || "",
      timestamp: n.created_at || new Date().toISOString(),
    }))

    return { success: true, data: notifications, message: "Notifications fetched successfully." }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return { success: false, message: `An unexpected error occurred: ${(error as Error).message}` }
  }
}

export async function getUsersSrv(): Promise<ServerActionResponse<User[]>> {
  const supabase = await createSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, created_at")
      .limit(20)

    if (error) {
      console.error("Error fetching users:", error)
      return { success: false, message: `Failed to fetch users: ${error.message}` }
    }

    const users: User[] = (data || []).map((u) => ({
      id: u.id,
      email: u.email || "",
      role: u.role || "User",
      created_at: u.created_at || new Date().toISOString(),
    }))

    return { success: true, data: users, message: "Users fetched successfully." }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { success: false, message: `An unexpected error occurred: ${(error as Error).message}` }
  }
}
