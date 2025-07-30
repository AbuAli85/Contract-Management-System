import { NextResponse } from "next/server"
import { NextRequest } from "next/server"

// Mock education data since promoter_education table doesn't exist
const mockEducation = [
  {
    id: "1",
    promoter_id: "promoter-1",
    institution: "University of Technology",
    degree: "Bachelor of Science",
    field_of_study: "Computer Science",
    start_date: "2018-09-01",
    end_date: "2022-06-30",
    description: "Focused on software development and data structures",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    promoter_id: "promoter-1",
    institution: "Business Academy",
    degree: "Master of Business Administration",
    field_of_study: "Marketing",
    start_date: "2022-09-01",
    end_date: "2024-06-30",
    description: "Specialized in digital marketing and consumer behavior",
    created_at: new Date().toISOString(),
  },
]

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: promoter_id } = await params

    // Return mock data for now
    const education = mockEducation.filter((edu) => edu.promoter_id === promoter_id)

    return NextResponse.json(education)
  } catch (error) {
    console.error("Error fetching promoter education:", error)
    return NextResponse.json({ error: "Failed to fetch promoter education" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: promoter_id } = await params
    const body = await req.json()

    // Validate required fields
    if (!body.institution) {
      return NextResponse.json({ error: "Institution name is required" }, { status: 400 })
    }

    // Create mock education record
    const newEducation = {
      id: Date.now().toString(),
      promoter_id,
      institution: body.institution,
      degree: body.degree || "",
      field_of_study: body.field_of_study || "",
      start_date: body.start_date || new Date().toISOString().split("T")[0],
      end_date: body.end_date || "",
      description: body.description || "",
      created_at: new Date().toISOString(),
    }

    return NextResponse.json(newEducation)
  } catch (error) {
    console.error("Error creating promoter education:", error)
    return NextResponse.json({ error: "Failed to create promoter education" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: promoter_id } = await params
    const body = await req.json()

    if (!body.id) {
      return NextResponse.json({ error: "Education ID required" }, { status: 400 })
    }

    // Mock update
    const updatedEducation = {
      id: body.id,
      promoter_id,
      institution: body.institution || "Updated Institution",
      degree: body.degree || "",
      field_of_study: body.field_of_study || "",
      start_date: body.start_date || new Date().toISOString().split("T")[0],
      end_date: body.end_date || "",
      description: body.description || "",
      created_at: new Date().toISOString(),
    }

    return NextResponse.json(updatedEducation)
  } catch (error) {
    console.error("Error updating promoter education:", error)
    return NextResponse.json({ error: "Failed to update promoter education" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: promoter_id } = await params
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "Education ID required" }, { status: 400 })
    }

    // Mock deletion
    return NextResponse.json({ success: true, message: "Education record deleted successfully" })
  } catch (error) {
    console.error("Error deleting promoter education:", error)
    return NextResponse.json({ error: "Failed to delete promoter education" }, { status: 500 })
  }
}
