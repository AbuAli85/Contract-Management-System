"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import * as XLSX from "xlsx"

interface ExcelImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

interface ImportResult {
  success: boolean
  message: string
  imported: number
  errors: string[]
  duplicates: number
}

interface PromoterData {
  name_en: string
  name_ar: string
  id_card_number: string
  mobile_number?: string
  passport_number?: string
  nationality?: string
  id_card_expiry_date?: string | null
  passport_expiry_date?: string | null
  notes?: string
  status?: string
  employer_id?: string
}

interface Company {
  id: string
  name_en: string
  name_ar: string
}

export default function ExcelImportModal({ isOpen, onClose, onImportComplete }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewData, setPreviewData] = useState<PromoterData[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<"upload" | "preview" | "import" | "complete">("upload")
  const [companies, setCompanies] = useState<Company[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const { toast } = useToast()

  // Fetch companies when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCompanies()
    }
  }, [isOpen])

  const fetchCompanies = useCallback(async () => {
    setCompaniesLoading(true)
    try {
      const supabase = createClient()
      if (!supabase) {
        console.error("Supabase client not available")
        return
      }

      const { data, error } = await supabase
        .from("parties")
        .select("id, name_en, name_ar")
        .eq("type", "Employer")
        .order("name_en")

      if (error) {
        console.error("Error fetching companies:", error)
        toast({
          title: "Error loading companies",
          description: "Could not load company list for template",
          variant: "destructive",
        })
        return
      }

      setCompanies(data || [])
    } catch (error) {
      console.error("Error fetching companies:", error)
    } finally {
      setCompaniesLoading(false)
    }
  }, [toast])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv" // .csv
    ]

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an Excel file (.xlsx, .xls) or CSV file",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    processFile(selectedFile)
  }, [toast])

  const processFile = useCallback(async (selectedFile: File) => {
    setIsProcessing(true)
    setProgress(0)

    try {
      console.log("=== FILE PROCESSING DEBUG START ===")
      console.log("Processing file:", selectedFile.name, "Size:", selectedFile.size)
      
      const arrayBuffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      
      console.log("Workbook sheets:", workbook.SheetNames)
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      console.log("Processing sheet:", sheetName)
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      console.log("Raw JSON data length:", jsonData.length)
      console.log("Raw JSON data:", jsonData)
      
      if (jsonData.length < 2) {
        throw new Error("File must contain at least a header row and one data row")
      }

      // Extract headers and data
      const headers = jsonData[0] as string[]
      const dataRows = jsonData.slice(1) as any[][]

      console.log("Headers:", headers)
      console.log("Data rows count:", dataRows.length)
      console.log("Data rows:", dataRows)

      // Map data to PromoterData interface
      const mappedData: PromoterData[] = dataRows.map((row, index) => {
        console.log(`Mapping row ${index + 1}:`, row)
        
        const formatDate = (dateString: string | null | undefined) => {
          if (!dateString) return null
          
          const dateStr = String(dateString).trim()
          if (!dateStr) return null
          
          console.log(`Formatting date: "${dateStr}"`)
          
          // Try dd-mm-yyyy format (with dashes)
          if (dateStr.includes('-') && dateStr.length === 10) {
            const parts = dateStr.split('-')
            console.log(`Split by -: ${parts}`)
            if (parts.length === 3) {
              // Check if it's already in yyyy-mm-dd format
              if (parts[0].length === 4) {
                console.log(`Already in yyyy-mm-dd format: ${dateStr}`)
                return dateStr
              }
              // Convert dd-mm-yyyy to yyyy-mm-dd
              const day = parts[0].padStart(2, '0')
              const month = parts[1].padStart(2, '0')
              const year = parts[2]
              const formattedDate = `${year}-${month}-${day}`
              console.log(`Formatted dd-mm-yyyy: ${formattedDate}`)
              return formattedDate
            }
          }
          
          // Try dd/mm/yyyy format
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/')
            console.log(`Split by /: ${parts}`)
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0')
              const month = parts[1].padStart(2, '0')
              const year = parts[2]
              const formattedDate = `${year}-${month}-${day}`
              console.log(`Formatted dd/mm/yyyy: ${formattedDate}`)
              return formattedDate
            }
          }
          
          // Try dd.mm.yyyy format
          if (dateStr.includes('.')) {
            const parts = dateStr.split('.')
            console.log(`Split by .: ${parts}`)
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0')
              const month = parts[1].padStart(2, '0')
              const year = parts[2]
              const formattedDate = `${year}-${month}-${day}`
              console.log(`Formatted dd.mm.yyyy: ${formattedDate}`)
              return formattedDate
            }
          }
          
          console.log(`Could not format date: "${dateStr}"`)
          return null
        }

        const mappedRow = {
          name_en: String(row[0] || "").trim(),
          name_ar: String(row[1] || "").trim(),
          id_card_number: String(row[2] || "").trim(),
          mobile_number: String(row[3] || "").trim(),
          passport_number: String(row[4] || "").trim(),
          nationality: String(row[5] || "").trim(),
          id_card_expiry_date: formatDate(row[6]),
          passport_expiry_date: formatDate(row[7]),
          notes: String(row[8] || "").trim(),
          status: String(row[9] || "active").trim(),
          employer_id: String(row[10] || "").trim() || undefined
        }
        
        console.log(`Mapped row ${index + 1}:`, mappedRow)
        return mappedRow
      })

      console.log("Final mapped data:", mappedData)

      // Filter out empty rows
      const validData = mappedData.filter(row => {
        const isValid = row.name_en && row.name_ar && row.id_card_number
        console.log(`Row validation: ${row.name_en} - ${row.name_ar} - ${row.id_card_number} = ${isValid}`)
        
        // Additional validation for required fields
        if (!row.name_en) {
          console.log(`Row skipped: Missing English name`)
          return false
        }
        if (!row.name_ar) {
          console.log(`Row skipped: Missing Arabic name`)
          return false
        }
        if (!row.id_card_number) {
          console.log(`Row skipped: Missing ID card number`)
          return false
        }
        
        return isValid
      })

      console.log("Valid data count:", validData.length)
      console.log("Valid data:", validData)

      if (validData.length === 0) {
        throw new Error("No valid promoter data found in the file")
      }

      console.log("=== FILE PROCESSING DEBUG END ===")
      setPreviewData(validData)
      setStep("preview")
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setProgress(100)
    }
  }, [toast])

  const handleImport = useCallback(async () => {
    if (previewData.length === 0) {
      toast({
        title: "No data to import",
        description: "Please upload a file with valid promoter data",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)
    setStep("import")

    try {
      const supabase = createClient()
      
      if (!supabase) {
        throw new Error("Database connection not available")
      }

      // Test authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error("Authentication required")
      }

      console.log("=== IMPORT DEBUG START ===")
      console.log("Starting import process for", previewData.length, "promoters")
      console.log("Preview data:", previewData)

      let imported = 0
      let duplicates = 0
      const errors: string[] = []
      let importedWithCompany = 0

      for (let i = 0; i < previewData.length; i++) {
        const promoter = previewData[i]
        
        try {
          console.log(`\n--- Processing row ${i + 2} ---`)
          console.log("Promoter data:", promoter)
          
          // Check for existing promoter with same ID card number
          const { data: existing, error: checkError } = await supabase
            .from("promoters")
            .select("id, employer_id")
            .eq("id_card_number", promoter.id_card_number)
            .single()

          if (checkError && checkError.code !== 'PGRST116') {
            console.error(`Error checking existing promoter for row ${i + 2}:`, checkError)
            errors.push(`Row ${i + 2}: Error checking existing promoter - ${checkError.message}`)
            continue
          }

          if (existing) {
            console.log(`Row ${i + 2}: Existing promoter found - ${promoter.id_card_number}`)
            
            // If promoter exists but has no company assignment, try to assign company
            if (!existing.employer_id && promoter.employer_id && promoter.employer_id.trim()) {
              console.log(`Row ${i + 2}: Attempting to assign company to existing promoter`)
              
              // Validate company ID
              const { data: companyData, error: companyError } = await supabase
                .from("parties")
                .select("id")
                .eq("id", promoter.employer_id.trim())
                .eq("type", "Employer")
                .single()

              if (!companyError && companyData) {
                // Update existing promoter with company assignment
                const { error: updateError } = await supabase
                  .from("promoters")
                  .update({ employer_id: promoter.employer_id.trim() })
                  .eq("id", existing.id)

                if (updateError) {
                  console.error(`Row ${i + 2}: Failed to update promoter with company:`, updateError)
                  errors.push(`Row ${i + 2}: Failed to assign company to existing promoter`)
                } else {
                  console.log(`Row ${i + 2}: Successfully assigned company to existing promoter`)
                  imported++
                  importedWithCompany++
                }
              } else {
                console.log(`Row ${i + 2}: Invalid company ID for existing promoter - ${promoter.employer_id}`)
                duplicates++
                errors.push(`Row ${i + 2}: Promoter exists but invalid company ID provided`)
              }
            } else {
              console.log(`Row ${i + 2}: Promoter already exists with company or no company provided`)
              duplicates++
              errors.push(`Row ${i + 2}: Promoter with ID card number ${promoter.id_card_number} already exists`)
            }
            continue
          }

          // Validate company ID if provided
          if (promoter.employer_id && promoter.employer_id.trim()) {
            console.log(`Row ${i + 2}: Validating company ID: ${promoter.employer_id}`)
            
            const { data: companyData, error: companyError } = await supabase
              .from("parties")
              .select("id")
              .eq("id", promoter.employer_id.trim())
              .eq("type", "Employer")
              .single()

            if (companyError || !companyData) {
              console.error(`Row ${i + 2}: Invalid company ID - ${promoter.employer_id}`)
              // Instead of failing, just remove the invalid company ID
              promoter.employer_id = undefined
              console.log(`Row ${i + 2}: Removed invalid company ID, will import without company assignment`)
            } else {
              importedWithCompany++
            }
          }

          // Prepare data for insertion (remove undefined values)
          const insertData = {
            name_en: promoter.name_en,
            name_ar: promoter.name_ar,
            id_card_number: promoter.id_card_number,
            mobile_number: promoter.mobile_number || null,
            passport_number: promoter.passport_number || null,
            nationality: promoter.nationality || null,
            id_card_expiry_date: promoter.id_card_expiry_date,
            passport_expiry_date: promoter.passport_expiry_date,
            notes: promoter.notes || null,
            status: promoter.status || "active",
            ...(promoter.employer_id && { employer_id: promoter.employer_id })
          }

          console.log(`Row ${i + 2}: Inserting data:`, insertData)

          const { data: insertResult, error: insertError } = await supabase
            .from("promoters")
            .insert(insertData)
            .select()

          if (insertError) {
            console.error(`Row ${i + 2}: Insert error:`, insertError)
            console.error(`Row ${i + 2}: Insert data that failed:`, insertData)
            
            // Provide more specific error messages
            let errorMessage = insertError.message
            if (insertError.code === '22008') {
              errorMessage = `Invalid date format. Please use DD/MM/YYYY or DD-MM-YYYY format.`
            } else if (insertError.code === '23505') {
              errorMessage = `Duplicate entry. This promoter already exists.`
            } else if (insertError.code === '23503') {
              errorMessage = `Invalid company ID. Please check the company reference.`
            }
            
            errors.push(`Row ${i + 2}: ${errorMessage}`)
          } else {
            console.log(`Row ${i + 2}: Successfully imported:`, insertResult)
            imported++
          }

          // Update progress
          setProgress(((i + 1) / previewData.length) * 100)
        } catch (error) {
          console.error(`Error importing row ${i + 2}:`, error)
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }

      console.log(`=== IMPORT COMPLETED ===`)
      console.log(`Total processed: ${previewData.length}`)
      console.log(`Successfully imported: ${imported}`)
      console.log(`Duplicates skipped: ${duplicates}`)
      console.log(`Errors: ${errors.length}`)
      console.log(`Promoters with company: ${importedWithCompany}`)
      console.log(`Promoters without company: ${imported - importedWithCompany}`)

      if (imported > 0) {
        toast({
          title: "Import completed",
          description: `Successfully processed ${imported} promoters. ${importedWithCompany} with company assignment, ${imported - importedWithCompany} without company.`,
        })
        onImportComplete()
      } else if (duplicates > 0) {
        toast({
          title: "Import completed",
          description: `All promoters already exist in the database. ${duplicates} promoters were skipped as duplicates.`,
        })
        onImportComplete()
      } else {
        toast({
          title: "Import failed",
          description: "No promoters were processed. Please check the data and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Import error:", error)
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "Import failed",
        imported: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        duplicates: 0
      })
    } finally {
      setIsProcessing(false)
      setStep("complete")
    }
  }, [previewData, onImportComplete, toast])

  const handleClose = useCallback(() => {
    setFile(null)
    setPreviewData([])
    setImportResult(null)
    setStep("upload")
    setProgress(0)
    onClose()
  }, [onClose])

  const downloadTemplate = useCallback(() => {
    // Create template with company dropdown
    const templateData = [
      ["Name (EN)", "Name (AR)", "ID Card Number", "Mobile Number", "Passport Number", "Nationality", "ID Expiry Date", "Passport Expiry Date", "Notes", "Status", "Company ID"],
      ["John Doe", "جون دو", "1234567890", "+966501234567", "A12345678", "Saudi", "15/08/2025", "20/03/2026", "Sample promoter", "active", ""]
    ]

    // Add company options as a separate sheet for reference
    const companyOptions = [
      ["Company ID", "Company Name (EN)", "Company Name (AR)"],
      ...companies.map(company => [
        company.id,
        company.name_en || "",
        company.name_ar || ""
      ])
    ]

    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wsCompanies = XLSX.utils.aoa_to_sheet(companyOptions)
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Promoters Template")
    XLSX.utils.book_append_sheet(wb, wsCompanies, "Companies Reference")
    
    const fileName = "promoters-template-with-companies.xlsx"
    XLSX.writeFile(wb, fileName)
  }, [companies])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Promoters from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import promoter data. The file should include columns for name, ID card number, and other required fields. Company assignment is optional - promoters can be assigned to companies after import. Download the template to see the correct format with company options.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Upload File</CardTitle>
                <CardDescription>
                  Select an Excel (.xlsx, .xls) or CSV file containing promoter data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button onClick={downloadTemplate} variant="outline" disabled={companiesLoading}>
                      <Download className="mr-2 h-4 w-4" />
                      {companiesLoading ? "Loading Companies..." : "Download Template"}
                    </Button>
                    <Button onClick={() => document.getElementById('file-input')?.click()} disabled={isProcessing}>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                  </div>
                  
                  <input
                    id="file-input"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {file && (
                    <div className="flex items-center gap-2 p-3 border rounded-md">
                      <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="secondary">{file.size} bytes</Badge>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={progress} />
                      <p className="text-sm text-muted-foreground">Processing file...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Preview Data</CardTitle>
                <CardDescription>
                  Review the data before importing. {previewData.length} promoters found.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Name (EN)</th>
                        <th className="p-2 text-left">Name (AR)</th>
                        <th className="p-2 text-left">ID Card</th>
                        <th className="p-2 text-left">Mobile</th>
                        <th className="p-2 text-left">Company</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((promoter, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{promoter.name_en}</td>
                          <td className="p-2">{promoter.name_ar}</td>
                          <td className="p-2">{promoter.id_card_number}</td>
                          <td className="p-2">{promoter.mobile_number}</td>
                          <td className="p-2">
                            {promoter.employer_id ? (
                              (() => {
                                const company = companies.find(c => c.id === promoter.employer_id)
                                return company ? (company.name_en || company.name_ar || company.id) : promoter.employer_id
                              })()
                            ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge variant={promoter.status === "active" ? "default" : "secondary"}>
                              {promoter.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {previewData.length > 10 && (
                        <tr>
                          <td colSpan={6} className="p-2 text-center text-muted-foreground">
                            ... and {previewData.length - 10} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "import" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Importing Data</CardTitle>
                <CardDescription>
                  Please wait while we import the promoter data...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={progress} />
                  <p className="text-sm text-muted-foreground">
                    Importing {previewData.length} promoters...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "complete" && importResult && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  Import Complete
                </CardTitle>
                <CardDescription>
                  {importResult.message}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-md">
                      <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                      <div className="text-sm text-green-600">Imported</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-md">
                      <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                      <div className="text-sm text-yellow-600">Duplicates</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-md">
                      <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                      <div className="text-sm text-red-600">Errors</div>
                    </div>
                  </div>
                  
                  {importResult.errors.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="max-h-32 overflow-y-auto">
                          {importResult.errors.map((error, index) => (
                            <div key={index} className="text-sm text-red-600">
                              {error}
                            </div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </>
          )}
          
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isProcessing}>
                Import {previewData.length} Promoters
              </Button>
            </>
          )}
          
          {step === "complete" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
                             {(importResult?.imported || 0) > 0 && (
                 <Button onClick={handleClose}>
                   View Promoters
                 </Button>
               )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 