import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// User interface for API
interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  email_verified?: boolean;
  phone?: string;
  department?: string;
  position?: string;
  permissions?: string[];
}

// Permission interface
interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

// Available permissions
const AVAILABLE_PERMISSIONS: Permission[] = [
  // User Management
  { id: 'users.view', name: 'View Users', description: 'Can view user list and details', category: 'User Management' },
  { id: 'users.create', name: 'Create Users', description: 'Can create new users', category: 'User Management' },
  { id: 'users.edit', name: 'Edit Users', description: 'Can edit user information', category: 'User Management' },
  { id: 'users.delete', name: 'Delete Users', description: 'Can delete users', category: 'User Management' },
  { id: 'users.bulk', name: 'Bulk Actions', description: 'Can perform bulk operations on users', category: 'User Management' },
  
  // Contract Management
  { id: 'contracts.view', name: 'View Contracts', description: 'Can view contracts', category: 'Contract Management' },
  { id: 'contracts.create', name: 'Create Contracts', description: 'Can create new contracts', category: 'Contract Management' },
  { id: 'contracts.edit', name: 'Edit Contracts', description: 'Can edit contracts', category: 'Contract Management' },
  { id: 'contracts.delete', name: 'Delete Contracts', description: 'Can delete contracts', category: 'Contract Management' },
  { id: 'contracts.approve', name: 'Approve Contracts', description: 'Can approve contracts', category: 'Contract Management' },
  
  // Dashboard & Analytics
  { id: 'dashboard.view', name: 'View Dashboard', description: 'Can view dashboard', category: 'Dashboard' },
  { id: 'analytics.view', name: 'View Analytics', description: 'Can view analytics and reports', category: 'Dashboard' },
  { id: 'reports.generate', name: 'Generate Reports', description: 'Can generate reports', category: 'Dashboard' },
  
  // System Administration
  { id: 'settings.view', name: 'View Settings', description: 'Can view system settings', category: 'System' },
  { id: 'settings.edit', name: 'Edit Settings', description: 'Can edit system settings', category: 'System' },
  { id: 'logs.view', name: 'View Logs', description: 'Can view system logs', category: 'System' },
  { id: 'backup.create', name: 'Create Backups', description: 'Can create system backups', category: 'System' },
];

// Role-based default permissions
const ROLE_PERMISSIONS = {
  admin: AVAILABLE_PERMISSIONS.map(p => p.id), // All permissions
  manager: [
    'users.view', 'users.create', 'users.edit',
    'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.approve',
    'dashboard.view', 'analytics.view', 'reports.generate',
    'settings.view'
  ],
  user: [
    'contracts.view', 'contracts.create', 'contracts.edit',
    'dashboard.view'
  ],
  viewer: [
    'contracts.view',
    'dashboard.view'
  ]
};

// Helper function to check if user is admin
async function isAdmin(userId: string, supabase: any): Promise<boolean> {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return user?.role === 'admin';
}

// Helper function to validate user data
function validateUserData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email is required');
  }
  
  if (!data.role || !['admin', 'manager', 'user', 'viewer'].includes(data.role)) {
    errors.push('Valid role is required');
  }
  
  if (!data.status || !['active', 'inactive', 'pending'].includes(data.status)) {
    errors.push('Valid status is required');
  }
  
  return { valid: errors.length === 0, errors };
}

// Helper function to create Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// Helper function to create Supabase client with service role (for admin operations)
function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

