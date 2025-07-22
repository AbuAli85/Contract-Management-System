'use client'

import { useState } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'
import { useRBAC } from '@/src/components/auth/rbac-provider'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Switch } from '@/src/components/ui/switch'

export function UserProfile() {
  const { user, updatePassword, enrollMFA, verifyMFA, unenrollMFA } = useAuth()
  const { hasRole } = useRBAC()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaSecret, setMfaSecret] = useState<string | null>(null)

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

  const handleMFAToggle = async () => {
    if (!mfaEnabled) {
      try {
        const { secret, qr_code } = await enrollMFA()
        setMfaSecret(secret)
        // Show QR code to user
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to enable MFA')
      }
    } else {
      // Handle MFA disable
      try {
        await unenrollMFA(user?.id as string)
        setMfaEnabled(false)
        setMfaSecret(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to disable MFA')
      }
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

              {/* MFA Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={mfaEnabled}
                    onCheckedChange={handleMFAToggle}
                  />
                </div>
                {mfaSecret && (
                  <div className="space-y-4">
                    <p>Scan this QR code with your authenticator app:</p>
                    {/* Add QR code component here */}
                    <div>
                      <Label htmlFor="mfaCode">Verification Code</Label>
                      <Input
                        id="mfaCode"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        placeholder="Enter code from authenticator app"
                      />
                      <Button
                        onClick={() => {
                          // TODO: Implement proper MFA verification
                          console.log('MFA verification not implemented yet')
                        }}
                        className="mt-2"
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                )}
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

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        {success && <p className="mt-4 text-sm text-green-500">{success}</p>}
      </CardContent>
    </Card>
  )
}
