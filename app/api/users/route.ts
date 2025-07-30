import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch all users
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin permissions - try users table first, then profiles
    let userProfile = null
    let users = null
    let error = null

    try {
      // Try users table first
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!userError && userData) {
        userProfile = userData

        // Fetch all users from users table
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select(
            `
            id,
            email,
            full_name,
            role,
            status,
            department,
            position,
            phone,
            avatar_url,
            created_at,
            last_login
          `,
          )
          .order("created_at", { ascending: false })

        users = usersData
        error = usersError
      }
    } catch (tableError) {
      console.log("Users table not found, trying profiles table")
    }

    // If users table failed, try profiles table
    if (!userProfile) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (!profileError && profileData) {
          userProfile = profileData

          // Fetch all users from profiles table
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select(
              `
              id,
              email,
              full_name,
              role,
              status,
              department,
              position,
              phone,
              avatar_url,
              created_at,
              last_login
            `,
            )
            .order("created_at", { ascending: false })

          users = profilesData
          error = profilesError
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

    if (!userProfile.role || !["admin", "manager"].includes(userProfile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // After fetching users (users = usersData or profilesData)
    const total = Array.isArray(users) ? users.length : 0
    const page = 1 // Default, or parse from query if you add pagination
    const limit = total // Default, or parse from query if you add pagination
    const totalPages = 1 // Default, or calculate if you add pagination

    return NextResponse.json({
      users: users || [],
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
    const supabase = await createClient()

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin permissions - try users table first, then profiles
    let userProfile = null

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
      console.log("Users table not found, trying profiles table")
    }

    // If users table failed, try profiles table
    if (!userProfile) {
      try {
        const { data: profileData, error: profileError } = await supabase
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
      const { data: existingUserData } = await supabase
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
        const { data: existingProfileData } = await supabase
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
      const { data: newUserData, error: newUserError } = await supabase
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
          created_by: user.id,
        })
        .select()
        .single()

      newUser = newUserData
      createError = newUserError
    } catch (tableError) {
      console.log("Users table insert failed, trying profiles table")

      // Try profiles table
      const { data: newProfileData, error: newProfileError } = await supabase
        .from("profiles")
        .insert({
          id: user.id, // Use the auth user ID
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
    const { data: authUser, error: createAuthError } = await supabase.auth.admin.createUser({
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
    const supabase = await createClient()

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, ...updateData } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user has permissions to update this user
    const { data: userProfile } = await supabase
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
    const { error: updateError } = await supabase
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
    const supabase = await createClient()

    // Get current user to check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user has admin permissions - try users table first, then profiles
    let userProfile = null

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
      console.log("Users table not found, trying profiles table")
    }

    // If users table failed, try profiles table
    if (!userProfile) {
      try {
        const { data: profileData, error: profileError } = await supabase
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
      const { error: userDeleteError } = await supabase.from("users").delete().eq("id", userId)

      deleteError = userDeleteError
    } catch (tableError) {
      console.log("Users table delete failed, trying profiles table")

      const { error: profileDeleteError } = await supabase
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
      await supabase.auth.admin.deleteUser(userId)
    } catch (authDeleteError) {
      console.warn("Could not delete user from auth (might not exist):", authDeleteError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
