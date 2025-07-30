"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

interface PromoterFormProps {
  promoterToEdit?: any | null
  onFormSubmit: () => void
  onCancel?: () => void
}

export default function PromoterForm(props: PromoterFormProps) {
  const { promoterToEdit, onFormSubmit, onCancel } = props
  const isEditMode = Boolean(promoterToEdit)

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode ? "Edit Promoter" : "Add New Promoter"}
            </CardTitle>
            <CardDescription>
              {isEditMode ? "Update promoter details" : "Enter promoter details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                {isEditMode ? "Edit functionality coming soon..." : "Add functionality coming soon..."}
              </p>
              <Button onClick={onFormSubmit}>
                {isEditMode ? "Update Promoter" : "Add Promoter"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
