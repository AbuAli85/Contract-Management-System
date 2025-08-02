"use client"

import { useState } from 'react'
import DocumentUpload from '@/components/document-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function FilenameTestPage() {
  const [testData, setTestData] = useState({
    promoterName: 'Ahmed Ali Hassan',
    idCardNumber: '1234567890',
    passportNumber: 'P987654321'
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Filename Generation Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="promoterName">Promoter Name</Label>
              <Input
                id="promoterName"
                value={testData.promoterName}
                onChange={(e) => setTestData(prev => ({ ...prev, promoterName: e.target.value }))}
                placeholder="Enter promoter name..."
              />
            </div>
            <div>
              <Label htmlFor="idCardNumber">ID Card Number</Label>
              <Input
                id="idCardNumber"
                value={testData.idCardNumber}
                onChange={(e) => setTestData(prev => ({ ...prev, idCardNumber: e.target.value }))}
                placeholder="Enter ID card number..."
              />
            </div>
            <div>
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input
                id="passportNumber"
                value={testData.passportNumber}
                onChange={(e) => setTestData(prev => ({ ...prev, passportNumber: e.target.value }))}
                placeholder="Enter passport number..."
              />
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Expected Filenames:</h3>
            <p><strong>ID Card:</strong> {testData.promoterName.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')}_{testData.idCardNumber.replace(/[^a-zA-Z0-9]/g, '_')}.jpg</p>
            <p><strong>Passport:</strong> {testData.promoterName.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')}_{testData.passportNumber.replace(/[^a-zA-Z0-9]/g, '_')}.jpg</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentUpload
          promoterId="test-promoter-id"
          promoterName={testData.promoterName}
          idCardNumber={testData.idCardNumber}
          passportNumber={testData.passportNumber}
          documentType="id_card"
          currentUrl={null}
          onUploadComplete={(url) => {
            console.log('✅ ID Card upload complete:', url)
            alert(`ID Card uploaded: ${url}`)
          }}
          onDelete={() => {
            console.log('🗑️ ID Card deleted')
          }}
        />
        
        <DocumentUpload
          promoterId="test-promoter-id"
          promoterName={testData.promoterName}
          idCardNumber={testData.idCardNumber}
          passportNumber={testData.passportNumber}
          documentType="passport"
          currentUrl={null}
          onUploadComplete={(url) => {
            console.log('✅ Passport upload complete:', url)
            alert(`Passport uploaded: ${url}`)
          }}
          onDelete={() => {
            console.log('🗑️ Passport deleted')
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Fill in the test data above (promoter name, ID number, passport number)</li>
            <li>Open browser DevTools (F12) and go to Console tab</li>
            <li>Try uploading a file using one of the DocumentUpload components</li>
            <li>Check the console logs for filename generation debug info</li>
            <li>Compare the generated filename with the expected format</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Expected behavior:</strong> Console should show the promoter name, ID numbers, and generated filename.
              If you see "Unknown_Promoter" or "NO_ID", it means the form data isn't being passed correctly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
