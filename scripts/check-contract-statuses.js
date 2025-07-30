const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

async function checkContractStatuses() {
  console.log("🔍 Checking contract statuses in database...")

  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase environment variables:")
      console.error("   - NEXT_PUBLIC_SUPABASE_URL")
      console.error("   - SUPABASE_SERVICE_ROLE_KEY")
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all contracts with their statuses
    const { data: contracts, error } = await supabase
      .from("contracts")
      .select("id, contract_number, status, approval_status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("❌ Error fetching contracts:", error)
      return
    }

    if (!contracts || contracts.length === 0) {
      console.log("❌ No contracts found in database")
      return
    }

    console.log(`📋 Found ${contracts.length} contracts:`)

    // Group by status
    const statusCounts = {}
    const approvalStatusCounts = {}

    contracts.forEach((contract) => {
      const status = contract.status || "null"
      const approvalStatus = contract.approval_status || "null"

      statusCounts[status] = (statusCounts[status] || 0) + 1
      approvalStatusCounts[approvalStatus] = (approvalStatusCounts[approvalStatus] || 0) + 1
    })

    console.log("\n📊 Contract Status Distribution:")
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} contracts`)
    })

    console.log("\n📊 Approval Status Distribution:")
    Object.entries(approvalStatusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} contracts`)
    })

    // Show sample contracts
    console.log("\n📋 Sample Contracts:")
    contracts.slice(0, 10).forEach((contract) => {
      console.log(
        `  - ${contract.contract_number || contract.id}: status="${contract.status}", approval_status="${contract.approval_status}"`,
      )
    })

    // Check for contracts that should be in approval workflow
    const potentialApprovalContracts = contracts.filter(
      (c) =>
        c.status === "draft" ||
        c.status === "pending" ||
        c.status === "generated" ||
        c.approval_status === "draft" ||
        c.approval_status === "pending",
    )

    console.log(
      `\n🎯 Contracts that could be in approval workflow: ${potentialApprovalContracts.length}`,
    )

    if (potentialApprovalContracts.length > 0) {
      console.log("📋 These contracts could be moved to approval status:")
      potentialApprovalContracts.slice(0, 5).forEach((contract) => {
        console.log(
          `  - ${contract.contract_number || contract.id}: status="${contract.status}", approval_status="${contract.approval_status}"`,
        )
      })
    }
  } catch (error) {
    console.error("❌ Script error:", error)
  }
}

// Run the script
checkContractStatuses()
  .then(() => {
    console.log("\n🎉 Status check completed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Script failed:", error)
    process.exit(1)
  })
