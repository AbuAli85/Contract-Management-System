"use client"

import { useEffect, useState } from "react"
import { contractGeneratorSchema } from "@/lib/schema-generator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function TestFormValidation() {
  const [testResults, setTestResults] = useState<string[]>([])

  const runTests = () => {
    const results: string[] = []
    
    try {
      // Test 1: Empty form data
      const emptyData = {
        first_party_id: undefined,
        second_party_id: undefined,
        promoter_id: undefined,
        contract_start_date: undefined,
        contract_end_date: undefined,
        email: "",
        job_title: "",
        work_location: "",
        department: "",
        contract_type: "",
        currency: "",
      }
      
      const emptyResult = contractGeneratorSchema.safeParse(emptyData)
      results.push(`Empty form: ${emptyResult.success ? '✅ Valid' : '❌ Invalid'}`)
      
      if (!emptyResult.success) {
        results.push(`Empty form errors: ${JSON.stringify(emptyResult.error.issues)}`)
      }
      
      // Test 2: Valid form data
      const validData = {
        first_party_id: "123e4567-e89b-12d3-a456-426614174000",
        second_party_id: "123e4567-e89b-12d3-a456-426614174001",
        promoter_id: "123e4567-e89b-12d3-a456-426614174002",
        contract_start_date: new Date(),
        contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        email: "test@example.com",
        job_title: "Software Engineer",
        work_location: "Muscat, Oman",
        department: "IT",
        contract_type: "full-time-permanent",
        currency: "OMR",
      }
      
      const validResult = contractGeneratorSchema.safeParse(validData)
      results.push(`Valid form: ${validResult.success ? '✅ Valid' : '❌ Invalid'}`)
      
      if (!validResult.success) {
        results.push(`Valid form errors: ${JSON.stringify(validResult.error.issues)}`)
      }
      
      // Test 3: Invalid email
      const invalidEmailData = {
        ...validData,
        email: "invalid-email"
      }
      
      const invalidEmailResult = contractGeneratorSchema.safeParse(invalidEmailData)
      results.push(`Invalid email: ${invalidEmailResult.success ? '✅ Valid' : '❌ Invalid (expected)'}`)
      
      // Test 4: Invalid contract type
      const invalidTypeData = {
        ...validData,
        contract_type: "invalid-type"
      }
      
      const invalidTypeResult = contractGeneratorSchema.safeParse(invalidTypeData)
      results.push(`Invalid contract type: ${invalidTypeResult.success ? '✅ Valid' : '❌ Invalid (expected)'}`)
      
    } catch (error) {
      results.push(`❌ Test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setTestResults(results)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Form Validation Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests}>Run Validation Tests</Button>
        
        <div className="space-y-2">
          <h3 className="font-semibold">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-muted-foreground">Click "Run Validation Tests" to start</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 