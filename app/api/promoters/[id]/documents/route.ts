import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// Mock documents data since promoter_documents table doesn't exist
const mockDocuments = [
  {
    id: '1',
    promoter_id: 'promoter-1',
    document_type: 'CV',
    file_url: '/uploads/cv.pdf',
    file_name: 'John_Doe_CV.pdf',
    description: 'Professional CV with work experience',
    uploaded_at: new Date().toISOString()
  },
  {
    id: '2',
    promoter_id: 'promoter-1',
    document_type: 'ID',
    file_url: '/uploads/id.jpg',
    file_name: 'national_id.jpg',
    description: 'National ID card',
    uploaded_at: new Date().toISOString()
  },
  {
    id: '3',
    promoter_id: 'promoter-1',
    document_type: 'Certificate',
    file_url: '/uploads/certificate.pdf',
    file_name: 'marketing_certificate.pdf',
    description: 'Digital Marketing Certification',
    uploaded_at: new Date().toISOString()
  }
]

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promoter_id } = await params
    
    // Return mock data for now
    const documents = mockDocuments.filter(doc => doc.promoter_id === promoter_id)
    
    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching promoter documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promoter documents' },
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
    if (!body.document_type || !body.file_url) {
      return NextResponse.json(
        { error: 'Document type and file URL are required' },
        { status: 400 }
      )
    }
    
    // Create mock document
    const newDocument = {
      id: Date.now().toString(),
      promoter_id,
      document_type: body.document_type,
      file_url: body.file_url,
      file_name: body.file_name || 'document.pdf',
      description: body.description || '',
      uploaded_at: new Date().toISOString()
    }
    
    return NextResponse.json(newDocument)
  } catch (error) {
    console.error('Error creating promoter document:', error)
    return NextResponse.json(
      { error: 'Failed to create promoter document' },
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
        { error: 'Document ID required' },
        { status: 400 }
      )
    }
    
    // Mock update
    const updatedDocument = {
      id: body.id,
      promoter_id,
      document_type: body.document_type || 'Updated Document',
      file_url: body.file_url || '/uploads/updated.pdf',
      file_name: body.file_name || 'updated_document.pdf',
      description: body.description || '',
      uploaded_at: new Date().toISOString()
    }
    
    return NextResponse.json(updatedDocument)
  } catch (error) {
    console.error('Error updating promoter document:', error)
    return NextResponse.json(
      { error: 'Failed to update promoter document' },
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
        { error: 'Document ID required' },
        { status: 400 }
      )
    }
    
    // Mock deletion
    return NextResponse.json({ success: true, message: 'Document deleted successfully' })
  } catch (error) {
    console.error('Error deleting promoter document:', error)
    return NextResponse.json(
      { error: 'Failed to delete promoter document' },
      { status: 500 }
    )
  }
} 