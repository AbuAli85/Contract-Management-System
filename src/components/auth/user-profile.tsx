'use client'

import { useState } from 'react'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { useRBAC } from '@/src/components/auth/rbac-provider'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Switch } from '@/src/components/ui/switch'

export function UserProfile() {
  const { user } = useAuth()
  const { hasRole } = useRBAC()



  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your account settings and security preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            {hasRole('admin') && <TabsTrigger value="admin">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="general">
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={user?.email} disabled />
              </div>
              {/* Add more profile fields here */}
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground">
                Security settings will be available in a future update.
              </div>
            </div>
          </TabsContent>

                      {hasRole('admin') && (
            <TabsContent value="admin">
              <div className="space-y-4">
                <h4 className="font-medium">Administrative Controls</h4>
                {/* Add admin-specific controls here */}
              </div>
            </TabsContent>
          )}
        </Tabs>


      </CardContent>
    </Card>
  )
}
