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
  const { user, updatePassword } = useAuth()
  const { hasRole } = useRBAC()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await updatePassword(newPassword)
      setSuccess('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }



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
              {/* Password Update Form */}
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  Update Password
                </Button>
              </form>


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

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        {success && <p className="mt-4 text-sm text-green-500">{success}</p>}
      </CardContent>
    </Card>
  )
}
