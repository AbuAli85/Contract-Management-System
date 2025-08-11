import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  upsertCompany, 
  upsertCompanyBySlug, 
  listCompanies,
  CompanyCreateData 
} from '@/lib/company-service'
import { withRBAC } from '@/lib/rbac/guard'

// GET - List companies with filtering and pagination
export const GET = withRBAC('company:manage:all', async (request: NextRequest) => {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    // Get authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined
    const business_type = searchParams.get('business_type') || undefined
    const is_active = searchParams.get('is_active') === 'true' ? true : 
                     searchParams.get('is_active') === 'false' ? false : undefined
    const is_verified = searchParams.get('is_verified') === 'true' ? true :
                       searchParams.get('is_verified') === 'false' ? false : undefined

    const result = await listCompanies(user.id, {
      page,
      limit,
      search,
      business_type,
      is_active,
      is_verified
    })

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error: any) {
    console.error('Error in companies GET API:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
})

// POST - Create or update company using upsert
export const POST = withRBAC('company:manage:all', async (request: NextRequest) => {
  try {
    const supabase = createClient()
    
    // Get authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ 
        error: 'Company name is required' 
      }, { status: 400 })
    }
    
    if (!body.slug?.trim()) {
      return NextResponse.json({ 
        error: 'Company slug is required' 
      }, { status: 400 })
    }

    // Prepare company data
    const companyData: CompanyCreateData = {
      name: body.name,
      slug: body.slug,
      email: body.email || null,
      phone: body.phone || null,
      website: body.website || null,
      description: body.description || null,
      business_type: body.business_type || 'small_business',
      address: body.address || {},
      settings: body.settings || {},
      createdBy: user.id
    }

    // Determine upsert strategy
    const upsertStrategy = body.upsert_strategy || 'email' // 'email' or 'slug'
    
    let result
    if (upsertStrategy === 'email' && companyData.email) {
      result = await upsertCompany(companyData)
    } else {
      result = await upsertCompanyBySlug(companyData)
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Company created/updated successfully'
    })

  } catch (error: any) {
    console.error('Error in companies POST API:', error)
    
    // Handle specific errors
    if (error.message.includes('permissions')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    if (error.message.includes('already exists') || error.message.includes('unique')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    
    if (error.message.includes('required') || error.message.includes('format')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
})

// PUT - Update existing company
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json({ 
        error: 'Company ID is required for updates' 
      }, { status: 400 })
    }

    // Import update function
    const { updateCompany } = await import('@/lib/company-service')
    
    const result = await updateCompany(body, user.id)

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Company updated successfully'
    })

  } catch (error: any) {
    console.error('Error in companies PUT API:', error)
    
    if (error.message.includes('permissions')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

// DELETE - Soft delete company
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('id')
    
    if (!companyId) {
      return NextResponse.json({ 
        error: 'Company ID is required' 
      }, { status: 400 })
    }

    // Import delete function
    const { deleteCompany } = await import('@/lib/company-service')
    
    await deleteCompany(companyId, user.id)

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully'
    })

  } catch (error: any) {
    console.error('Error in companies DELETE API:', error)
    
    if (error.message.includes('permissions')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}