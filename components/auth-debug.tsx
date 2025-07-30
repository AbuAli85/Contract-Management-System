"use client"

import { useAuth } from "@/src/components/auth/simple-auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AuthDebug() {
  const auth = useAuth()

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm">Auth Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span>Loading:</span>
          <Badge variant={auth.loading ? "destructive" : "default"}>
            {auth.loading ? "Yes" : "No"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span>Mounted:</span>
          <Badge variant={auth.mounted ? "default" : "destructive"}>
            {auth.mounted ? "Yes" : "No"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span>User:</span>
          <Badge variant={auth.user ? "default" : "secondary"}>
            {auth.user ? auth.user.email : "None"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span>Session:</span>
          <Badge variant={auth.session ? "default" : "secondary"}>
            {auth.session ? "Active" : "None"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span>Roles:</span>
          <Badge variant="outline">{auth.roles.length > 0 ? auth.roles.join(", ") : "None"}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span>Profile:</span>
          <Badge variant={auth.profile ? "default" : "secondary"}>
            {auth.profile ? "Loaded" : "None"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
