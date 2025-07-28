import { jsPDF } from 'jspdf'

interface ContractData {
  id: string
  contract_number: string
  first_party?: {
    name_en: string
    crn?: string
    address_en?: string
    contact_person?: string
    contact_email?: string
    contact_phone?: string
  }
  second_party?: {
    name_en: string
    contact_person?: string
    contact_email?: string
    contact_phone?: string
  }
  promoter?: {
    name_en: string
    mobile_number?: string
    email?: string
  }
  job_title?: string
  work_location?: string
  department?: string
  email?: string
  contract_start_date?: string
  contract_end_date?: string
  basic_salary?: number
  allowances?: number
  currency?: string
  contract_type?: string
  special_terms?: string
  status?: string
  approval_status?: string
  created_at?: string
  updated_at?: string
}

// Database contract interface (what we get from Supabase)
interface DatabaseContract {
  id: string
  contract_number: string
  first_party_id?: string | null
  second_party_id?: string | null
  promoter_id?: string | null
  first_party?: {
    name_en: string
    crn?: string | null
    address_en?: string | null
    contact_person?: string | null
    contact_email?: string | null
    contact_phone?: string | null
  } | null
  second_party?: {
    name_en: string
    contact_person?: string | null
    contact_email?: string | null
    contact_phone?: string | null
  } | null
  promoter?: {
    name_en: string
    mobile_number?: string | null
    email?: string | null
  } | null
  job_title?: string | null
  work_location?: string | null
  department?: string | null
  email?: string | null
  contract_start_date?: string | null
  contract_end_date?: string | null
  basic_salary?: number | null
  allowances?: number | null
  currency?: string | null
  contract_type?: string | null
  special_terms?: string | null
  status?: string | null
  approval_status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

// Transform database contract to ContractData format
function transformContractData(dbContract: DatabaseContract): ContractData {
  return {
    id: dbContract.id,
    contract_number: dbContract.contract_number,
    first_party: dbContract.first_party ? {
      name_en: dbContract.first_party.name_en,
      crn: dbContract.first_party.crn || undefined,
      address_en: dbContract.first_party.address_en || undefined,
      contact_person: dbContract.first_party.contact_person || undefined,
      contact_email: dbContract.first_party.contact_email || undefined,
      contact_phone: dbContract.first_party.contact_phone || undefined
    } : undefined,
    second_party: dbContract.second_party ? {
      name_en: dbContract.second_party.name_en,
      contact_person: dbContract.second_party.contact_person || undefined,
      contact_email: dbContract.second_party.contact_email || undefined,
      contact_phone: dbContract.second_party.contact_phone || undefined
    } : undefined,
    promoter: dbContract.promoter ? {
      name_en: dbContract.promoter.name_en,
      mobile_number: dbContract.promoter.mobile_number || undefined,
      email: dbContract.promoter.email || undefined
    } : undefined,
    job_title: dbContract.job_title || undefined,
    work_location: dbContract.work_location || undefined,
    department: dbContract.department || undefined,
    email: dbContract.email || undefined,
    contract_start_date: dbContract.contract_start_date || undefined,
    contract_end_date: dbContract.contract_end_date || undefined,
    basic_salary: dbContract.basic_salary || undefined,
    allowances: dbContract.allowances || undefined,
    currency: dbContract.currency || undefined,
    contract_type: dbContract.contract_type || undefined,
    special_terms: dbContract.special_terms || undefined,
    status: dbContract.status || undefined,
    approval_status: dbContract.approval_status || undefined,
    created_at: dbContract.created_at || undefined,
    updated_at: dbContract.updated_at || undefined
  }
}

export async function generateContractPDF(contract: ContractData | DatabaseContract): Promise<Buffer> {
  // Transform database contract to ContractData format if needed
  const contractData: ContractData = 'first_party_id' in contract 
    ? transformContractData(contract as DatabaseContract)
    : contract as ContractData

  const doc = new jsPDF()
  
  // Set font
  doc.setFont('helvetica')
  
  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('EMPLOYMENT CONTRACT', 105, 20, { align: 'center' })
  
  // Contract number and date
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Contract Number: ${contractData.contract_number}`, 20, 35)
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 42)
  
  let yPosition = 55
  
  // Parties section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PARTIES', 20, yPosition)
  yPosition += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  if (contractData.first_party) {
    doc.setFont('helvetica', 'bold')
    doc.text('EMPLOYER:', 20, yPosition)
    yPosition += 6
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${contractData.first_party.name_en}`, 25, yPosition)
    yPosition += 5
    doc.text(`CRN: ${contractData.first_party.crn || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Address: ${contractData.first_party.address_en || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Person: ${contractData.first_party.contact_person || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Email: ${contractData.first_party.contact_email || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Phone: ${contractData.first_party.contact_phone || 'N/A'}`, 25, yPosition)
    yPosition += 8
  } else {
    doc.text('Employer: Not specified', 25, yPosition)
    yPosition += 8
  }
  
  if (contractData.second_party) {
    doc.setFont('helvetica', 'bold')
    doc.text('EMPLOYEE:', 20, yPosition)
    yPosition += 6
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${contractData.second_party.name_en}`, 25, yPosition)
    yPosition += 5
    doc.text(`Email: ${contractData.email || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Person: ${contractData.second_party.contact_person || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Email: ${contractData.second_party.contact_email || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Phone: ${contractData.second_party.contact_phone || 'N/A'}`, 25, yPosition)
    yPosition += 8
  } else {
    doc.text('Employee: Not specified', 25, yPosition)
    yPosition += 8
  }
  
  // Job Details section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('JOB DETAILS', 20, yPosition)
  yPosition += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Position: ${contractData.job_title || 'N/A'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Department: ${contractData.department || 'N/A'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Work Location: ${contractData.work_location || 'N/A'}`, 25, yPosition)
  yPosition += 8
  
  // Contract Terms section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('CONTRACT TERMS', 20, yPosition)
  yPosition += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Contract Type: ${contractData.contract_type || 'N/A'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Start Date: ${contractData.contract_start_date ? new Date(contractData.contract_start_date).toLocaleDateString() : 'N/A'}`, 25, yPosition)
  yPosition += 5
  doc.text(`End Date: ${contractData.contract_end_date ? new Date(contractData.contract_end_date).toLocaleDateString() : 'N/A'}`, 25, yPosition)
  yPosition += 8
  
  // Compensation section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPENSATION', 20, yPosition)
  yPosition += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Basic Salary: ${contractData.basic_salary || 'N/A'} ${contractData.currency || 'OMR'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Allowances: ${contractData.allowances || 'N/A'} ${contractData.currency || 'OMR'}`, 25, yPosition)
  yPosition += 8
  
  // Promoter section
  if (contractData.promoter) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PROMOTER INFORMATION', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${contractData.promoter.name_en}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact: ${contractData.promoter.mobile_number || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Email: ${contractData.promoter.email || 'N/A'}`, 25, yPosition)
    yPosition += 8
  }
  
  // Contract Status section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('CONTRACT STATUS', 20, yPosition)
  yPosition += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Status: ${contractData.status || 'Draft'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Approval Status: ${contractData.approval_status || 'Pending'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Created: ${contractData.created_at ? new Date(contractData.created_at).toLocaleDateString() : 'N/A'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Last Updated: ${contractData.updated_at ? new Date(contractData.updated_at).toLocaleDateString() : 'N/A'}`, 25, yPosition)
  yPosition += 8
  
  // Terms and Conditions section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('TERMS AND CONDITIONS', 20, yPosition)
  yPosition += 10
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  const terms = [
    '1. This employment contract is legally binding and enforceable under applicable labor laws.',
    '2. The employee agrees to perform the duties and responsibilities associated with the position.',
    '3. The employer agrees to provide the compensation and benefits as outlined in this contract.',
    '4. Both parties agree to comply with all applicable laws and regulations.',
    '5. This contract may be terminated by either party with appropriate notice as required by law.',
    '6. Any disputes arising from this contract will be resolved through appropriate legal channels.'
  ]
  
  terms.forEach(term => {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    doc.text(term, 25, yPosition, { maxWidth: 160 })
    yPosition += 8
  })
  
  // Signatures section
  if (yPosition > 220) {
    doc.addPage()
    yPosition = 20
  }
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('SIGNATURES', 20, yPosition)
  yPosition += 15
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Employer Signature: _________________________    Date: _________________', 25, yPosition)
  yPosition += 10
  doc.text('Employee Signature: _________________________    Date: _________________', 25, yPosition)
  yPosition += 10
  doc.text(`Promoter Signature: ${contractData.promoter ? '_________________________' : 'N/A'}    Date: ${contractData.promoter ? '_________________' : 'N/A'}`, 25, yPosition)
  
  // Footer
  doc.setFontSize(8)
  doc.text('This contract is generated electronically and is legally binding.', 20, 280)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 285)
  doc.text(`Contract ID: ${contractData.id}`, 20, 290)
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
} 