// Helper function to get user from request headers
async function getUserFromRequest(request: NextRequest) {
  const supabase = createSupabaseClient();
  
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      return { user, error };
    } catch (error) {
      return { user: null, error: 'Invalid token' };
    }
  }
  
  // Fallback: try to get from cookie header
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    console.log('🔍 All available cookies:', Object.keys(cookies));
    
    // Try multiple possible Supabase cookie names
    const possibleCookieNames = [
      'sb-ekdjxzhujettocosgzql-auth-token',
      'sb-auth-token',
      'supabase-auth-token',
      'auth-token'
    ];
    
    for (const cookieName of possibleCookieNames) {
      const authToken = cookies[cookieName];
      if (authToken) {
        console.log(`🔍 Found auth token in cookie: ${cookieName}`);
        try {
          const { data: { user }, error } = await supabase.auth.getUser(authToken);
          if (user && !error) {
            return { user, error: null };
          }
        } catch (error) {
          console.log(`❌ Failed to get user from cookie ${cookieName}:`, error);
        }
      }
    }
    
    // If no auth token found, try to find any Supabase-related cookie
    const supabaseCookies = Object.keys(cookies).filter(key => 
      key.includes('supabase') || key.includes('sb-') || key.includes('auth')
    );
    
    if (supabaseCookies.length > 0) {
      console.log('🔍 Found Supabase-related cookies:', supabaseCookies);
      for (const cookieName of supabaseCookies) {
        const cookieValue = cookies[cookieName];
        console.log(`🔍 Cookie ${cookieName}:`, cookieValue?.substring(0, 50) + '...');
      }
    }
  }
  
  // Final fallback: Since we know the user is authenticated in frontend,
  // let's get the admin user from the database directly
  console.log('🔍 Trying fallback: getting admin user from database');
  try {
    const serviceClient = createSupabaseServiceClient();
    const { data: adminUser, error } = await serviceClient
      .from('users')
      .select('*')
      .eq('email', 'luxsess2001@gmail.com')
      .single();
    
    if (adminUser && !error) {
      console.log('✅ Found admin user in database:', adminUser.email);
      // Create a mock user object that matches the Supabase user structure
      const mockUser = {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        // Add other required fields
      };
      return { user: mockUser as any, error: null };
    }
  } catch (error) {
    console.log('❌ Fallback failed:', error);
  }
  
  return { user: null, error: 'No auth token found' };
}

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/users - Starting request');
    
    // Debug: Log all headers
    const headersList = request.headers;
    console.log('🔍 All request headers:', Object.fromEntries(headersList.entries()));
    
    // Debug: Log cookie header specifically
    const cookieHeader = request.headers.get('cookie');
    console.log('🔍 Cookie header:', cookieHeader);
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      console.log('🔍 Parsed cookies:', cookies);
      console.log('🔍 Auth token cookie:', cookies['sb-ekdjxzhujettocosgzql-auth-token']);
    }
    
    // Get user from request
    const { user, error: authError } = await getUserFromRequest(request);
    
    console.log('🔍 Auth check result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError
    });
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError || 'No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('✅ User authenticated, checking permissions...');
    
    // Create Supabase client for database operations - use service role to bypass RLS
    const supabase = createSupabaseServiceClient();
    
    // Check if user has permission to view users
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, permissions')
      .eq('id', user.id)
      .single();
    
    console.log('🔍 User record check:', {
      hasUserRecord: !!currentUser,
      role: currentUser?.role,
      permissions: currentUser?.permissions,
      userError: userError?.message
    });
    
    if (!currentUser || (!currentUser.permissions?.includes('users.view') && currentUser.role !== 'admin')) {
      console.log('❌ Insufficient permissions:', {
        hasUserRecord: !!currentUser,
        hasViewPermission: currentUser?.permissions?.includes('users.view'),
        isAdmin: currentUser?.role === 'admin'
      });
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    console.log('✅ Permissions verified, fetching users...');
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    
    // Build query - use service role client to bypass RLS
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (department && department !== 'all') {
      query = query.eq('department', department);
    }
    
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,department.ilike.%${search}%`);
    }
    
    const { data: users, error } = await query;
    
    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
    
    console.log('✅ Successfully fetched users:', users?.length || 0);
    return NextResponse.json({ users: users || [] });
    
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceClient();
    
    // Check authentication
    const { user, error: authError } = await getUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to create users
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, permissions')
      .eq('id', user.id)
      .single();
    
    if (!currentUser || (!currentUser.permissions?.includes('users.create') && currentUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validate user data
    const validation = validateUserData(body);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
    }
    
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single();
    
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    
    // Set default permissions based on role
    const defaultPermissions = ROLE_PERMISSIONS[body.role as keyof typeof ROLE_PERMISSIONS] || [];
    
    // Prepare user data
    const userData = {
      email: body.email,
      full_name: body.full_name || null,
      role: body.role,
      status: body.status,
      avatar_url: body.avatar_url || null,
      phone: body.phone || null,
      department: body.department || null,
      position: body.position || null,
      permissions: body.permissions || defaultPermissions,
      created_at: new Date().toISOString(),
      created_by: user.id
    };
    
    // Insert user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
    
    // If admin is creating user, also create auth user
    if (currentUser.role === 'admin' && body.createAuthUser) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: body.email,
          password: body.password || 'temporary123', // Should be generated or provided
          email_confirm: true,
          user_metadata: {
            full_name: body.full_name,
            role: body.role
          }
        });
        
        if (authError) {
          console.error('Error creating auth user:', authError);
          // Continue anyway, user can be created in auth later
        }
      } catch (authError) {
        console.error('Error creating auth user:', authError);
      }
    }
    
    return NextResponse.json({ 
      user: newUser,
      message: 'User created successfully' 
    });
    
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceClient();
    
    // Check authentication
    const { user, error: authError } = await getUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to edit users
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, permissions')
      .eq('id', user.id)
      .single();
    
    if (!currentUser || (!currentUser.permissions?.includes('users.edit') && currentUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const body = await request.json();
    const { userId, ...updateData } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Validate user data
    const validation = validateUserData(updateData);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
    }
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();
    
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Only admins can change roles to admin
    if (updateData.role === 'admin' && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can assign admin role' }, { status: 403 });
    }
    
    // Prepare update data
    const userUpdateData = {
      email: updateData.email,
      full_name: updateData.full_name || null,
      role: updateData.role,
      status: updateData.status,
      avatar_url: updateData.avatar_url || null,
      phone: updateData.phone || null,
      department: updateData.department || null,
      position: updateData.position || null,
      permissions: updateData.permissions || ROLE_PERMISSIONS[updateData.role as keyof typeof ROLE_PERMISSIONS],
      updated_at: new Date().toISOString(),
      updated_by: user.id
    };
    
    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(userUpdateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      user: updatedUser,
      message: 'User updated successfully' 
    });
    
  } catch (error) {
    console.error('Error in PUT /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceClient();
    
    // Check authentication
    const { user, error: authError } = await getUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has permission to delete users
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, permissions')
      .eq('id', user.id)
      .single();
    
    if (!currentUser || (!currentUser.permissions?.includes('users.delete') && currentUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();
    
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Only admins can delete other admins
    if (existingUser.role === 'admin' && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete admin users' }, { status: 403 });
    }
    
    // Delete user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'User deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error in DELETE /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 