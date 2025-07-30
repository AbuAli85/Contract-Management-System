const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestUser() {
  try {
    console.log("🔧 Creating test user...")

    // First, create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "test@example.com",
      password: "testpassword123",
      email_confirm: true,
    })

    if (authError) {
      console.error("❌ Auth user creation failed:", authError.message)
      return
    }

    console.log("✅ Auth user created:", authData.user.id)

    // Then, create the user profile in the users table
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: "test@example.com",
        full_name: "Test User",
        role: "admin",
        status: "active",
        email_verified: true,
      })
      .select()
      .single()

    if (profileError) {
      console.error("❌ Profile creation failed:", profileError.message)
      return
    }

    console.log("✅ User profile created:", profileData)
    console.log("\n🎉 Test user created successfully!")
    console.log("Email: test@example.com")
    console.log("Password: testpassword123")
    console.log("Role: admin")
    console.log("Status: active")
  } catch (error) {
    console.error("❌ Error creating test user:", error.message)
  }
}

createTestUser()
