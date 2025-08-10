"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowRight } from "lucide-react"

export default function SignupRedirectPage() {
  const router = useRouter()

  const goToNewRegistration = () => {
    window.location.href = "/en/register-new"
  }

  const goToWorking = () => {
    window.location.href = "/en/working-login"
  }

  const goToTest = () => {
    window.location.href = "/en/test-registration"
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-gray-900">
            Old Registration System
          </CardTitle>
          <p className="text-sm text-gray-600">
            This signup page has been replaced with a better system
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Internal Server Error Fix</h3>
            <p className="text-sm text-yellow-800">
              The old signup system was causing internal server errors. 
              We've created a new, working registration system with proper role assignment.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={goToNewRegistration}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              🚀 Use New Registration System
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              onClick={goToTest}
              variant="outline"
              className="w-full"
            >
              🧪 Test System First
            </Button>
            
            <Button 
              onClick={goToWorking}
              variant="outline"
              className="w-full"
            >
              🔐 Already Have Account? Login
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center border-t pt-3">
            <p><strong>New System Features:</strong></p>
            <ul className="list-disc list-inside text-left mt-1 space-y-1">
              <li>Provider & Client role selection</li>
              <li>No internal server errors</li>
              <li>Proper database integration</li>
              <li>Auto-confirmed accounts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}