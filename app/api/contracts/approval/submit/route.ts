import { NextRequest, NextResponse } from "next/server"
import { withRBAC } from "@/lib/rbac/guard"
import { createClient } from "@/lib/supabase/server"

export const POST = withRBAC('contract:submit:own', async (request: NextRequest) => {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { contractId, notes } = body

    if (!contractId) {
      return NextResponse.json({ error: "Contract ID is required" }, { status: 400 })
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Check if user can submit this contract for review
    if (contract.created_by !== user.id && !(await hasAdminRole(user.id, supabase))) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Check if contract is in draft status
    if (contract.approval_status !== "draft") {
      return NextResponse.json(
        {
          error: "Contract must be in draft status to submit for review",
          current_status: contract.approval_status,
        },
        { status: 400 },
      )
    }

    // Get workflow configuration (using default for now)
    const routingRules = {
      parallel_reviews: true,
      auto_assign_reviewers: true,
      require_both_legal_hr: true,
    }

    // Get next reviewer (using admin for now since reviewer_roles table structure is unclear)
    const { data: adminUser } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single()

    if (!adminUser) {
      return NextResponse.json(
        {
          error: "No admin user found. Please contact administrator.",
        },
        { status: 400 },
      )
    }

    // Update contract status to legal review
    const { data: updatedContract, error: updateError } = await supabase
      .from("contracts")
      .update({
        approval_status: "legal_review",
        current_reviewer_id: adminUser.id,
        submitted_for_review_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)
      .select("*")
      .single()

    if (updateError) {
      console.error("Error updating contract status:", updateError)
      return NextResponse.json({ error: "Failed to submit contract for review" }, { status: 500 })
    }

    // Create approval record
    const { error: approvalError } = await supabase.from("contract_approvals").insert({
      contract_id: contractId,
      reviewer_id: adminUser.id,
      status: "legal_review",
      comments: notes || "Contract submitted for legal review",
      created_at: new Date().toISOString(),
    })

    if (approvalError) {
      console.error("Error creating approval record:", approvalError)
      return NextResponse.json({ error: "Failed to create approval record" }, { status: 500 })
    }

    // Send notification to reviewer
    await sendReviewNotification(adminUser.id, contractId, "legal_review", supabase)

    // Create audit log
    await createAuditLog(
      user.id,
      "contract_submitted_for_review",
      "contracts",
      contractId,
      {
        previous_status: "draft",
        new_status: "legal_review",
        reviewer_id: adminUser.id,
      },
      supabase,
    )

    return NextResponse.json({
      success: true,
      message: "Contract submitted for review successfully",
      data: {
        contract_id: contractId,
        new_status: "legal_review",
        reviewer_id: adminUser.id,
      },
    })
  } catch (error) {
    console.error("Error submitting contract for review:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
})

async function hasAdminRole(userId: string, supabase: any): Promise<boolean> {
  const { data: user } = await supabase.from("users").select("role").eq("id", userId).single()

  return user?.role === "admin"
}

async function sendReviewNotification(
  reviewerId: string,
  contractId: string,
  reviewStage: string,
  supabase: any,
) {
  try {
    await supabase.from("notifications").insert({
      user_id: reviewerId,
      type: "contract_review_required",
      title: "New Contract Review Required",
      message: `A contract has been submitted for ${reviewStage.replace("_", " ")} review`,
      data: { contract_id: contractId, review_stage: reviewStage },
    })
  } catch (error) {
    console.error("Error sending notification:", error)
  }
}

async function createAuditLog(
  userId: string,
  action: string,
  tableName: string,
  recordId: string,
  details: any,
  supabase: any,
) {
  try {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      new_values: details,
    })
  } catch (error) {
    console.error("Error creating audit log:", error)
  }
}
