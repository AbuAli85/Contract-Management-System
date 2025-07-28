"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import AdvancedPromoterForm from "@/components/advanced-promoter-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NewPromoterPage() {
  const router = useRouter()

  const handleFormSubmit = () => {
    // Redirect back to the promoters list after successful creation
    router.push("/en/manage-promoters")
  }

  const handleCancel = () => {
    router.push("/en/manage-promoters")
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/en/manage-promoters">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Promoters
          </Link>
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Add New Promoter</CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedPromoterForm
              promoterToEdit={null}
              onFormSubmit={handleFormSubmit}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 