import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: promoter_id } = await params
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll(cookiesToSet) { /* ... */ } } }
    )

    // Get promoter to check if documents exist
    const { data: promoter, error: promoterError } = await supabase
      .from("promoters")
      .select("id_card_url, passport_url")
      .eq("id", promoter_id)
      .single()

    if (promoterError) {
      return NextResponse.json({ error: "Promoter not found" }, { status: 404 })
    }

    // Build documents array from promoter data
    const documents = []
    
    if (promoter.id_card_url) {
      documents.push({
        id: "id_card",
        promoter_id,
        document_type: "ID Card",
        file_url: promoter.id_card_url,
        file_name: "ID Card Document",
        description: "National ID card document",
        uploaded_at: new Date().toISOString(),
      })
    }

    if (promoter.passport_url) {
      documents.push({
        id: "passport",
        promoter_id,
        document_type: "Passport",
        file_url: promoter.passport_url,
        file_name: "Passport Document",
        description: "Passport document",
        uploaded_at: new Date().toISOString(),
      })
    }

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Error fetching promoter documents:", error)
    return NextResponse.json({ error: "Failed to fetch promoter documents" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: promoter_id } = await params
    const body = await req.json()
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll(cookiesToSet) { /* ... */ } } }
    )

    // Validate required fields
    if (!body.document_type || !body.file_url) {
      return NextResponse.json(
        { error: "Document type and file URL are required" },
        { status: 400 },
      )
    }

    // Update promoter with document URL
    const updateData: any = {}
    if (body.document_type === "ID Card") {
      updateData.id_card_url = body.file_url
    } else if (body.document_type === "Passport") {
      updateData.passport_url = body.file_url
    }

    const { data: updatedPromoter, error: updateError } = await supabase
      .from("promoters")
      .update(updateData)
      .eq("id", promoter_id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Create audit log
    try {
      await supabase.from("audit_logs").insert({
        user_id: "system", // Will be replaced with actual user ID when auth is implemented
        action: "upload_document",
        table_name: "promoters",
        record_id: promoter_id,
        new_values: { document_type: body.document_type, file_url: body.file_url },
        created_at: new Date().toISOString(),
      })
    } catch (auditError) {
      console.error("Error creating audit log:", auditError)
    }

    return NextResponse.json({
      id: body.document_type === "ID Card" ? "id_card" : "passport",
      promoter_id,
      document_type: body.document_type,
      file_url: body.file_url,
      file_name: body.file_name || `${body.document_type} Document`,
      description: body.description || "",
      uploaded_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error creating promoter document:", error)
    return NextResponse.json({ error: "Failed to create promoter document" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: promoter_id } = await params
    const body = await req.json()
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll(cookiesToSet) { /* ... */ } } }
    )

    if (!body.document_type || !body.file_url) {
      return NextResponse.json({ error: "Document type and file URL required" }, { status: 400 })
    }

    // Update promoter with new document URL
    const updateData: any = {}
    if (body.document_type === "ID Card") {
      updateData.id_card_url = body.file_url
    } else if (body.document_type === "Passport") {
      updateData.passport_url = body.file_url
    }

    const { data: updatedPromoter, error: updateError } = await supabase
      .from("promoters")
      .update(updateData)
      .eq("id", promoter_id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Create audit log
    try {
      await supabase.from("audit_logs").insert({
        user_id: "system",
        action: "update_document",
        table_name: "promoters",
        record_id: promoter_id,
        new_values: { document_type: body.document_type, file_url: body.file_url },
        created_at: new Date().toISOString(),
      })
    } catch (auditError) {
      console.error("Error creating audit log:", auditError)
    }

    return NextResponse.json({
      id: body.document_type === "ID Card" ? "id_card" : "passport",
      promoter_id,
      document_type: body.document_type,
      file_url: body.file_url,
      file_name: body.file_name || `${body.document_type} Document`,
      description: body.description || "",
      uploaded_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating promoter document:", error)
    return NextResponse.json({ error: "Failed to update promoter document" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: promoter_id } = await params
    const { document_type } = await req.json()
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll(cookiesToSet) { /* ... */ } } }
    )

    if (!document_type) {
      return NextResponse.json({ error: "Document type required" }, { status: 400 })
    }

    // Update promoter to remove document URL
    const updateData: any = {}
    if (document_type === "ID Card") {
      updateData.id_card_url = null
    } else if (document_type === "Passport") {
      updateData.passport_url = null
    }

    const { error: updateError } = await supabase
      .from("promoters")
      .update(updateData)
      .eq("id", promoter_id)

    if (updateError) {
      throw updateError
    }

    // Create audit log
    try {
      await supabase.from("audit_logs").insert({
        user_id: "system",
        action: "delete_document",
        table_name: "promoters",
        record_id: promoter_id,
        new_values: { document_type, action: "deleted" },
        created_at: new Date().toISOString(),
      })
    } catch (auditError) {
      console.error("Error creating audit log:", auditError)
    }

    return NextResponse.json({ success: true, message: "Document deleted successfully" })
  } catch (error) {
    console.error("Error deleting promoter document:", error)
    return NextResponse.json({ error: "Failed to delete promoter document" }, { status: 500 })
  }
}
