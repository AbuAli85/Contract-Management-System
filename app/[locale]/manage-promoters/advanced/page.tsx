"use client"

import { useParams } from "next/navigation"
import ProtectedRoute from "@/components/protected-route"
import AdvancedPromotersManagement from "@/components/advanced-promoters-management"

export default function AdvancedPromotersPage() {
  const params = useParams()
  const locale = (params?.locale as string) || "en"

  return (
    <ProtectedRoute>
      <AdvancedPromotersManagement />
    </ProtectedRoute>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = "force-dynamic" 