"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'
import { usePermissions } from '@/hooks/use-permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const { user, session, loading, signIn, signOut } = useAuth()
  const permissions = usePermissions()
  const [testResult, setTestResult] = useState<string>('')
  const [domCheck, setDomCheck] = useState<string>('')

  const testAuth = async () => {
    try {
      const response = await fetch('/api/test-auth')
      const data = await response.json()
      setTestResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setTestResult(`Error: ${error}`)
    }
  }

  const handleTestLogin = async () => {
    try {
      await signIn('test@example.com', 'password123')
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const checkForLogoutLinks = () => {
    if (typeof window !== 'undefined') {
      const logoutLinks = document.querySelectorAll('a[href*="logout"]')
      const logoutButtons = document.querySelectorAll('button[onclick*="logout"]')
      const logoutElements = document.querySelectorAll('[href*="logout"]')
      
      const results = {
        logoutLinks: Array.from(logoutLinks).map(el => ({
          href: el.getAttribute('href'),
          text: el.textContent,
          tagName: el.tagName
        })),
        logoutButtons: Array.from(logoutButtons).map(el => ({
          onclick: el.getAttribute('onclick'),
          text: el.textContent,
          tagName: el.tagName
        })),
        allLogoutElements: Array.from(logoutElements).map(el => ({
          href: el.getAttribute('href'),
          text: el.textContent,
          tagName: el.tagName
        }))
      }
      
      setDomCheck(JSON.stringify(results, null, 2))
    }
  }

  useEffect(() => {
    // Check for logout links after component mounts
    setTimeout(checkForLogoutLinks, 1000)
  }, [])

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Authentication Test Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Auth State</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>User:</strong> {user ? user.email : 'None'}
          </div>
          <div>
            <strong>Session:</strong> {session ? 'Active' : 'None'}
          </div>
          <div>
            <strong>User ID:</strong> {user?.id || 'None'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Role:</strong> {permissions.role}
          </div>
          <div>
            <strong>Roles:</strong> {permissions.roles.join(', ')}
          </div>
          <div>
            <strong>Can create contract:</strong> {permissions.canCreateContract() ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Can manage users:</strong> {permissions.canManageUsers() ? 'Yes' : 'No'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testAuth}>
              Test API Auth
            </Button>
            <Button onClick={handleTestLogin} variant="outline">
              Test Login
            </Button>
            <Button onClick={signOut} variant="destructive">
              Sign Out
            </Button>
            <Button onClick={checkForLogoutLinks} variant="secondary">
              Check DOM for Logout Links
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>API Test Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {testResult}
            </pre>
          </CardContent>
        </Card>
      )}

      {domCheck && (
        <Card>
          <CardHeader>
            <CardTitle>DOM Logout Links Check</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {domCheck}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 