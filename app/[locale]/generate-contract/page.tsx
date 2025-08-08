"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import EnhancedContractForm from "@/components/enhanced-contract-form"

export default function GenerateContractPage() {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto py-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generate New Contract
          </h1>
          <p className="text-gray-600">
            Create comprehensive employment contracts with intelligent templates and professional automation
          </p>
        </div>
        
        <EnhancedContractForm 
          onSuccess={() => {
            console.log("Contract generated successfully")
          }}
          onError={(error) => {
            console.error("Contract generation error:", error)
          }}
        />
      </div>
    </div>
  )
}