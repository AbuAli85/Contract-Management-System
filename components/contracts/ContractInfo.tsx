// components/contracts/ContractInfo.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ContractInfoProps {
  contract: any
  contractId: string
}

export function ContractInfo({ contract, contractId }: ContractInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Contract ID</label>
            <p className="mt-1 font-semibold">{contract?.id}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <p className="mt-1 font-semibold capitalize">{contract?.status}</p>
          </div>
        </div>
        
        <div className="mt-6 flex gap-2">
          <Button asChild>
            <Link href={`/edit-contract/${contractId}`}>Edit Contract</Link>
          </Button>
          
          <Button variant="outline">
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
