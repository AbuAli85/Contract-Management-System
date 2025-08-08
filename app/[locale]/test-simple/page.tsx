"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SimpleTestPage() {
  const [count, setCount] = useState(0)
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Simple Test Page</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Components Test</CardTitle>
            <CardDescription>
              This page tests if basic React components are working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-input">Test Input</Label>
              <Input
                id="test-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type something..."
              />
            </div>
            
            <div>
              <Button 
                onClick={() => setCount(count + 1)}
                className="mr-4"
              >
                Count: {count}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setCount(0)}
              >
                Reset
              </Button>
            </div>
            
            <div className="p-4 bg-green-100 border border-green-300 rounded">
              ✅ If you can see this page, React components are working!
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Environment Test</CardTitle>
            <CardDescription>
              Check if environment variables are loaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong>NEXT_PUBLIC_SUPABASE_URL:</strong> 
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not Set'}
              </div>
              <div>
                <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> 
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not Set'}
              </div>
              <div>
                <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
