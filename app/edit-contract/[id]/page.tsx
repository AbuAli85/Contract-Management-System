"use client"

import { useState, useEffect, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeftIcon, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Contract {
  id: string
  contract_number?: string | null
  job_title?: string | null
  work_location?: string | null
  department?: string | null
  contract_type?: string | null
  currency?: string | null
  basic_salary?: number | null
  allowances?: number | null
  special_terms?: string | null
  contract_start_date?: string | null
  contract_end_date?: string | null
  status?: string | null
  first_party_id?: string | null
  second_party_id?: string | null
  promoter_id?: string | null
  first_party?: { name_en: string } | null
  second_party?: { name_en: string } | null
  promoter?: { name_en: string } | null
}

export default function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [parties, setParties] = useState<any[]>([])
  const [promoters, setPromoters] = useState<any[]>([])
  const { toast } = useToast()

  // Unwrap params using React.use() for Next.js 15 compatibility
  const { id } = use(params)

  useEffect(() => {
    const init = async () => {
      await fetchContract(id)
      await fetchParties()
      await fetchPromoters()
    }
    init()
  }, [id])

  const fetchContract = async (contractId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("contracts")
        .select(
          `
          *,
          first_party:parties!contracts_first_party_id_fkey(name_en),
          second_party:parties!contracts_second_party_id_fkey(name_en),
          promoter:promoters(name_en)
        `,
        )
        .eq("id", contractId)
        .single()

      if (error) throw error
      setContract(data as Contract)
    } catch (error) {
      console.error("Error fetching contract:", error)
      toast({
        title: "Error",
        description: "Failed to load contract details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchParties = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("parties").select("id, name_en").order("name_en")

      if (error) throw error
      setParties(data || [])
    } catch (error) {
      console.error("Error fetching parties:", error)
    }
  }

  const fetchPromoters = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("promoters")
        .select("id, name_en")
        .order("name_en")

      if (error) throw error
      setPromoters(data || [])
    } catch (error) {
      console.error("Error fetching promoters:", error)
    }
  }

  const handleSave = async () => {
    if (!contract) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("contracts")
        .update({
          job_title: contract.job_title,
          work_location: contract.work_location,
          department: contract.department,
          contract_type: contract.contract_type,
          currency: contract.currency,
          basic_salary: contract.basic_salary,
          allowances: contract.allowances,
          special_terms: contract.special_terms,
          contract_start_date: contract.contract_start_date,
          contract_end_date: contract.contract_end_date,
          first_party_id: contract.first_party_id,
          second_party_id: contract.second_party_id,
          promoter_id: contract.promoter_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contract.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Contract updated successfully",
      })
    } catch (error) {
      console.error("Error updating contract:", error)
      toast({
        title: "Error",
        description: "Failed to update contract",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Contract not found</p>
            <Button asChild className="mt-4">
              <Link href="/contracts">Back to Contracts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Contract</h1>
          <p className="text-muted-foreground">Contract: {contract.contract_number || id}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/contracts/${id}`}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Details
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
          <CardDescription>Update contract information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={contract.job_title || ""}
                onChange={(e) => setContract({ ...contract, job_title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_location">Work Location</Label>
              <Input
                id="work_location"
                value={contract.work_location || ""}
                onChange={(e) => setContract({ ...contract, work_location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={contract.department || ""}
                onChange={(e) => setContract({ ...contract, department: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_type">Contract Type</Label>
              <Select
                value={contract.contract_type || ""}
                onValueChange={(value) => setContract({ ...contract, contract_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time-permanent">Full Time Permanent</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={contract.currency || "OMR"}
                onValueChange={(value) => setContract({ ...contract, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OMR">OMR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="basic_salary">Basic Salary</Label>
              <Input
                id="basic_salary"
                type="number"
                value={contract.basic_salary || ""}
                onChange={(e) =>
                  setContract({ ...contract, basic_salary: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowances">Allowances</Label>
              <Input
                id="allowances"
                type="number"
                value={contract.allowances || ""}
                onChange={(e) =>
                  setContract({ ...contract, allowances: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_start_date">Start Date</Label>
              <Input
                id="contract_start_date"
                type="date"
                value={contract.contract_start_date || ""}
                onChange={(e) => setContract({ ...contract, contract_start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_end_date">End Date</Label>
              <Input
                id="contract_end_date"
                type="date"
                value={contract.contract_end_date || ""}
                onChange={(e) => setContract({ ...contract, contract_end_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="first_party">First Party</Label>
              <Select
                value={contract.first_party_id || ""}
                onValueChange={(value) => setContract({ ...contract, first_party_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select first party" />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="second_party">Second Party</Label>
              <Select
                value={contract.second_party_id || ""}
                onValueChange={(value) => setContract({ ...contract, second_party_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select second party" />
                </SelectTrigger>
                <SelectContent>
                  {parties.map((party) => (
                    <SelectItem key={party.id} value={party.id}>
                      {party.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promoter">Promoter</Label>
              <Select
                value={contract.promoter_id || ""}
                onValueChange={(value) => setContract({ ...contract, promoter_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select promoter" />
                </SelectTrigger>
                <SelectContent>
                  {promoters.map((promoter) => (
                    <SelectItem key={promoter.id} value={promoter.id}>
                      {promoter.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_terms">Special Terms</Label>
            <Textarea
              id="special_terms"
              value={contract.special_terms || ""}
              onChange={(e) => setContract({ ...contract, special_terms: e.target.value })}
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button asChild variant="outline">
              <Link href={`/contracts/${id}`}>Cancel</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
