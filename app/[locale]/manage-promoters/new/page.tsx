"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, PlusCircle } from "lucide-react"
import PromoterFormSimple from "@/components/promoter-form-simple"

export default function AddNewPromoterPage() {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || "en"
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormSubmit = () => {
    setIsSubmitting(true)
    // Redirect back to promoters list after successful submission
    setTimeout(() => {
      router.push(`/${locale}/manage-promoters`)
    }, 1000)
  }

  const handleCancel = () => {
    router.push(`/${locale}/manage-promoters`)
  }

  // Handle case where locale is undefined during build
  if (!locale) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Promoters
          </Button>
          
          <div className="flex items-center gap-3">
            <PlusCircle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Add New Promoter</h1>
              <p className="text-muted-foreground">
                Enter promoter details to add them to the system
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Promoter Information
            </CardTitle>
            <CardDescription>
              Fill in the promoter's personal and document information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PromoterFormSimple 
              onFormSubmit={handleFormSubmit}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic"
