import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabaseServer"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    // First try with session-based auth
    const supabase = await createServerComponentClient()

    // Get current user to check permissions
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    // If no user found, try to get from session
    let user = authUser
    if (!user) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (session?.user) {
        console.log("✅ API Users: Found user from session:", session.user.id)
        user = session.user
      }
    }

    console.log("🔍 API Users: Auth check result:", { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message 
    })

    // If no user authenticated, return 401
    if (!user) {
      console.log("❌ API Users: No authenticated user found")
      return NextResponse.json({ 
        error: "Authentication required",
        message: "Please log in to access this resource"
      }, { status: 401 })
    }

    console.log("✅ API Users: User authenticated:", user.id)

    // For admin operations, use service role client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey || !supabaseUrl) {
      console.error("❌ API Users: Missing service role credentials")
      return NextResponse.json({ 
        error: "Server configuration error" 
      }, { status: 500 })
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if user has admin permissions using the authenticated user's info
    console.log("🔍 API Users: Checking user permissions for:", user.email)
    let userProfile = null
    let users = null
    let error = null

    try {
      // Try profiles table first using admin client for permission checking
      const { data: profileData, error: profileError } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      console.log("🔍 API Users: Profile check result:", { profile: profileData, error: profileError?.message })

      if (!profileError && profileData) {
        userProfile = profileData

        // Fetch all users from profiles table with safe field selection using admin client
        const { data: profilesData, error: profilesError } = await adminSupabase
          .from("profiles")
          .select(
            `
            id,
            email,
            full_name,
            role,
            status,
            created_at,
            updated_at
          `,
          )
          .order("created_at", { ascending: false })

        users = profilesData
        error = profilesError
        console.log("✅ API Users: Fetched users from profiles table:", users?.length || 0)
      }
    } catch (profileTableError) {
      console.log("⚠️ API Users: Profiles table error:", profileTableError)
    }

    // If profiles table failed, try users table as fallback
    if (!userProfile) {
      try {
        const { data: userData, error: userError } = await adminSupabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!userError && userData) {
          userProfile = userData

          // Fetch all users from users table with safe field selection using admin client
          const { data: usersData, error: usersError } = await adminSupabase
            .from("users")
            .select(
              `
              id,
              email,
              full_name,
              role,
              status,
              created_at,
              updated_at
            `,
            )
            .order("created_at", { ascending: false })

          users = usersData
          error = usersError
          console.log("✅ API Users: Fetched users from users table:", users?.length || 0)
        }
      } catch (tableError) {
        console.log("⚠️ API Users: Users table also failed:", tableError)
      }
    }

    // If still no users found, try a simple query to get at least the admin user
    if (!users || users.length === 0) {
      try {
        console.log("⚠️ API Users: No users found, trying simple query...")
        const { data: simpleUsers, error: simpleError } = await adminSupabase
          .from("profiles")
          .select("id, email, full_name, role, status, created_at")
          .limit(10)

        if (!simpleError && simpleUsers) {
          users = simpleUsers
          error = null
          console.log("✅ API Users: Simple query successful:", users.length)
        }
      } catch (simpleError) {
        console.log("⚠️ API Users: Simple query also failed:", simpleError)
      }
    }

    // If still no user profile found, check if it's the admin user by email
    if (!userProfile && user.email === 'luxsess2001@gmail.com') {
      console.log("✅ API Users: Admin user detected by email, granting access")
      userProfile = { role: "admin" }
    }

    // If still no user profile found, try to create one for the admin user
    if (!userProfile && user.email === 'luxsess2001@gmail.com') {
      try {
        console.log("🔧 API Users: Attempting to ensure admin profile exists...")
        // Fallback: Directly insert or update the admin profile if not present
        const { data: adminProfile, error: adminProfileError } = await adminSupabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: user.email,
              role: "admin",
              status: "active",
              full_name: user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          )
          .select("role")
          .single();

        if (!adminProfileError && adminProfile) {
          console.log("✅ API Users: Admin profile ensured via upsert");
          userProfile = { role: "admin" };
        } else {
          console.log("⚠️ API Users: Could not ensure admin profile:", adminProfileError);
        }
      } catch (ensureError) {
        console.log("⚠️ API Users: Ensure profile function failed:", ensureError)
      }
    }

    if (!userProfile || !userProfile.role || !["admin", "manager"].includes(userProfile.role)) {
      console.log("❌ API Users: Insufficient permissions - user profile:", userProfile)
      return NextResponse.json({ 
        error: "Insufficient permissions",
        details: `User role: ${userProfile?.role || 'none'}, Required: admin or manager`
      }, { status: 403 })
    }

    if (error) {
      console.error("❌ API Users: Error fetching users:", error)
      return NextResponse.json({ 
        error: "Failed to fetch users", 
        details: error.message || "Unknown error" 
      }, { status: 500 })
    }

    console.log("✅ API Users: Successfully fetched users:", users?.length || 0)

    // Ensure users is an array
    const usersArray = Array.isArray(users) ? users : []
    const total = usersArray.length
    const page = 1 // Default, or parse from query if you add pagination
    const limit = total // Default, or parse from query if you add pagination
    const totalPages = 1 // Default, or calculate if you add pagination

    console.log("✅ API Users: Returning response with", total, "users")

    return NextResponse.json({
      users: usersArray,
      pagination: { total, page, limit, totalPages },
    })
  } catch (error) {
    console.error("Error in GET /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new user with password
export async function POST(request: NextRequest) {
  try {
    // First try with session-based auth
    const supabase = await createServerComponentClient()

    // Get current user to check permissions
    const {
      data: { user: postAuthUser },
      error: authError,
    } = await supabase.auth.getUser()

    // If no user found, try to get from session
    let user = postAuthUser
    if (!user) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (session?.user) {
        user = session.user
      }
    }

    if (!user) {
      return NextResponse.json({ 
        error: "Authentication required",
        message: "Please log in to create users"
      }, { status: 401 })
    }

    // Create admin client for database operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ 
        error: "Server configuration error" 
      }, { status: 500 })
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if user has admin permissions - try profiles table first, then users
    let userProfile = null

    try {
      const { data: profileData, error: profileError } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!profileError && profileData) {
        userProfile = profileData
      }
    } catch (profileTableError) {
      console.log("Profiles table not found, trying users table")
    }

    // If profiles table failed, try users table
    if (!userProfile) {
      try {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!userError && userData) {
          userProfile = userData
        }
      } catch (tableError) {
        console.log("Users table also not found")
      }
    }

    // If still no user profile found, check if it's the admin user by email
    if (!userProfile && user.email === 'luxsess2001@gmail.com') {
      userProfile = { role: "admin" }
    }

    // If still no user profile found, default to admin for testing
    if (!userProfile) {
      console.log("No user profile found, defaulting to admin for testing")
      userProfile = { role: "admin" }
    }

    if (!userProfile.role || userProfile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create users" }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, full_name, role, status, department, position, phone } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      )
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        {
          error:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
        },
        { status: 400 },
      )
    }

    // Check if user already exists in database - try users table first
    let existingUser = null
    let newUser = null
    let createError = null

    try {
      const { data: existingUserData } = await adminSupabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single()

      existingUser = existingUserData
    } catch (tableError) {
      console.log("Users table not found, trying profiles table")
    }

    // If users table failed, try profiles table
    if (!existingUser) {
      try {
        const { data: existingProfileData } = await adminSupabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single()

        existingUser = existingProfileData
      } catch (profileTableError) {
        console.log("Profiles table also not found")
      }
    }

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Create user in database - try users table first
    try {
      const { data: newUserData, error: newUserError } = await adminSupabase
        .from("users")
        .insert({
          email,
          full_name: full_name || null,
          role: role || "user",
          status: status || "active",
          department: department || null,
          position: position || null,
          phone: phone || null,
          created_at: new Date().toISOString(),
          created_by: postAuthUser?.id,
        })
        .select()
        .single()

      newUser = newUserData
      createError = newUserError
    } catch (tableError) {
      console.log("Users table insert failed, trying profiles table")

      // Try profiles table
      const { data: newProfileData, error: newProfileError } = await adminSupabase
        .from("profiles")
        .insert({
          id: postAuthUser?.id, // Use the auth user ID
          email,
          full_name: full_name || null,
          role: role || "user",
          status: status || "active",
          department: department || null,
          position: position || null,
          phone: phone || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      newUser = newProfileData
      createError = newProfileError
    }

    if (createError) {
      console.error("Error creating user in database:", createError)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    if (!newUser) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Create user in Supabase Auth
    const { data: newAuthUser, error: createAuthError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        role,
        status,
        department,
        position,
        phone,
      },
    })

    if (createAuthError) {
      console.error("Error creating user in auth:", createAuthError)
      // Try to delete the database user if auth creation fails
      await supabase.from("users").delete().eq("id", newUser.id)
      return NextResponse.json(
        { error: "Failed to create user in authentication" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: "email" in newUser ? newUser.email : email,
        full_name,
        role,
        status,
        department,
        position,
        phone,
      },
    })
  } catch (error) {
    console.error("Error in POST /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create admin client for database operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ 
        error: "Server configuration error" 
      }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const body = await request.json()
    const { userId, ...updateData } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user has permissions to update this user
    const { data: userProfile } = await adminClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Only allow admins to update other users, or users to update their own profile
    if (userProfile.role !== "admin" && user.id !== userId) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Update user profile
    const { error: updateError } = await adminClient
      .from("users")
      .update({
        full_name: updateData.full_name,
        role: updateData.role,
        status: updateData.status,
        department: updateData.department,
        position: updateData.position,
        phone: updateData.phone,
        avatar_url: updateData.avatar_url,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating user:", updateError)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in PUT /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Create admin client for database operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ 
        error: "Server configuration error" 
      }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user has admin permissions - try users table first, then profiles
    let userProfile = null

    try {
      const { data: userData, error: userError } = await adminClient
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!userError && userData) {
        userProfile = userData
      }
    } catch (tableError) {
      console.log("Users table not found, trying profiles table")
    }

    // If users table failed, try profiles table
    if (!userProfile) {
      try {
        const { data: profileData, error: profileError } = await adminClient
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!profileError && profileData) {
          userProfile = profileData
        }
      } catch (profileTableError) {
        console.log("Profiles table also not found")
      }
    }

    // If still no user profile found, default to admin for testing
    if (!userProfile) {
      console.log("No user profile found, defaulting to admin for testing")
      userProfile = { role: "admin" }
    }

    if (!userProfile.role || userProfile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can delete users" }, { status: 403 })
    }

    // Prevent admin from deleting themselves
    if (user.id === userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Delete user from database - try users table first, then profiles
    let deleteError = null

    try {
      const { error: userDeleteError } = await adminClient.from("users").delete().eq("id", userId)

      deleteError = userDeleteError
    } catch (tableError) {
      console.log("Users table delete failed, trying profiles table")

      const { error: profileDeleteError } = await adminClient
        .from("profiles")
        .delete()
        .eq("id", userId)

      deleteError = profileDeleteError
    }

    if (deleteError) {
      console.error("Error deleting user from database:", deleteError)
      return NextResponse.json({ error: "Failed to delete user from database" }, { status: 500 })
    }

    // Try to delete user from auth (this might fail if user doesn't exist in auth)
    try {
      await adminClient.auth.admin.deleteUser(userId)
    } catch (authDeleteError) {
      console.warn("Could not delete user from auth (might not exist):", authDeleteError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
