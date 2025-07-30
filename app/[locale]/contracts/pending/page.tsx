"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Clock, Search, Filter, Eye, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Contract {
  id: string
  contract_number: string
  job_title: string
  contract_type: string
  status: string
  approval_status: string
  created_at: string
  submitted_for_review_at: string
  first_party: { name_en: string } | null
  second_party: { name_en: string } | null
  promoter: { name_en: string } | null
  promoters: { name_en: string }[] | null
}

export default function PendingContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPendingContracts()
  }, [])

  const fetchPendingContracts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/contracts?status=pending")
      const data = await response.json()

      if (data.success) {
        setContracts(data.contracts || [])
      } else {
        setError(data.error || "Failed to fetch pending contracts")
      }
    } catch (err) {
      setError("Failed to fetch pending contracts")
      console.error("Error fetching pending contracts:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.first_party?.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.second_party?.name_en?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "legal_review":
        return "bg-blue-100 text-blue-800"
      case "hr_review":
        return "bg-green-100 text-green-800"
      case "final_approval":
        return "bg-purple-100 text-purple-800"
      case "signature":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "legal_review":
        return "Legal Review"
      case "hr_review":
        return "HR Review"
      case "final_approval":
        return "Final Approval"
      case "signature":
        return "Signature"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading pending contracts...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Clock className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold">Pending Contracts</h1>
          <p className="text-muted-foreground">View all contracts awaiting approval</p>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="flex h-32 flex-col items-center justify-center">
            <div className="mb-2 text-red-600">{error}</div>
            <Button onClick={fetchPendingContracts} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Contracts</CardTitle>
              <CardDescription>
                {filteredContracts.length} of {contracts.length} contracts
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center">
              <Clock className="mb-2 h-8 w-8 text-gray-400" />
              <p className="text-muted-foreground">No pending contracts found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="font-semibold">{contract.contract_number}</h3>
                        <Badge
                          className={getStatusColor(contract.approval_status || contract.status)}
                        >
                          {getStatusLabel(contract.approval_status || contract.status)}
                        </Badge>
                      </div>
                      <p className="mb-1 text-sm text-muted-foreground">
                        {contract.job_title} • {contract.contract_type}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Client: {contract.first_party?.name_en || "N/A"}</span>
                        <span>Employer: {contract.second_party?.name_en || "N/A"}</span>
                        <span>
                          Employee:{" "}
                          {contract.promoters && contract.promoters.length > 0
                            ? contract.promoters[0].name_en
                            : "N/A"}
                        </span>
                        <span>
                          Submitted:{" "}
                          {formatDate(contract.submitted_for_review_at || contract.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/en/contracts/${contract.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
