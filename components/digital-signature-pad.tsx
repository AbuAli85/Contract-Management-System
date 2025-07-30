// components/digital-signature-pad.tsx
// Digital signature component with Supabase Storage integration

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Pen,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

// Import signature-pad dynamically to avoid SSR issues
let SignaturePad: any = null
if (typeof window !== "undefined") {
  SignaturePad = require("signature_pad").default
}

interface DigitalSignaturePadProps {
  contractId: string
  signerId: string
  signerType: "first_party" | "second_party" | "promoter" | "admin"
  signerName: string
  onSignatureComplete?: (signatureData: SignatureData) => void
  onSignatureError?: (error: string) => void
  readOnly?: boolean
  existingSignature?: SignatureData
}

export interface SignatureData {
  id: string
  contractId: string
  signerId: string
  signerType: string
  signerName: string
  signatureImageUrl: string
  signatureTimestamp: string
  ipAddress?: string
  userAgent?: string
}

export function DigitalSignaturePad({
  contractId,
  signerId,
  signerType,
  signerName,
  onSignatureComplete,
  onSignatureError,
  readOnly = false,
  existingSignature,
}: DigitalSignaturePadProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [signatureData, setSignatureData] = useState<SignatureData | null>(
    existingSignature || null,
  )
  const [error, setError] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 200 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  // Initialize signature pad
  useEffect(() => {
    if (!SignaturePad || !canvasRef.current || readOnly) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Set canvas size
    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    // Initialize signature pad
    signaturePadRef.current = new SignaturePad(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(0, 0, 0)",
      minWidth: 1,
      maxWidth: 2.5,
      throttle: 16,
    })

    // Handle window resize
    const handleResize = () => {
      const container = canvas.parentElement
      if (container) {
        const newWidth = Math.min(container.clientWidth - 32, 400)
        const newHeight = Math.min(newWidth * 0.5, 200)
        setCanvasSize({ width: newWidth, height: newHeight })
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
      if (signaturePadRef.current) {
        signaturePadRef.current.off()
      }
    }
  }, [readOnly, canvasSize])

  // Update canvas size when canvasSize changes
  useEffect(() => {
    if (!canvasRef.current || !signaturePadRef.current) return

    const canvas = canvasRef.current
    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    // Restore signature if it exists
    if (signatureData?.signatureImageUrl) {
      const img = new Image()
      img.onload = () => {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height)
        }
      }
      img.src = signatureData.signatureImageUrl
    } else {
      signaturePadRef.current.clear()
    }
  }, [canvasSize, signatureData])

  const handleStartDrawing = () => {
    setIsDrawing(true)
    setError(null)
  }

  const handleEndDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
    }
    setSignatureData(null)
    setError(null)
  }

  const saveSignature = async () => {
    if (!signaturePadRef.current || readOnly) return

    if (signaturePadRef.current.isEmpty()) {
      setError("Please provide a signature before saving")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Get signature data as image
      const signatureDataUrl = signaturePadRef.current.toDataURL("image/png")

      // Convert data URL to blob
      const response = await fetch(signatureDataUrl)
      const blob = await response.blob()

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const filename = `signatures/${contractId}/${signerType}_${signerId}_${timestamp}.png`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filename, blob, {
          contentType: "image/png",
          cacheControl: "3600",
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(filename)

      // Save signature record to database
      const { data: signatureRecord, error: dbError } = await supabase
        .from("signatures")
        .insert({
          contract_id: contractId,
          signer_id: signerId,
          signer_type: signerType,
          signature_image_url: urlData.publicUrl,
          signature_timestamp: new Date().toISOString(),
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      const newSignatureData: SignatureData = {
        id: signatureRecord.id,
        contractId,
        signerId,
        signerType,
        signerName,
        signatureImageUrl: urlData.publicUrl,
        signatureTimestamp: signatureRecord.signature_timestamp,
        ipAddress: signatureRecord.ip_address,
        userAgent: signatureRecord.user_agent,
      }

      setSignatureData(newSignatureData)

      toast({
        title: "Signature Saved",
        description: "Your signature has been successfully saved.",
        variant: "default",
      })

      onSignatureComplete?.(newSignatureData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save signature"
      setError(errorMessage)
      onSignatureError?.(errorMessage)

      toast({
        title: "Signature Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const downloadSignature = () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      setError("No signature to download")
      return
    }

    const dataUrl = signaturePadRef.current.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = `signature_${signerType}_${new Date().toISOString().split("T")[0]}.png`
    link.href = dataUrl
    link.click()
  }

  const getClientIP = async (): Promise<string | undefined> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json")
      const data = await response.json()
      return data.ip
    } catch {
      return undefined
    }
  }

  const getSignerTypeLabel = (type: string) => {
    switch (type) {
      case "first_party":
        return "First Party"
      case "second_party":
        return "Second Party"
      case "promoter":
        return "Promoter"
      case "admin":
        return "Administrator"
      default:
        return type
    }
  }

  if (readOnly && !existingSignature) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Digital Signature
          </CardTitle>
          <CardDescription>No signature available for {signerName}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pen className="h-5 w-5" />
          Digital Signature
        </CardTitle>
        <CardDescription>
          {readOnly ? "View signature" : "Sign the contract"} for {signerName}
        </CardDescription>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{getSignerTypeLabel(signerType)}</Badge>
          {signatureData && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Signed
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Signature Canvas */}
        <div className="overflow-hidden rounded-lg border">
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              cursor: readOnly ? "default" : "crosshair",
            }}
            onMouseDown={readOnly ? undefined : handleStartDrawing}
            onMouseUp={readOnly ? undefined : handleEndDrawing}
            onMouseLeave={readOnly ? undefined : handleEndDrawing}
            onTouchStart={readOnly ? undefined : handleStartDrawing}
            onTouchEnd={readOnly ? undefined : handleEndDrawing}
          />
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Signature Info */}
        {signatureData && (
          <div className="space-y-2 rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Signature Completed</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(signatureData.signatureTimestamp).toLocaleString()}</span>
            </div>
            {signatureData.ipAddress && (
              <div className="text-xs text-muted-foreground">IP: {signatureData.ipAddress}</div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={saveSignature}
              disabled={isSaving || !isDrawing}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Save Signature
                </>
              )}
            </Button>

            <Button
              onClick={clearSignature}
              variant="outline"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>

            <Button
              onClick={downloadSignature}
              variant="outline"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        )}

        {/* Instructions */}
        {!readOnly && !signatureData && (
          <div className="text-xs text-muted-foreground">
            <p>• Use your mouse or touch to draw your signature</p>
            <p>• Click "Save Signature" when you're satisfied</p>
            <p>• Your signature will be securely stored and timestamped</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Signature verification component
export function SignatureVerification({ signatures }: { signatures: SignatureData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Signature Verification
        </CardTitle>
        <CardDescription>{signatures.length} signature(s) verified</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {signatures.map((signature) => (
            <div key={signature.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex-shrink-0">
                <img
                  src={signature.signatureImageUrl}
                  alt={`Signature of ${signature.signerName}`}
                  className="h-8 w-16 rounded border object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{signature.signerName}</span>
                  <Badge variant="outline" className="text-xs">
                    {signature.signerType.replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(signature.signatureTimestamp).toLocaleString()}
                </div>
              </div>

              <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
