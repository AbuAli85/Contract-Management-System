"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
// Removed direct webhook import - now using API route

interface Provider {
  id: string
  full_name: string
}

interface ServiceFormProps {
  providers: Provider[]
}

type FormStatus = "idle" | "saving" | "success" | "error"

export function ServiceForm({ providers }: ServiceFormProps) {
  const [serviceName, setServiceName] = useState("")
  const [providerId, setProviderId] = useState("")
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const { toast } = useToast()
  const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!serviceName.trim()) {
      setErrorMessage("Service name is required")
      return
    }

    if (!providerId) {
      setErrorMessage("Please select a provider")
      return
    }

    setStatus("saving")
    setErrorMessage("")

    const payload = {
      serviceId: crypto.randomUUID(),
      name: serviceName.trim(),
      providerId: providerId,
      createdAt: new Date().toISOString()
    }

    try {
      console.log("🔗 Sending service creation request:", payload)
      
      // Send webhook via API route
      const webhookResponse = await fetch("/api/webhooks/serviceCreation", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      })

      if (!webhookResponse.ok) {
        const errorData = await webhookResponse.json()
        throw new Error(errorData.error || `HTTP ${webhookResponse.status}: ${webhookResponse.statusText}`)
      }

      const webhookResult = await webhookResponse.json()
      console.log("✅ Service creation webhook successful:", webhookResult)
      
      setStatus("success")
      
      toast({
        title: "Service Created Successfully",
        description: "The service has been created and sent for approval via webhook.",
        variant: "default",
      })

      // Reset form after success
      setTimeout(() => {
        setServiceName("")
        setProviderId("")
        setStatus("idle")
      }, 2000)

    } catch (error) {
      console.error("❌ Service creation failed:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "Failed to create service")
      
      toast({
        title: "Service Creation Failed",
        description: error instanceof Error ? error.message : "An error occurred while creating the service",
        variant: "destructive",
      })
    }
  }

  const handleProviderChange = (value: string) => {
    setProviderId(value)
    if (errorMessage && errorMessage.includes("provider")) {
      setErrorMessage("")
    }
  }

  const handleServiceNameChange = (value: string) => {
    setServiceName(value)
    if (errorMessage && errorMessage.includes("name")) {
      setErrorMessage("")
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Name */}
        <div className="space-y-2">
          <Label htmlFor="service-name">Service Name *</Label>
          <Input
            id="service-name"
            type="text"
            required
            value={serviceName}
            onChange={(e) => handleServiceNameChange(e.target.value)}
            placeholder="Enter service name"
            className="w-full"
            disabled={status === "saving"}
          />
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider">Provider *</Label>
          <Select
            value={providerId}
            onValueChange={handleProviderChange}
            disabled={status === "saving"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {status === "success" && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Service created successfully! The service is now pending approval.
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={status === "saving" || !serviceName.trim() || !providerId}
            className="flex items-center gap-2"
          >
            {status === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Service...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Service
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/en/services")}
            disabled={status === "saving"}
          >
            View Services
          </Button>
        </div>
      </form>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What happens next?</p>
              <p className="text-blue-700">
                When you create a service, it will be sent to our approval system. 
                You'll receive notifications about the approval status, and the service 
                will appear in the services list once approved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 