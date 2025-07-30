const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

async function addNationalityField() {
  console.log("🔧 Adding nationality field to promoters table...")

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

    console.log("📋 Adding nationality column...")

    // Add nationality column
    const { error: addColumnError } = await supabase.rpc("execute_sql", {
      sql: `
          ALTER TABLE promoters 
          ADD COLUMN IF NOT EXISTS nationality TEXT;
        `,
    })

    if (addColumnError) {
      console.log("⚠️ Could not add column via RPC, trying direct SQL...")

      // Try direct SQL approach
      const { error: directError } = await supabase.rpc("execute_sql", {
        sql: `
            DO $$ 
            BEGIN 
              IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'promoters' AND column_name = 'nationality'
              ) THEN
                ALTER TABLE promoters ADD COLUMN nationality TEXT;
              END IF;
            END $$;
          `,
      })

      if (directError) {
        console.error("❌ Error adding nationality column:", directError)
        console.log("💡 Manual fix required in Supabase Dashboard:")
        console.log("   1. Go to Supabase Dashboard > SQL Editor")
        console.log("   2. Run this SQL:")
        console.log(`
          ALTER TABLE promoters ADD COLUMN IF NOT EXISTS nationality TEXT;
        `)
        return
      } else {
        console.log("✅ Nationality column added via direct SQL")
      }
    } else {
      console.log("✅ Nationality column added successfully")
    }

    console.log("📋 Adding nationality index...")

    // Add index for nationality field
    const { error: indexError } = await supabase.rpc("execute_sql", {
      sql: `
          CREATE INDEX IF NOT EXISTS idx_promoters_nationality 
          ON promoters(nationality);
        `,
    })

    if (indexError) {
      console.log("⚠️ Could not add index via RPC, trying direct SQL...")

      const { error: directIndexError } = await supabase.rpc("execute_sql", {
        sql: `
            DO $$ 
            BEGIN 
              IF NOT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = 'promoters' AND indexname = 'idx_promoters_nationality'
              ) THEN
                CREATE INDEX idx_promoters_nationality ON promoters(nationality);
              END IF;
            END $$;
          `,
      })

      if (directIndexError) {
        console.error("❌ Error adding nationality index:", directIndexError)
        console.log("💡 Manual fix required in Supabase Dashboard:")
        console.log("   1. Go to Supabase Dashboard > SQL Editor")
        console.log("   2. Run this SQL:")
        console.log(`
          CREATE INDEX IF NOT EXISTS idx_promoters_nationality ON promoters(nationality);
        `)
        return
      } else {
        console.log("✅ Nationality index added via direct SQL")
      }
    } else {
      console.log("✅ Nationality index added successfully")
    }

    console.log("🧪 Testing the new field...")

    // Test the new field by updating a sample promoter
    const { data: testPromoter } = await supabase
      .from("promoters")
      .select("id, nationality")
      .limit(1)

    if (testPromoter && testPromoter.length > 0) {
      const { error: testError } = await supabase
        .from("promoters")
        .update({ nationality: "saudi" })
        .eq("id", testPromoter[0].id)

      if (testError) {
        console.error("❌ Test update failed:", testError)
      } else {
        console.log("✅ Test update successful - nationality field is working")

        // Revert the test
        await supabase.from("promoters").update({ nationality: null }).eq("id", testPromoter[0].id)
      }
    }

    console.log("\n🎉 Nationality field setup completed!")
    console.log("📋 The nationality field is now available in:")
    console.log("   - Advanced Promoter Form")
    console.log("   - Promoter Onboarding Form")
    console.log("   - All promoter-related APIs")
  } catch (error) {
    console.error("❌ Script error:", error)
  }
}

// Run the script
addNationalityField()
  .then(() => {
    console.log("\n🎉 Migration completed!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error)
    process.exit(1)
  })
