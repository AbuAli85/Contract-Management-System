const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUser() {
  try {
    console.log("🔍 Checking user status...")

    // Check for the specific user
    const userEmail = "luxsess2001@gmail.com"
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", userEmail)
      .single()

    if (userError) {
      console.error("❌ Error fetching user:", userError)

      // List all users to see what's in the table
      const { data: allUsers, error: allUsersError } = await supabase
        .from("users")
        .select("id, email, role, status, created_at")

      if (allUsersError) {
        console.error("❌ Error fetching all users:", allUsersError)
        console.log("💡 This suggests the users table might not exist or have RLS issues")
      } else {
        console.log("📋 All users in database:")
        console.table(allUsers || [])
      }

      // Try to create the user if not found
      if (userError.code === "PGRST116") {
        // No rows returned
        console.log("🔧 User not found, attempting to create user record...")

        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              id: "611d9a4a-b202-4112-9869-cff47872ac40", // From auth logs
              email: userEmail,
              full_name: "Admin User",
              role: "admin",
              status: "active",
              permissions: [
                "users.view",
                "users.create",
                "users.edit",
                "users.delete",
                "users.bulk",
                "contracts.view",
                "contracts.create",
                "contracts.edit",
                "contracts.delete",
                "contracts.approve",
                "dashboard.view",
                "analytics.view",
                "reports.generate",
                "settings.view",
                "settings.edit",
                "logs.view",
                "backup.create",
              ],
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single()

        if (createError) {
          console.error("❌ Error creating user:", createError)
        } else {
          console.log("✅ User created successfully:", newUser)
        }
      }
      return
    }

    if (!user) {
      console.log("❌ User not found in users table")
      console.log("💡 The user is authenticated in Supabase Auth but not in the users table")
      console.log("💡 This is likely the cause of the 401 errors")
    } else {
      console.log("✅ User found in database:")
      console.log("   ID:", user.id)
      console.log("   Email:", user.email)
      console.log("   Role:", user.role)
      console.log("   Status:", user.status)
      console.log("   Permissions:", user.permissions)
      console.log("   Created:", user.created_at)
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error)
  }
}

checkUser()
