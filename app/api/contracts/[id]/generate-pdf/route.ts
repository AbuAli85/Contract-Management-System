import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params
    const supabase = await createClient()

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Please log in' 
      }, { status: 401 })
    }

    // Fetch contract with all related data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        first_party:parties!first_party_id(*),
        second_party:parties!second_party_id(*),
        promoter:promoters(*)
      `)
      .eq('id', contractId)
      .single()

    if (contractError || !contract) {
      return NextResponse.json({
        success: false,
        error: 'Contract not found'
      }, { status: 404 })
    }

    // Generate PDF content
    const pdfContent = generateContractPDFContent(contract)
    
    // Create a proper PDF file name
    const fileName = `contract-${contract.contract_number || contractId}-${Date.now()}.pdf`
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(fileName, Buffer.from(pdfContent, 'utf-8'), {
        contentType: 'application/pdf',
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({
        success: false,
        error: 'Failed to upload PDF'
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('contracts')
      .getPublicUrl(fileName)

    // Update contract with new PDF URL
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        pdf_url: publicUrl,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      })
      .eq('id', contractId)

    if (updateError) {
      console.error("Database update error:", updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update contract'
      }, { status: 500 })
    }

    // Log the activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: session.user.id,
        action: 'pdf_generated',
        resource_type: 'contract',
        resource_id: contractId,
        details: { 
          contract_number: contract.contract_number,
          pdf_url: publicUrl,
          file_name: fileName
        }
      })

    return NextResponse.json({
      success: true,
      pdf_url: publicUrl,
      message: 'PDF generated successfully'
    })

  } catch (error) {
    console.error("Generate PDF API error:", error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Function to generate PDF content
function generateContractPDFContent(contract: any): string {
  const contractNumber = contract.contract_number || 'N/A'
  const currentDate = new Date().toLocaleDateString()
  
  return `
EMPLOYMENT CONTRACT

Contract Number: ${contractNumber}
Date: ${currentDate}

================================================================================

PARTIES
================================================================================

${contract.first_party ? `
EMPLOYER:
Name: ${contract.first_party.name_en}
CRN: ${contract.first_party.crn || 'N/A'}
Address: ${contract.first_party.address_en || 'N/A'}
Contact Person: ${contract.first_party.contact_person || 'N/A'}
Contact Email: ${contract.first_party.contact_email || 'N/A'}
Contact Phone: ${contract.first_party.contact_phone || 'N/A'}
` : 'Employer: Not specified'}

${contract.second_party ? `
EMPLOYEE:
Name: ${contract.second_party.name_en}
Email: ${contract.email || 'N/A'}
Contact Person: ${contract.second_party.contact_person || 'N/A'}
Contact Email: ${contract.second_party.contact_email || 'N/A'}
Contact Phone: ${contract.second_party.contact_phone || 'N/A'}
` : 'Employee: Not specified'}

================================================================================

JOB DETAILS
================================================================================

Position: ${contract.job_title || 'N/A'}
Department: ${contract.department || 'N/A'}
Work Location: ${contract.work_location || 'N/A'}

================================================================================

CONTRACT TERMS
================================================================================

Contract Type: ${contract.contract_type || 'N/A'}
Start Date: ${contract.contract_start_date ? new Date(contract.contract_start_date).toLocaleDateString() : 'N/A'}
End Date: ${contract.contract_end_date ? new Date(contract.contract_end_date).toLocaleDateString() : 'N/A'}

================================================================================

COMPENSATION
================================================================================

Basic Salary: ${contract.basic_salary || 'N/A'} ${contract.currency || 'SAR'}
Allowances: ${contract.allowances || 'N/A'} ${contract.currency || 'SAR'}

================================================================================

${contract.promoter ? `
PROMOTER INFORMATION
================================================================================

Name: ${contract.promoter.name_en}
Contact: ${contract.promoter.mobile_number || 'N/A'}
Email: ${contract.promoter.email || 'N/A'}
` : ''}

================================================================================

CONTRACT STATUS
================================================================================

Status: ${contract.status || 'Draft'}
Approval Status: ${contract.approval_status || 'Pending'}
Created: ${contract.created_at ? new Date(contract.created_at).toLocaleDateString() : 'N/A'}
Last Updated: ${contract.updated_at ? new Date(contract.updated_at).toLocaleDateString() : 'N/A'}

================================================================================

TERMS AND CONDITIONS
================================================================================

1. This employment contract is legally binding and enforceable under applicable labor laws.

2. The employee agrees to perform the duties and responsibilities associated with the position of ${contract.job_title || 'the specified role'}.

3. The employer agrees to provide the compensation and benefits as outlined in this contract.

4. Both parties agree to comply with all applicable laws and regulations.

5. This contract may be terminated by either party with appropriate notice as required by law.

6. Any disputes arising from this contract will be resolved through appropriate legal channels.

================================================================================

SIGNATURES
================================================================================

Employer Signature: _________________________    Date: _________________

Employee Signature: _________________________    Date: _________________

Promoter Signature: ${contract.promoter ? '_________________________' : 'N/A'}    Date: ${contract.promoter ? '_________________' : 'N/A'}

================================================================================

This contract is generated electronically and is legally binding.
Generated on: ${new Date().toLocaleString()}
Contract ID: ${contract.id}

================================================================================
  `
} 