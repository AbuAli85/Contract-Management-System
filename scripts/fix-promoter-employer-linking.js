const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

async function fixPromoterEmployerLinking() {
  console.log("🔧 Fixing Promoter-Employer Linking Issues...")

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase environment variables")
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log("✅ Supabase client initialized with service role")

    // Find promoters without employer assignments
    console.log("\n🔍 Finding promoters without employer assignments...")

    const { data: promotersWithoutEmployer, error: fetchError } = await supabase
      .from("promoters")
      .select("*")
      .is("employer_id", null)
      .order("created_at", { ascending: false })
      .limit(20)

    if (fetchError) {
      console.error("❌ Error fetching promoters:", fetchError)
      return
    }

    console.log(
      `📋 Found ${promotersWithoutEmployer?.length || 0} promoters without employer assignments:`,
    )

    if (promotersWithoutEmployer && promotersWithoutEmployer.length > 0) {
      // Get all employers
      const { data: employers, error: employersError } = await supabase
        .from("parties")
        .select("*")
        .eq("type", "Employer")
        .order("name_en")

      if (employersError) {
        console.error("❌ Error fetching employers:", employersError)
        return
      }

      console.log(`📋 Found ${employers?.length || 0} employers available:`)
      employers?.forEach((employer) => {
        console.log(`   - ${employer.name_en} (${employer.id})`)
      })

      if (employers && employers.length > 0) {
        // Use the first employer as default (you can modify this logic)
        const defaultEmployer = employers[0]
        console.log(`\n🔧 Using default employer: ${defaultEmployer.name_en}`)

        for (const promoter of promotersWithoutEmployer) {
          console.log(`\n👤 Promoter: ${promoter.name_en}`)
          console.log(`   ID: ${promoter.id}`)
          console.log(`   Current employer_id: ${promoter.employer_id || "None"}`)

          // Check if this promoter has any contracts that might indicate their employer
          const { data: contracts, error: contractsError } = await supabase
            .from("contracts")
            .select("second_party_id, second_party:parties!second_party_id(name_en, type)")
            .eq("promoter_id", promoter.id)
            .order("created_at", { ascending: false })
            .limit(1)

          let suggestedEmployer = defaultEmployer

          if (!contractsError && contracts && contracts.length > 0) {
            const contract = contracts[0]
            if (contract.second_party && contract.second_party.type === "Employer") {
              suggestedEmployer = contract.second_party
              console.log(`   📄 Found contract with employer: ${suggestedEmployer.name_en}`)
            }
          }

          // Update promoter with employer assignment
          const { error: updateError } = await supabase
            .from("promoters")
            .update({
              employer_id: suggestedEmployer.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", promoter.id)

          if (updateError) {
            console.error(`   ❌ Failed to update: ${updateError.message}`)
          } else {
            console.log(`   ✅ Assigned to employer: ${suggestedEmployer.name_en}`)
          }
        }
      } else {
        console.log("⚠️ No employers found in the system")
      }
    } else {
      console.log("✅ All promoters have employer assignments")
    }

    // Also check for contracts where promoter and employer don't match
    console.log("\n🔍 Checking for contract-promoter-employer mismatches...")

    const { data: contractsWithMismatches, error: mismatchError } = await supabase
      .from("contracts")
      .select(
        `
        id, contract_number, promoter_id, second_party_id,
        promoter:promoters(id, name_en, employer_id),
        employer:parties!second_party_id(id, name_en, type)
      `,
      )
      .eq("parties.type", "Employer")
      .order("created_at", { ascending: false })
      .limit(10)

    if (mismatchError) {
      console.error("❌ Error fetching contracts with mismatches:", mismatchError)
    } else {
      console.log(`📋 Found ${contractsWithMismatches?.length || 0} contracts to check:`)

      if (contractsWithMismatches && contractsWithMismatches.length > 0) {
        for (const contract of contractsWithMismatches) {
          console.log(`\n📄 Contract: ${contract.contract_number}`)
          console.log(`   Promoter: ${contract.promoter?.name_en}`)
          console.log(`   Promoter's employer_id: ${contract.promoter?.employer_id}`)
          console.log(`   Contract employer: ${contract.employer?.name_en}`)

          if (
            contract.promoter &&
            contract.employer &&
            contract.promoter.employer_id !== contract.employer.id
          ) {
            console.log("   🔧 Fixing: Promoter employer_id doesn't match contract employer")

            const { error: updateError } = await supabase
              .from("promoters")
              .update({
                employer_id: contract.employer.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", contract.promoter.id)

            if (updateError) {
              console.error(`   ❌ Failed to update: ${updateError.message}`)
            } else {
              console.log("   ✅ Updated promoter employer_id to match contract")
            }
          } else {
            console.log("   ✅ Promoter and contract employer match")
          }
        }
      }
    }

    // Get summary of promoter-employer assignments
    console.log("\n📊 Promoter-Employer Assignment Summary:")

    const { data: promoterSummary, error: summaryError } = await supabase.from("promoters").select(`
        employer_id,
        employer:parties!employer_id(name_en)
      `)

    if (!summaryError && promoterSummary) {
      const assignmentCounts = promoterSummary.reduce((acc, promoter) => {
        const employerName = promoter.employer?.name_en || "No Employer"
        acc[employerName] = (acc[employerName] || 0) + 1
        return acc
      }, {})

      Object.entries(assignmentCounts).forEach(([employer, count]) => {
        console.log(`   ${employer}: ${count} promoters`)
      })
    }

    console.log("\n🎉 Promoter-employer linking fix completed!")
    console.log("\nNext steps:")
    console.log("1. Check the contract generation form")
    console.log("2. Verify that promoters show correct employer information")
    console.log("3. Test creating new contracts with proper employer assignments")
  } catch (error) {
    console.error("❌ Promoter-employer linking fix failed:", error)
  }
}

// Run the fix
fixPromoterEmployerLinking()
