const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

async function setupApprovalWorkflow() {
  console.log("🔧 Setting up approval workflow for contracts...")

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

    // Find contracts that should be in approval workflow
    const { data: contracts, error } = await supabase
      .from("contracts")
      .select("id, contract_number, status, approval_status, created_at, updated_at")
      .or(
        "status.eq.draft,status.eq.pending,status.eq.generated,approval_status.eq.draft,approval_status.eq.pending",
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Error fetching contracts:", error)
      return
    }

    if (!contracts || contracts.length === 0) {
      console.log("✅ No contracts need to be moved to approval workflow")
      return
    }

    console.log(`📋 Found ${contracts.length} contracts to move to approval workflow:`)

    let updatedCount = 0
    let errorCount = 0

    for (const contract of contracts) {
      console.log(`\n🔧 Processing: ${contract.contract_number || contract.id}`)
      console.log(
        `   Current: status="${contract.status}", approval_status="${contract.approval_status}"`,
      )

      try {
        // Determine the appropriate approval status
        let newApprovalStatus = "legal_review" // Default first step

        // If contract is already generated, it might be ready for final approval
        if (contract.status === "generated") {
          newApprovalStatus = "final_approval"
        } else if (contract.status === "pending") {
          newApprovalStatus = "hr_review"
        }

        // Update the contract
        const { error: updateError } = await supabase
          .from("contracts")
          .update({
            approval_status: newApprovalStatus,
            submitted_for_review_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", contract.id)

        if (updateError) {
          console.error(`   ❌ Failed to update: ${updateError.message}`)
          errorCount++
        } else {
          console.log(`   ✅ Updated to: approval_status="${newApprovalStatus}"`)
          updatedCount++
        }
      } catch (error) {
        console.error(`   ❌ Error processing: ${error.message}`)
        errorCount++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`  ✅ Successfully updated: ${updatedCount} contracts`)
    console.log(`  ❌ Failed to update: ${errorCount} contracts`)
    console.log(`  📋 Total processed: ${contracts.length}`)

    if (updatedCount > 0) {
      console.log("\n🎉 Approval workflow setup completed!")
      console.log("📋 Next steps:")
      console.log("   1. Check the Approval Dashboard for pending reviews")
      console.log("   2. Review and approve contracts through the workflow")
      console.log(
        "   3. Contracts will move through: legal_review → hr_review → final_approval → signature → active",
      )
    }
  } catch (error) {
    console.error("❌ Script error:", error)
  }
}

// Run the script
setupApprovalWorkflow()
  .then(() => {
    console.log("\n🎉 Setup completed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Script failed:", error)
    process.exit(1)
  })
