#!/usr/bin/env node

/**
 * Authentication System Setup Script
 *
 * This script helps set up the authentication system by:
 * 1. Running the database schema
 * 2. Applying RLS policies
 * 3. Creating initial admin user
 * 4. Testing the setup
 */

const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

// Load environment variables
require("dotenv").config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:")
  console.error("   - NEXT_PUBLIC_SUPABASE_URL")
  console.error("   - SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSQLFile(filePath) {
  try {
    console.log(`📄 Running SQL file: ${filePath}`)
    const sql = fs.readFileSync(filePath, "utf8")

    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"))

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc("exec_sql", { sql: statement })
          if (error) {
            console.error(`❌ Error executing statement: ${error.message}`)
            console.error(`Statement: ${statement.substring(0, 100)}...`)
          }
        } catch (err) {
          console.error(`❌ Error executing statement: ${err.message}`)
          console.error(`Statement: ${statement.substring(0, 100)}...`)
        }
      }
    }

    console.log(`✅ Successfully executed: ${filePath}`)
  } catch (error) {
    console.error(`❌ Error reading or executing ${filePath}:`, error.message)
  }
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select("*").limit(1)

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

async function createInitialAdminUser() {
  try {
    console.log("👤 Creating initial admin user...")

    // Check if admin user already exists in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("❌ Error checking auth users:", authError.message)
      return
    }

    const adminUser = authUsers.users.find((user) => user.email === "admin@example.com")

    if (adminUser) {
      console.log("✅ Admin user already exists in auth.users")

      // Check if profile exists in public.users
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", adminUser.id)
        .single()

      if (profileError || !profile) {
        console.log("📝 Creating admin user profile...")

        // Create user profile
        const { error: insertError } = await supabase.from("users").insert({
          id: adminUser.id,
          email: "admin@example.com",
          full_name: "System Administrator",
          role: "admin",
          status: "active",
          permissions: [
            "users.view",
            "users.create",
            "users.edit",
            "users.delete",
            "contracts.view",
            "contracts.create",
            "contracts.edit",
            "contracts.delete",
            "dashboard.view",
            "analytics.view",
            "settings.view",
            "settings.edit",
          ],
        })

        if (insertError) {
          console.error("❌ Error creating user profile:", insertError.message)
          return
        }

        console.log("✅ Admin user profile created successfully")
      } else {
        console.log("✅ Admin user profile already exists")
      }

      return
    }

    // Create admin user in auth.users
    const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
      email: "admin@example.com",
      password: "admin123",
      email_confirm: true,
      user_metadata: {
        full_name: "System Administrator",
        role: "admin",
        status: "active",
      },
    })

    if (createAuthError) {
      console.error("❌ Error creating auth user:", createAuthError.message)
      return
    }

    // Create user profile
    const { error: profileError } = await supabase.from("users").insert({
      id: newAuthUser.user.id,
      email: "admin@example.com",
      full_name: "System Administrator",
      role: "admin",
      status: "active",
      permissions: [
        "users.view",
        "users.create",
        "users.edit",
        "users.delete",
        "contracts.view",
        "contracts.create",
        "contracts.edit",
        "contracts.delete",
        "dashboard.view",
        "analytics.view",
        "settings.view",
        "settings.edit",
      ],
    })

    if (profileError) {
      console.error("❌ Error creating user profile:", profileError.message)
      return
    }

    console.log("✅ Admin user created successfully")
    console.log("   Email: admin@example.com")
    console.log("   Password: admin123")
    console.log("   ⚠️  Please change this password immediately!")
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message)
  }
}

async function testAuthentication() {
  try {
    console.log("🧪 Testing authentication system...")

    // Test login with service role (bypass RLS)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: "admin@example.com",
      password: "admin123",
    })

    if (signInError) {
      console.error("❌ Login test failed:", signInError.message)

      // Try to reset the admin password
      console.log("🔄 Attempting to reset admin password...")
      const { error: resetError } = await supabase.auth.admin.updateUserById(
        "admin@example.com", // This should be the user ID, not email
        { password: "admin123" },
      )

      if (resetError) {
        console.error("❌ Password reset failed:", resetError.message)
        return false
      }

      // Try login again
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email: "admin@example.com",
        password: "admin123",
      })

      if (retryError) {
        console.error("❌ Login retry failed:", retryError.message)
        return false
      }

      console.log("✅ Login test passed after password reset")
    } else {
      console.log("✅ Login test passed")
    }

    // Test user profile retrieval
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "admin@example.com")
      .single()

    if (profileError) {
      console.error("❌ Profile retrieval test failed:", profileError.message)
      return false
    }

    console.log("✅ Profile retrieval test passed")
    console.log(`   User: ${profile.full_name} (${profile.role})`)

    // Sign out
    await supabase.auth.signOut()

    return true
  } catch (error) {
    console.error("❌ Authentication test failed:", error.message)
    return false
  }
}

async function main() {
  console.log("🚀 Setting up Authentication System...\n")

  // Step 1: Check if tables exist
  console.log("📋 Checking database tables...")
  const usersExists = await checkTableExists("users")
  const permissionsExists = await checkTableExists("permissions")

  if (!usersExists || !permissionsExists) {
    console.log("📄 Running database schema...")
    await runSQLFile(path.join(__dirname, "../database/schema.sql"))
  } else {
    console.log("✅ Database tables already exist")
  }

  // Step 2: Apply RLS policies (use fixed version)
  console.log("\n🔒 Applying RLS policies...")
  await runSQLFile(path.join(__dirname, "../auth/sql/rls-policies-fixed.sql"))

  // Step 3: Create initial admin user
  console.log("\n👤 Setting up initial admin user...")
  await createInitialAdminUser()

  // Step 4: Test the setup
  console.log("\n🧪 Testing authentication system...")
  const testPassed = await testAuthentication()

  if (testPassed) {
    console.log("\n🎉 Authentication system setup completed successfully!")
    console.log("\n📋 Next steps:")
    console.log("   1. Change the admin password")
    console.log("   2. Configure OAuth providers in Supabase dashboard")
    console.log("   3. Test the login/signup flows")
    console.log("   4. Run the authentication tests: npm test auth/tests/auth.test.tsx")
  } else {
    console.log("\n❌ Setup completed with errors. Please check the logs above.")
    console.log("\n🔧 Manual steps to complete setup:")
    console.log("   1. Go to Supabase Dashboard > Authentication > Users")
    console.log("   2. Find admin@example.com user")
    console.log('   3. Reset password to "admin123"')
    console.log("   4. Test login manually")
    process.exit(1)
  }
}

// Run the setup
main().catch(console.error)
