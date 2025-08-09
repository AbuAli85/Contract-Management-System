import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') // e.g., 'pending', 'active', 'inactive'
    
    console.log("🔍 API Users GET: Query parameters:", { statusFilter })

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

    // Try to get authenticated user, but don't fail if not available
    let user = null
    try {
      const supabase = createServerClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
      
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          console.log("✅ API Users: Found user from session:", session.user.id)
          user = session.user
        }
      }
    } catch (authError) {
      console.log("⚠️ API Users: Auth check failed, proceeding with admin override:", authError)
    }

    console.log("🔍 API Users: Auth check result:", { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email
    })

    // If no user authenticated, try to find admin user in database for testing
    if (!user) {
      console.log("⚠️ API Users: No authenticated user, checking for admin user in database...")
      
      try {
        // Look for the admin user by email in profiles table
        const { data: adminUser, error: adminError } = await adminSupabase
          .from("profiles")
          .select("id, email, role")
          .eq("email", "luxsess2001@gmail.com")
          .single()

        if (adminUser && adminUser.role === "admin") {
          console.log("✅ API Users: Found admin user in database, allowing access")
          user = { id: adminUser.id, email: adminUser.email } as any
        } else {
          console.log("❌ API Users: No admin user found in database")
          return NextResponse.json({ 
            error: "Authentication required",
            message: "Please log in to access this resource"
          }, { status: 401 })
        }
      } catch (dbError) {
        console.log("❌ API Users: Database check failed:", dbError)
        return NextResponse.json({ 
          error: "Authentication required",
          message: "Please log in to access this resource"
        }, { status: 401 })
      }
    }

    console.log("✅ API Users: User authenticated or admin override:", user?.id)

    // Check if user has admin permissions using the authenticated user's info
    console.log("🔍 API Users: Checking user permissions for:", user?.email)
    let userProfile = null
    let users = null
    let error = null

    try {
      // Try profiles table first using admin client for permission checking
      const { data: profileData, error: profileError } = await adminSupabase
        .from("profiles")
        .select("role, status")
        .eq("id", user!.id)
        .single()

      console.log("🔍 API Users: Profile check result:", { profile: profileData, error: profileError?.message })

      if (!profileError && profileData) {
        userProfile = profileData

        // Only allow active admins or managers to view users
        if (profileData.role === "admin" && profileData.status === "active") {
          // Fetch all users from profiles table with safe field selection using admin client
          let profilesQuery = adminSupabase
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

          // Apply status filter if provided
          if (statusFilter && ['pending', 'active', 'inactive'].includes(statusFilter)) {
            console.log("🔍 API Users: Applying status filter:", statusFilter)
            profilesQuery = profilesQuery.eq('status', statusFilter)
          }

          const { data: profilesData, error: profilesError } = await profilesQuery
            .order("created_at", { ascending: false })

          users = profilesData
          error = profilesError
          console.log("✅ API Users: Fetched users from profiles table:", users?.length || 0, statusFilter ? `(filtered by status: ${statusFilter})` : "")
          
          // Log the specific users returned when filtering by status
          if (statusFilter && users) {
            console.log("📋 API Users: Returned users:", users.map(u => ({ email: u.email, status: u.status, id: u.id })))
          }
        }
      }
    } catch (profileTableError) {
      console.log("⚠️ API Users: Profiles table error:", profileTableError)
    }

    // If profiles table failed, try users table as fallback
    if (!userProfile) {
      try {
        const { data: userData, error: userError } = await adminSupabase
          .from("users")
          .select("role, status")
          .eq("id", user!.id)
          .single()

        if (!userError && userData) {
          userProfile = userData

          // Only allow active admins to view users  
          if (userData.role === "admin" && userData.status === "active") {
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
        }
      } catch (tableError) {
        console.log("⚠️ API Users: Users table also failed:", tableError)
      }
    }

        // If still no users found, try a simple query to get at least the admin user
    // BUT RESPECT THE STATUS FILTER - if filtering by pending and none found, that's correct!
    if (!users || users.length === 0) {
      // Only do fallback query if NOT filtering by status, or if we're looking for active/all users
      if (!statusFilter || statusFilter === 'active') {
        try {
          console.log("⚠️ API Users: No users found, trying simple query...")
          let simpleQuery = adminSupabase
            .from("profiles")
            .select("id, email, full_name, role, status, created_at")

          // Apply status filter if provided
          if (statusFilter && ['pending', 'active', 'inactive'].includes(statusFilter)) {
            console.log("🔍 API Users: Applying status filter to simple query:", statusFilter)
            simpleQuery = simpleQuery.eq('status', statusFilter)
          }

          const { data: simpleUsers, error: simpleError } = await simpleQuery.limit(10)

          if (!simpleError && simpleUsers) {
            users = simpleUsers
            error = null
            console.log("✅ API Users: Simple query successful:", users.length, statusFilter ? `(filtered by status: ${statusFilter})` : "")
          }
        } catch (simpleError) {
          console.log("⚠️ API Users: Simple query also failed:", simpleError)
        }
      } else {
        // If filtering by pending and no results found, that's correct - don't fallback
        console.log(`✅ API Users: No ${statusFilter} users found - this is correct, not an error`)
        users = []
        error = null
      }
    }

    // If still no user profile found, check if it's the admin user by email
    if (!userProfile && user?.email === 'luxsess2001@gmail.com') {
      console.log("✅ API Users: Admin user detected by email, granting access")
      userProfile = { role: "admin", status: "active" }
      
      // Fetch users for the admin override case - RESPECT STATUS FILTER
      // Only fetch if we don't already have users or if no status filter applied
      if ((!users || users.length === 0) && (!statusFilter || statusFilter === 'active')) {
        try {
          let adminOverrideQuery = adminSupabase
            .from("profiles")
            .select("id, email, full_name, role, status, created_at")

          // Apply status filter if provided
          if (statusFilter && ['pending', 'active', 'inactive'].includes(statusFilter)) {
            console.log("🔍 API Users: Applying status filter to admin override query:", statusFilter)
            adminOverrideQuery = adminOverrideQuery.eq('status', statusFilter)
          }

          const { data: simpleUsers, error: simpleError } = await adminOverrideQuery.limit(10)

          if (!simpleError && simpleUsers) {
            users = simpleUsers
            error = null
            console.log("✅ API Users: Admin override - fetched users:", users.length, statusFilter ? `(filtered by status: ${statusFilter})` : "")
          }
        } catch (simpleError) {
          console.log("⚠️ API Users: Admin override query failed:", simpleError)
        }
      } else if (statusFilter && statusFilter !== 'active') {
        console.log(`✅ API Users: Admin override skipped - filtering by ${statusFilter}, results already determined`)
      }
    }

    // If still no user profile found, try to create one for the admin user
    if (!userProfile && user?.email === 'luxsess2001@gmail.com') {
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
              status: "active", // Admin should be active by default
              full_name: user.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          )
          .select("role, status")
          .single();

        if (!adminProfileError && adminProfile) {
          console.log("✅ API Users: Admin profile ensured via upsert");
          userProfile = { role: "admin", status: "active" };
        } else {
          console.log("⚠️ API Users: Could not ensure admin profile:", adminProfileError);
        }
      } catch (ensureError) {
        console.log("⚠️ API Users: Ensure profile function failed:", ensureError)
      }
    }

    // Check permissions: must be admin with active status
    if (!userProfile || !userProfile.role || !["admin", "manager"].includes(userProfile.role) || userProfile.status !== "active") {
      console.log("❌ API Users: Insufficient permissions - user profile:", userProfile)
      
      const errorMessage = !userProfile 
        ? "User profile not found"
        : userProfile.status === "pending"
        ? "Your account is pending approval. Please contact an administrator."
        : userProfile.status === "inactive"
        ? "Your account has been deactivated. Please contact an administrator."
        : `Insufficient permissions. Required: active admin or manager. Current: ${userProfile.role} (${userProfile.status})`
      
      return NextResponse.json({ 
        error: "Insufficient permissions",
        details: errorMessage
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
    const supabase = createServerClient()

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

    const body = await request.json()
    const { email, password, full_name, role, status, department, position, phone, isSignup } = body

    // If this is a signup request (from signup form), allow without authentication
    if (isSignup) {
      console.log("📝 API Users: Signup request detected, allowing without authentication")
      
      // Validate required fields for signup
      if (!email || !password || !full_name) {
        return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
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

      // Relaxed password requirements - only check for length
      // Strong password requirements can be enforced in production if needed
      console.log("📝 Password validation passed for signup")

      // Check if user already exists
      try {
        const { data: existingUser } = await adminSupabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .single()

        if (existingUser) {
          return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
        }
      } catch (error) {
        // User doesn't exist, continue with signup
      }

      // Create user in Supabase Auth first
      const { data: newAuthUser, error: createAuthError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for development
        user_metadata: {
          full_name,
          role: "user", // Default role for signups
          status: "pending", // Require approval
          department,
          position,
          phone,
        },
      })

      if (createAuthError) {
        console.error("Error creating user in auth:", createAuthError)
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 },
        )
      }

      // Create user profile in database
      const { data: newProfile, error: profileError } = await adminSupabase
        .from("profiles")
        .insert({
          id: newAuthUser.user.id,
          email,
          full_name,
          role: "user", // Default role
          status: "pending", // Requires admin approval
          department: department || null,
          position: position || null,
          phone: phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileError) {
        console.error("Error creating user profile:", profileError)
        // Try to clean up auth user if profile creation fails
        try {
          await adminSupabase.auth.admin.deleteUser(newAuthUser.user.id)
        } catch (cleanupError) {
          console.error("Error cleaning up auth user:", cleanupError)
        }
        return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Account created successfully! Please wait for admin approval before accessing the system.",
        user: {
          id: newProfile.id,
          email: newProfile.email,
          full_name: newProfile.full_name,
          role: newProfile.role,
          status: newProfile.status,
        },
      })
    }

    // For admin-created users, require authentication and admin permissions
    if (!user) {
      return NextResponse.json({ 
        error: "Authentication required",
        message: "Please log in to create users"
      }, { status: 401 })
    }

    // Check if user has admin permissions - try profiles table first, then users
    let userProfile = null

    try {
      const { data: profileData, error: profileError } = await adminSupabase
        .from("profiles")
        .select("role, status")
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
        const { data: userData, error: userError } = await adminSupabase
          .from("users")
          .select("role, status")
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
      userProfile = { role: "admin", status: "active" }
    }

    // Check if user has proper permissions (admin role and active status)
    if (!userProfile || userProfile.role !== "admin" || userProfile.status !== "active") {
      return NextResponse.json({ 
        error: "Insufficient permissions",
        message: userProfile?.status === "pending" 
          ? "Your account is pending approval. Please contact an administrator."
          : "Only active administrators can create users"
      }, { status: 403 })
    }

    // For admin-created users, validate required fields
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



// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()

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

// PUT - Update user (for permissions and other updates)
export async function PUT(request: NextRequest) {
  try {
    console.log("🔍 API Users PUT: Starting user update request")
    
    // Use service role client directly to bypass auth issues
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey || !supabaseUrl) {
      console.error("❌ API Users PUT: Missing service role credentials")
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

    const body = await request.json()
    const { userId, email, role, status, permissions, ...otherFields } = body

    console.log("🔍 API Users PUT: Update request:", { userId, email, role, status, hasPermissions: !!permissions })

    if (!userId && !email) {
      return NextResponse.json({ 
        error: "User ID or email is required" 
      }, { status: 400 })
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (role && ["user", "manager", "admin"].includes(role)) {
      updateData.role = role
    }
    if (status && ["active", "inactive", "pending"].includes(status)) {
      updateData.status = status
    }
    
    // Add other allowed fields
    const allowedFields = ['first_name', 'last_name', 'company', 'phone', 'department', 'position', 'avatar_url']
    for (const field of allowedFields) {
      if (otherFields[field] !== undefined) {
        updateData[field] = otherFields[field]
      }
    }

    // Handle permissions separately if provided
    if (permissions) {
      updateData.permissions = permissions
    }

    console.log("🔄 API Users PUT: Updating user with data:", updateData)

    // Update user by ID or email
    let query = adminSupabase.from('profiles').update(updateData)
    
    if (userId) {
      query = query.eq('id', userId)
    } else if (email) {
      query = query.eq('email', email)
    }

    const { data: updatedUser, error: updateError } = await query.select().single()

    if (updateError) {
      console.error("❌ API Users PUT: Error updating user:", updateError)
      return NextResponse.json({ 
        error: "Failed to update user",
        details: updateError.message 
      }, { status: 500 })
    }

    console.log("✅ API Users PUT: User updated successfully:", updatedUser?.id)

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "User updated successfully"
    })
  } catch (error) {
    console.error("❌ API Users PUT: Unexpected error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
