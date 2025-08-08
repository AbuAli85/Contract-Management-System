"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { sendServiceApproval } from "@/lib/webhooks/make-webhooks"

interface ApproveRejectButtonsProps {
  serviceId: string
  currentStatus: string
  onStatusUpdate?: (newStatus: string) => void
}

export function ApproveRejectButtons({ 
  serviceId, 
  currentStatus, 
  onStatusUpdate 
}: ApproveRejectButtonsProps) {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Check user's role from profiles table
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()
          
          setUserRole(profile?.role || null)
        }
      } catch (error) {
        console.error("Error checking user role:", error)
      } finally {
        setCheckingRole(false)
      }
    }

    checkUserRole()
  }, [])

  const updateServiceStatus = async (newStatus: "approved" | "rejected") => {
    setLoading(true)
    
    try {
      const payload = {
        service_id: serviceId,
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // Try webhook first using the webhook manager
      const webhookResult = await sendServiceApproval(payload)
      
      if (webhookResult.success) {
        console.log(`✅ Service ${newStatus} via webhook successful`)
        onStatusUpdate?.(newStatus)
        
        toast({
          title: `Service ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
          description: `The service has been ${newStatus} successfully.`,
          variant: "default",
        })
        return
      }

      // Fallback to direct API update if webhook fails
      console.log("🔄 Using API fallback for status update")
      const supabase = createClient()
      const { error } = await supabase
        .from("services")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", serviceId)

      if (error) {
        throw error
      }

      console.log(`✅ Service ${newStatus} via API successful`)
      onStatusUpdate?.(newStatus)
      
      toast({
        title: `Service ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        description: `The service has been ${newStatus} successfully.`,
        variant: "default",
      })

    } catch (error) {
      console.error(`❌ Failed to ${newStatus} service:`, error)
      
      toast({
        title: "Status Update Failed",
        description: `Failed to ${newStatus} the service. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking role
  if (checkingRole) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Checking permissions...</span>
      </div>
    )
  }

  // Only show buttons for admin users and pending services
  if (userRole !== "admin" || currentStatus !== "pending") {
    return null
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => updateServiceStatus("approved")}
        disabled={loading}
        size="sm"
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        Approve
      </Button>
      
      <Button
        onClick={() => updateServiceStatus("rejected")}
        disabled={loading}
        size="sm"
        variant="destructive"
        className="flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        Reject
      </Button>
    </div>
  )
} 