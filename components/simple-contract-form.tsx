"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function SimpleContractForm() {
  const [formData, setFormData] = useState({
    first_party_id: "",
    second_party_id: "",
    promoter_id: "",
    email: "",
    job_title: "",
    work_location: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Simple Contract Form (Test)</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="first_party_id">Party A (Client)</Label>
            <Input
              id="first_party_id"
              value={formData.first_party_id}
              onChange={(e) => handleChange("first_party_id", e.target.value)}
              placeholder="Select Client"
            />
          </div>

          <div>
            <Label htmlFor="second_party_id">Party B (Employer)</Label>
            <Input
              id="second_party_id"
              value={formData.second_party_id}
              onChange={(e) => handleChange("second_party_id", e.target.value)}
              placeholder="Select Employer"
            />
          </div>

          <div>
            <Label htmlFor="promoter_id">Promoter</Label>
            <Input
              id="promoter_id"
              value={formData.promoter_id}
              onChange={(e) => handleChange("promoter_id", e.target.value)}
              placeholder="Select Promoter"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Enter email"
            />
          </div>

          <div>
            <Label htmlFor="job_title">Job Title</Label>
            <Input
              id="job_title"
              value={formData.job_title}
              onChange={(e) => handleChange("job_title", e.target.value)}
              placeholder="Enter job title"
            />
          </div>

          <div>
            <Label htmlFor="work_location">Work Location</Label>
            <Input
              id="work_location"
              value={formData.work_location}
              onChange={(e) => handleChange("work_location", e.target.value)}
              placeholder="Enter work location"
            />
          </div>

          <Button type="submit" className="w-full">
            Create Contract
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 