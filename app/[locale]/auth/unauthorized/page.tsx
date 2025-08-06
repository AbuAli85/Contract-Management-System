"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Home, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
  const searchParams = useSearchParams()
  const requiredRole = searchParams.get("required")
  const currentRole = searchParams.get("current")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Access Denied
            </CardTitle>
            <CardDescription className="text-gray-600">
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">
                <p className="font-medium mb-2">Access Requirements:</p>
                <ul className="space-y-1">
                  <li>• Required Role: <span className="font-medium capitalize">{requiredRole || "Unknown"}</span></li>
                  <li>• Your Role: <span className="font-medium capitalize">{currentRole || "Unknown"}</span></li>
                </ul>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>
                This page requires <span className="font-medium capitalize">{requiredRole}</span> privileges. 
                {currentRole && (
                  <> You currently have <span className="font-medium capitalize">{currentRole}</span> access.</>
                )}
              </p>
              <p className="mt-2">
                If you believe this is an error, please contact your administrator.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <Link href="/dashboard-role-router" className="w-full">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
            
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact support or your system administrator
          </p>
        </div>
      </div>
    </div>
  )
}
