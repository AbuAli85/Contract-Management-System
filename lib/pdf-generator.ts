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

export async function generateContractPDF(contract: ContractData): Promise<Buffer> {
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
  doc.text(`Contract Number: ${contract.contract_number}`, 20, 35)
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 42)
  
  let yPosition = 55
  
  // Parties section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PARTIES', 20, yPosition)
  yPosition += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  
  if (contract.first_party) {
    doc.setFont('helvetica', 'bold')
    doc.text('EMPLOYER:', 20, yPosition)
    yPosition += 6
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${contract.first_party.name_en}`, 25, yPosition)
    yPosition += 5
    doc.text(`CRN: ${contract.first_party.crn || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Address: ${contract.first_party.address_en || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Person: ${contract.first_party.contact_person || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Email: ${contract.first_party.contact_email || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Phone: ${contract.first_party.contact_phone || 'N/A'}`, 25, yPosition)
    yPosition += 8
  } else {
    doc.text('Employer: Not specified', 25, yPosition)
    yPosition += 8
  }
  
  if (contract.second_party) {
    doc.setFont('helvetica', 'bold')
    doc.text('EMPLOYEE:', 20, yPosition)
    yPosition += 6
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${contract.second_party.name_en}`, 25, yPosition)
    yPosition += 5
    doc.text(`Email: ${contract.email || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Person: ${contract.second_party.contact_person || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Email: ${contract.second_party.contact_email || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact Phone: ${contract.second_party.contact_phone || 'N/A'}`, 25, yPosition)
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
  doc.text(`Position: ${contract.job_title || 'N/A'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Department: ${contract.department || 'N/A'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Work Location: ${contract.work_location || 'N/A'}`, 25, yPosition)
  yPosition += 8
  
  // Contract Terms section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('CONTRACT TERMS', 20, yPosition)
  yPosition += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Contract Type: ${contract.contract_type || 'N/A'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Start Date: ${contract.contract_start_date ? new Date(contract.contract_start_date).toLocaleDateString() : 'N/A'}`, 25, yPosition)
  yPosition += 5
  doc.text(`End Date: ${contract.contract_end_date ? new Date(contract.contract_end_date).toLocaleDateString() : 'N/A'}`, 25, yPosition)
  yPosition += 8
  
  // Compensation section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPENSATION', 20, yPosition)
  yPosition += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Basic Salary: ${contract.basic_salary || 'N/A'} ${contract.currency || 'OMR'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Allowances: ${contract.allowances || 'N/A'} ${contract.currency || 'OMR'}`, 25, yPosition)
  yPosition += 8
  
  // Promoter section
  if (contract.promoter) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('PROMOTER INFORMATION', 20, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${contract.promoter.name_en}`, 25, yPosition)
    yPosition += 5
    doc.text(`Contact: ${contract.promoter.mobile_number || 'N/A'}`, 25, yPosition)
    yPosition += 5
    doc.text(`Email: ${contract.promoter.email || 'N/A'}`, 25, yPosition)
    yPosition += 8
  }
  
  // Contract Status section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('CONTRACT STATUS', 20, yPosition)
  yPosition += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Status: ${contract.status || 'Draft'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Approval Status: ${contract.approval_status || 'Pending'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Created: ${contract.created_at ? new Date(contract.created_at).toLocaleDateString() : 'N/A'}`, 25, yPosition)
  yPosition += 5
  doc.text(`Last Updated: ${contract.updated_at ? new Date(contract.updated_at).toLocaleDateString() : 'N/A'}`, 25, yPosition)
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
  doc.text(`Promoter Signature: ${contract.promoter ? '_________________________' : 'N/A'}    Date: ${contract.promoter ? '_________________' : 'N/A'}`, 25, yPosition)
  
  // Footer
  doc.setFontSize(8)
  doc.text('This contract is generated electronically and is legally binding.', 20, 280)
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 285)
  doc.text(`Contract ID: ${contract.id}`, 20, 290)
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
} 