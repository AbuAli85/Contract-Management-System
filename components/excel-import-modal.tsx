"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, XCircle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseClient } from "@/lib/supabase"
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
  email?: string
  phone?: string
  mobile_number?: string
  passport_number?: string
  nationality?: string
  id_card_expiry_date?: string
  passport_expiry_date?: string
  notes?: string
  status?: string
}

export default function ExcelImportModal({ isOpen, onClose, onImportComplete }: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewData, setPreviewData] = useState<PromoterData[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<"upload" | "preview" | "import" | "complete">("upload")
  const { toast } = useToast()

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
      const arrayBuffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (jsonData.length < 2) {
        throw new Error("File must contain at least a header row and one data row")
      }

      // Extract headers and data
      const headers = jsonData[0] as string[]
      const dataRows = jsonData.slice(1) as any[][]

      // Map headers to expected fields
      const mappedData = dataRows.map((row, index) => {
        const rowData: any = {}
        headers.forEach((header, colIndex) => {
          const value = row[colIndex]
          if (value !== undefined && value !== null) {
            rowData[header.trim()] = value
          }
        })

        // Map to expected format
        return {
          name_en: rowData["Name (English)"] || rowData["Name_EN"] || rowData["Name"] || "",
          name_ar: rowData["Name (Arabic)"] || rowData["Name_AR"] || rowData["Arabic Name"] || "",
          id_card_number: rowData["ID Card Number"] || rowData["ID_Number"] || rowData["National ID"] || "",
          mobile_number: rowData["Mobile"] || rowData["Mobile Number"] || "",
          passport_number: rowData["Passport Number"] || rowData["Passport_Number"] || "",
          nationality: rowData["Nationality"] || "",
          id_card_expiry_date: rowData["ID Expiry Date"] || rowData["ID_Expiry"] || "",
          passport_expiry_date: rowData["Passport Expiry Date"] || rowData["Passport_Expiry"] || "",
          notes: rowData["Notes"] || rowData["Comments"] || "",
          status: rowData["Status"] || "active"
        }
      }).filter(row => row.name_en && row.id_card_number) // Only include rows with required fields

      setPreviewData(mappedData.slice(0, 10)) // Show first 10 rows as preview
      setStep("preview")
      setProgress(100)
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [toast])

  const handleImport = useCallback(async () => {
    if (!file) return

    setIsProcessing(true)
    setProgress(0)
    setStep("import")

    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      const headers = jsonData[0] as string[]
      const dataRows = jsonData.slice(1) as any[][]

      const mappedData = dataRows.map((row, index) => {
        const rowData: any = {}
        headers.forEach((header, colIndex) => {
          const value = row[colIndex]
          if (value !== undefined && value !== null) {
            rowData[header.trim()] = value
          }
        })

        return {
          name_en: rowData["Name (English)"] || rowData["Name_EN"] || rowData["Name"] || "",
          name_ar: rowData["Name (Arabic)"] || rowData["Name_AR"] || rowData["Arabic Name"] || "",
          id_card_number: rowData["ID Card Number"] || rowData["ID_Number"] || rowData["National ID"] || "",
          mobile_number: rowData["Mobile"] || rowData["Mobile Number"] || "",
          passport_number: rowData["Passport Number"] || rowData["Passport_Number"] || "",
          nationality: rowData["Nationality"] || "",
          id_card_expiry_date: rowData["ID Expiry Date"] || rowData["ID_Expiry"] || "",
          passport_expiry_date: rowData["Passport Expiry Date"] || rowData["Passport_Expiry"] || "",
          notes: rowData["Notes"] || rowData["Comments"] || "",
          status: rowData["Status"] || "active"
        }
      }).filter(row => row.name_en && row.id_card_number)

      const supabase = getSupabaseClient()
      
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error("Authentication error:", authError)
        toast({
          title: "Authentication Error",
          description: "Please log in again to import promoters",
          variant: "destructive",
        })
        return
      }
      
      if (!user) {
        console.error("No authenticated user")
        toast({
          title: "Authentication Required",
          description: "Please log in to import promoters",
          variant: "destructive",
        })
        return
      }
      
      console.log("Authenticated user:", user.email)
      
      // Check user role and permissions
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      
      if (profileError) {
        console.error("Error fetching user profile:", profileError)
      } else {
        console.log("User role:", profileData?.role)
      }
      
      // Test database connection and permissions
      const { data: testData, error: testError } = await supabase
        .from("promoters")
        .select("id")
        .limit(1)
      
      if (testError) {
        console.error("Database connection test failed:", testError)
        toast({
          title: "Database Connection Error",
          description: "Unable to connect to database. Please try again.",
          variant: "destructive",
        })
        return
      }
      
      console.log("Database connection test successful")
      
      let imported = 0
      let duplicates = 0
      const errors: string[] = []

      for (let i = 0; i < mappedData.length; i++) {
        const row = mappedData[i]
        
        try {
          // Validate required fields
          if (!row.name_en || !row.name_ar || !row.id_card_number) {
            errors.push(`Row ${i + 2}: Missing required fields (Name EN, Name AR, or ID Card Number)`)
            continue
          }

                     // Validate and clean data
           const cleanData = {
             name_en: row.name_en.trim(),
             name_ar: row.name_ar.trim(),
             id_card_number: row.id_card_number.trim(),
             mobile_number: row.mobile_number ? row.mobile_number.trim() : null,
             passport_number: row.passport_number ? row.passport_number.trim() : null,
             nationality: row.nationality ? row.nationality.trim() : null,
             notes: row.notes ? row.notes.trim() : null,
             status: row.status || "active"
           }

                     // Email validation removed since email field is not currently supported in database
           // TODO: Re-enable email validation after running migration to add email field

          // Check for existing promoter with same ID
          const { data: existing } = await supabase
            .from("promoters")
            .select("id")
            .eq("id_card_number", row.id_card_number)
            .single()

          if (existing) {
            duplicates++
            errors.push(`Row ${i + 2}: Duplicate ID card number - ${row.id_card_number}`)
            continue
          }

          // Helper function to format dates
          const formatDate = (dateString: string | null | undefined) => {
            if (!dateString) return null;
            
            try {
              let date: Date;
              
              // Handle various date formats
              if (dateString.includes('/')) {
                const parts = dateString.split('/');
                if (parts.length === 3) {
                  const day = parseInt(parts[0]);
                  const month = parseInt(parts[1]) - 1; // Month is 0-indexed
                  const year = parseInt(parts[2]);
                  date = new Date(year, month, day);
                } else {
                  date = new Date(dateString);
                }
              } else if (dateString.includes('-')) {
                // Handle YYYY-MM-DD format
                date = new Date(dateString);
              } else if (dateString.includes('.')) {
                // Handle dd.mm.yyyy format
                const parts = dateString.split('.');
                if (parts.length === 3) {
                  const day = parseInt(parts[0]);
                  const month = parseInt(parts[1]) - 1;
                  const year = parseInt(parts[2]);
                  date = new Date(year, month, day);
                } else {
                  date = new Date(dateString);
                }
              } else {
                date = new Date(dateString);
              }
              
              if (isNaN(date.getTime())) return null;
              return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format for database
            } catch (error) {
              console.warn(`Invalid date format: ${dateString}`);
              return null;
            }
          };

          // Insert new promoter - only include fields that exist in the database
          const insertData = {
            name_en: cleanData.name_en,
            name_ar: cleanData.name_ar,
            id_card_number: cleanData.id_card_number,
            mobile_number: cleanData.mobile_number,
            passport_number: cleanData.passport_number,
            nationality: cleanData.nationality,
            id_card_expiry_date: formatDate(row.id_card_expiry_date),
            passport_expiry_date: formatDate(row.passport_expiry_date),
            notes: cleanData.notes,
            status: cleanData.status,
            created_at: new Date().toISOString()
          }
          
          // Add email and phone only if they exist in the database (will be added by migration)
          // For now, we'll skip them to avoid schema errors
          // TODO: Uncomment these lines after running the migration
          // if (cleanData.email) insertData.email = cleanData.email;
          // if (cleanData.phone) insertData.phone = cleanData.phone;
          
                     console.log(`Inserting promoter data for row ${i + 2}:`, insertData)
           
           // Test the insert with more detailed error logging
           const { data: insertDataResult, error: insertError } = await supabase
             .from("promoters")
             .insert([insertData])
             .select()

          if (insertError) {
            console.error(`Row ${i + 2} insertion error:`, insertError)
            console.error(`Row ${i + 2} error details:`, {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            })
            
            // Provide more specific error messages
            let errorMessage = insertError.message
            if (insertError.message.includes("schema cache")) {
              errorMessage = "Database schema issue - please contact administrator"
            } else if (insertError.message.includes("duplicate key")) {
              errorMessage = "Duplicate ID card number already exists"
            } else if (insertError.message.includes("not null")) {
              errorMessage = "Required field missing or invalid"
            } else if (insertError.message.includes("address")) {
              errorMessage = "Address field not supported in database schema"
            } else if (insertError.message.includes("permission")) {
              errorMessage = "Permission denied - check your user role"
            } else if (insertError.message.includes("RLS")) {
              errorMessage = "Row Level Security policy violation"
            } else if (insertError.message.includes("column") && insertError.message.includes("does not exist")) {
              errorMessage = "Database column does not exist - schema mismatch"
            }
            errors.push(`Row ${i + 2}: ${errorMessage}`)
          } else {
            imported++
            console.log(`Successfully imported promoter: ${row.name_en}`)
            console.log(`Insert result:`, insertDataResult)
          }

          // Update progress
          setProgress(((i + 1) / mappedData.length) * 100)
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : "Unknown error"}`)
        }
      }

      const result: ImportResult = {
        success: imported > 0,
        message: `Import completed. ${imported} promoters imported, ${duplicates} duplicates skipped.`,
        imported,
        errors,
        duplicates
      }

      setImportResult(result)
      setStep("complete")

      if (imported > 0) {
        toast({
          title: "Import successful",
          description: `Imported ${imported} promoters successfully`,
          variant: "default",
        })
        onImportComplete()
      }
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [file, toast, onImportComplete])

  const downloadTemplate = useCallback(() => {
    const templateData = [
      {
                 "Name (English)": "John Smith",
         "Name (Arabic)": "جون سميث",
         "ID Card Number": "1234567890",
         "Mobile": "+966501234567",
         "Passport Number": "A12345678",
         "Nationality": "Saudi",
         "ID Expiry Date": "31/12/2025",
         "Passport Expiry Date": "30/06/2026",
         "Notes": "Sample promoter",
         "Status": "active"
      },
      {
                 "Name (English)": "Jane Doe",
         "Name (Arabic)": "جين دو",
         "ID Card Number": "0987654321",
         "Mobile": "+966509876543",
         "Passport Number": "B87654321",
         "Nationality": "American",
         "ID Expiry Date": "15/08/2025",
         "Passport Expiry Date": "20/03/2026",
         "Notes": "Another sample promoter",
         "Status": "active"
      }
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Promoters Template")
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement("a")
    link.href = url
    link.download = "promoters_template.xlsx"
    link.click()
    
    URL.revokeObjectURL(url)
  }, [])

  const resetForm = useCallback(() => {
    setFile(null)
    setPreviewData([])
    setImportResult(null)
    setStep("upload")
    setProgress(0)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Promoters from Excel
          </DialogTitle>
                     <DialogDescription>
             Upload an Excel file to import promoter data. The file should contain columns for Name (English), Name (Arabic), ID Card Number, Mobile, Passport Number, Nationality, and other optional fields. Date fields support formats: dd/mm/yyyy, dd.mm.yyyy, or yyyy-mm-dd. Email and Phone fields are not currently supported.
           </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Template
                </CardTitle>
                <CardDescription>
                  Download the Excel template to see the required format
                </CardDescription>
              </CardHeader>
                             <CardContent>
                 <div className="space-y-2">
                   <Button onClick={downloadTemplate} variant="outline">
                     <Download className="mr-2 h-4 w-4" />
                     Download Template
                   </Button>
                   <Button 
                     onClick={async () => {
                       const supabase = getSupabaseClient()
                       const { data: { user } } = await supabase.auth.getUser()
                       console.log("Current user:", user?.email)
                       
                       const { data, error } = await supabase
                         .from("promoters")
                         .select("id")
                         .limit(1)
                       
                       if (error) {
                         console.error("Database test failed:", error)
                         toast({
                           title: "Database Test Failed",
                           description: error.message,
                           variant: "destructive",
                         })
                       } else {
                         console.log("Database test successful:", data)
                         toast({
                           title: "Database Test Successful",
                           description: "Connection to database is working",
                           variant: "default",
                         })
                       }
                     }} 
                     variant="outline"
                     size="sm"
                   >
                     Test Database Connection
                   </Button>
                 </div>
               </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </CardTitle>
                <CardDescription>
                  Select an Excel file (.xlsx, .xls) or CSV file to import
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="file">Excel File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      disabled={isProcessing}
                    />
                  </div>
                  
                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm">Processing file...</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Preview of the first 10 rows. Please review the data before importing.
              </AlertDescription>
            </Alert>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Name (EN)</th>
                    <th className="p-2 text-left">Name (AR)</th>
                    <th className="p-2 text-left">ID Number</th>
                    <th className="p-2 text-left">Mobile</th>
                    <th className="p-2 text-left">Passport</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{row.name_en}</td>
                      <td className="p-2">{row.name_ar}</td>
                      <td className="p-2">{row.id_card_number}</td>
                      <td className="p-2">{row.mobile_number || "-"}</td>
                      <td className="p-2">{row.passport_number || "-"}</td>
                      <td className="p-2">
                        <Badge variant={row.status === "active" ? "default" : "secondary"}>
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === "import" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium">Importing promoters...</p>
              <p className="text-sm text-muted-foreground">Please wait while we import the data</p>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {step === "complete" && importResult && (
          <div className="space-y-4">
            <Alert className={importResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {importResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={importResult.success ? "text-green-800" : "text-red-800"}>
                {importResult.message}
              </AlertDescription>
            </Alert>

            {importResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Import Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 p-2 bg-red-50 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-sm text-green-600">Imported</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{importResult.duplicates}</div>
                <div className="text-sm text-yellow-600">Duplicates</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                <div className="text-sm text-red-600">Errors</div>
              </div>
            </div>
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
                Import Data
              </Button>
            </>
          )}
          
          {step === "complete" && (
            <>
              <Button variant="outline" onClick={resetForm}>
                Import Another File
              </Button>
              <Button onClick={handleClose}>
                Close
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 