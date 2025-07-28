import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Mock skills data since promoter_skills table doesn't exist
const mockSkills = [
  {
    id: '1',
    promoter_id: 'promoter-1',
    skill: 'Sales',
    level: 'Advanced',
    years_experience: 5,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    promoter_id: 'promoter-1',
    skill: 'Marketing',
    level: 'Intermediate',
    years_experience: 3,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    promoter_id: 'promoter-1',
    skill: 'Customer Service',
    level: 'Expert',
    years_experience: 7,
    created_at: new Date().toISOString()
  }
]

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoter_id } = await params
    
    // Return mock data for now
    const skills = mockSkills.filter(skill => skill.promoter_id === promoter_id)
    
    return NextResponse.json(skills)
  } catch (error) {
    console.error('Error fetching promoter skills:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promoter skills' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoter_id } = await params
    const body = await req.json()
    
    // Validate required fields
    if (!body.skill) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      )
    }
    
    // Create mock skill
    const newSkill = {
      id: Date.now().toString(),
      promoter_id,
      skill: body.skill,
      level: body.level || 'Beginner',
      years_experience: body.years_experience || 1,
      created_at: new Date().toISOString()
    }
    
    return NextResponse.json(newSkill)
  } catch (error) {
    console.error('Error creating promoter skill:', error)
    return NextResponse.json(
      { error: 'Failed to create promoter skill' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoter_id } = await params
    const body = await req.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Skill ID required' },
        { status: 400 }
      )
    }
    
    // Mock update
    const updatedSkill = {
      id: body.id,
      promoter_id,
      skill: body.skill || 'Updated Skill',
      level: body.level || 'Intermediate',
      years_experience: body.years_experience || 2,
      created_at: new Date().toISOString()
    }
    
    return NextResponse.json(updatedSkill)
  } catch (error) {
    console.error('Error updating promoter skill:', error)
    return NextResponse.json(
      { error: 'Failed to update promoter skill' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoter_id } = await params
    const { id } = await req.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Skill ID required' },
        { status: 400 }
      )
    }
    
    // Mock deletion
    return NextResponse.json({ success: true, message: 'Skill deleted successfully' })
  } catch (error) {
    console.error('Error deleting promoter skill:', error)
    return NextResponse.json(
      { error: 'Failed to delete promoter skill' },
      { status: 500 }
    )
  }
} 