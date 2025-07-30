"use client"

import { useAuth } from "@/lib/auth-service"
import { AuthDebug } from "@/components/auth-debug"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestAuthSimplePage() {
  const auth = useAuth()

  return (
    <div className="container mx-auto space-y-6 p-6">
      <h1 className="text-2xl font-bold">Auth Test Page</h1>

      <AuthDebug />

      <Card>
        <CardHeader>
          <CardTitle>Auth State</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded bg-gray-100 p-2 text-xs">{JSON.stringify(auth, null, 2)}</pre>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
        <Button onClick={() => console.log("Auth state:", auth)}>Log to Console</Button>
      </div>
    </div>
  )
}
