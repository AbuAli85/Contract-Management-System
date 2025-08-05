// app/contracts/[id]/page.tsx (main page using isolated components)
"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ContractHeader } from "@/components/contracts/ContractHeader"
import { ContractInfo } from "@/components/contracts/ContractInfo"

export default function ContractDetailPage() {
  const params = useParams()
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const contractId = params?.id as string

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false)
      setContract({ id: contractId, status: "active" })
    }, 1000)
  }, [contractId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <ContractHeader contractId={contractId} />
        <ContractInfo contract={contract} contractId={contractId} />
      </div>
    </div>
  )
}
