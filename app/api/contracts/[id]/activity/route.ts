// app/api/contracts/[id]/activity/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id
    const supabase = createClient()

    // Get contract basic info
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        id,
        created_at,
        updated_at,
        status,
        created_by,
        updated_by
      `)
      .eq("id", contractId)
      .single()

    if (contractError) {
      return NextResponse.json({ error: contractError.message }, { status: 400 })
    }

    // Get user information for creators/updaters
    const userIds = [contract.created_by, contract.updated_by].filter(Boolean)
    const { data: users } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, role")
      .in("id", userIds)

    // Get audit logs for this contract
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select(`
        id,
        action,
        description,
        created_at,
        user_id,
        metadata
      `)
      .eq("entity_type", "contract")
      .eq("entity_id", contractId)
      .order("created_at", { ascending: false })
      .limit(10)

    // Get notifications related to this contract
    const { data: notifications } = await supabase
      .from("notifications")
      .select(`
        id,
        title,
        message,
        type,
        priority,
        status,
        created_at,
        due_date,
        assigned_to,
        created_by
      `)
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false })
      .limit(20)

    // Get tasks related to this contract
    const { data: tasks } = await supabase
      .from("contract_tasks")
      .select(`
        id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
        completed_at,
        created_at
      `)
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false })

    // Map users for easy lookup
    const userMap = users?.reduce((acc: Record<string, any>, user: any) => {
      acc[user.id] = user
      return acc
    }, {} as Record<string, any>) || {}

    // Format response
    const response = {
      contract: {
        id: contract.id,
        status: contract.status,
        created_at: contract.created_at,
        updated_at: contract.updated_at
      },
      activity: {
        addedBy: userMap[contract.created_by] || null,
        lastUpdatedBy: userMap[contract.updated_by] || null,
        auditLogs: auditLogs?.map((log: any) => ({
          id: log.id,
          action: log.action,
          description: log.description,
          timestamp: log.created_at,
          user: userMap[log.user_id] || null,
          metadata: log.metadata
        })) || [],
        notifications: notifications?.map((notif: any) => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          description: notif.message,
          priority: notif.priority,
          status: notif.status,
          dueDate: notif.due_date,
          assignedTo: userMap[notif.assigned_to]?.full_name || notif.assigned_to,
          createdBy: userMap[notif.created_by]?.full_name || notif.created_by,
          timestamp: notif.created_at
        })) || [],
        tasks: tasks?.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignee: userMap[task.assigned_to]?.full_name || task.assigned_to,
          dueDate: task.due_date,
          completedDate: task.completed_at,
          createdAt: task.created_at
        })) || []
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching contract activity:", error)
    return NextResponse.json(
      { error: "Failed to fetch contract activity" },
      { status: 500 }
    )
  }
}
