import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key to bypass RLS
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // No-op for service role
          },
        },
      }
    )

    // Get user session for validation (even though using service role)
    const cookieStore = cookies()
    const userSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const {
      data: { session },
    } = await userSupabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const promoterId = formData.get("promoterId") as string
    const documentType = formData.get("documentType") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!promoterId || !documentType) {
      return NextResponse.json({ error: "Missing promoterId or documentType" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size ${file.size} exceeds limit of ${maxSize} bytes` },
        { status: 400 }
      )
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const uploadId = promoterId === 'new' ? `temp_${Date.now()}` : promoterId
    const fileName = `${uploadId}_${documentType}_${Date.now()}.${fileExt}`

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Upload using service role (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('promoter-documents')
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('promoter-documents')
      .getPublicUrl(fileName)

    // Log successful upload
    console.log(`File uploaded successfully: ${fileName}`)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName,
      filePath: uploadData.path,
      fileSize: file.size,
      fileType: file.type
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

// Handle file deletion
export async function DELETE(request: Request) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // No-op for service role
          },
        },
      }
    )

    // Get user session for validation
    const cookieStore = cookies()
    const userSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    const {
      data: { session },
    } = await userSupabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fileName } = await request.json()

    if (!fileName) {
      return NextResponse.json({ error: "No fileName provided" }, { status: 400 })
    }

    // Delete file using service role
    const { error: deleteError } = await supabase.storage
      .from('promoter-documents')
      .remove([fileName])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: `Delete failed: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
