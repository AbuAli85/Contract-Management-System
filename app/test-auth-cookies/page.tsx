'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthCookiesPage() {
  const [cookieInfo, setCookieInfo] = useState<any>(null)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check cookies
        const cookies = document.cookie
        const authCookies = cookies
          .split('; ')
          .filter(cookie => cookie.includes('auth'))
          .map(cookie => {
            const [name, value] = cookie.split('=')
            return { name, value: value ? value.substring(0, 50) + '...' : 'empty' }
          })

        setCookieInfo({
          allCookies: cookies,
          authCookies
        })

        // Check session
        const supabase = createClient()
        if (supabase) {
          const { data, error } = await supabase.auth.getSession()
          setSessionInfo({
            session: data.session ? {
              user: data.session.user ? {
                id: data.session.user.id,
                email: data.session.user.email
              } : null,
              access_token: data.session.access_token ? 'present' : 'missing',
              refresh_token: data.session.refresh_token ? 'present' : 'missing'
            } : null,
            error: error?.message
          })
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setSessionInfo({ error: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Auth Cookies Test</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Cookies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h3 className="font-semibold">All Cookies:</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {cookieInfo?.allCookies || 'No cookies found'}
            </pre>
            
            <h3 className="font-semibold mt-4">Auth Cookies:</h3>
            {cookieInfo?.authCookies?.length > 0 ? (
              <ul className="space-y-1">
                {cookieInfo.authCookies.map((cookie: any, index: number) => (
                  <li key={index} className="text-sm">
                    <strong>{cookie.name}:</strong> {cookie.value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">No auth cookies found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessionInfo?.error ? (
              <div className="text-red-600">
                <strong>Error:</strong> {sessionInfo.error}
              </div>
            ) : sessionInfo?.session ? (
              <div>
                <h3 className="font-semibold">Session Found:</h3>
                <pre className="bg-gray-100 p-2 rounded text-sm">
                  {JSON.stringify(sessionInfo.session, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-gray-600">
                <strong>No session found</strong>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 