const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createPendingUser() {
  try {
    console.log("🔧 Creating pending test user...")

    const testEmail = "pending-test@example.com"
    const testPassword = "testpassword123"

    // First, create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    })

    if (authError) {
      console.error("❌ Auth user creation failed:", authError.message)
      return
    }

    console.log("✅ Auth user created:", authData.user.id)

    // Then, create the user profile in the users table with pending status
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: testEmail,
        full_name: "Pending Test User",
        role: "user",
        status: "pending",
        email_verified: true,
      })
      .select()
      .single()

    if (profileError) {
      console.error("❌ Profile creation failed:", profileError.message)
      return
    }

    console.log("✅ User profile created:", profileData)
    console.log("\n🎉 Pending test user created successfully!")
    console.log("Email: pending-test@example.com")
    console.log("Password: testpassword123")
    console.log("Role: user")
    console.log("Status: pending")
    console.log("\n📋 This user should now appear in the approval dashboard for admin review.")
  } catch (error) {
    console.error("❌ Error creating pending user:", error.message)
  }
}

createPendingUser()
