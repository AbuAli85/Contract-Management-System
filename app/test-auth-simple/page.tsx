'use client';

import { useState } from 'react';
import { useAuth } from '@/src/components/auth/simple-auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthSimplePage() {
  const { user, profile, roles, session, loading, mounted, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('luxsess2001@gmail.com');
  const [password, setPassword] = useState('test123');
  const [signInResult, setSignInResult] = useState<string>('');

  const handleSignIn = async () => {
    const result = await signIn(email, password);
    setSignInResult(JSON.stringify(result, null, 2));
  };

  const handleSignOut = async () => {
    await signOut();
    setSignInResult('');
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auth State */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Auth State:</h3>
            <div className="bg-gray-100 p-4 rounded text-sm">
              <div><strong>Loading:</strong> {loading ? 'true' : 'false'}</div>
              <div><strong>Mounted:</strong> {mounted ? 'true' : 'false'}</div>
              <div><strong>User:</strong> {user ? user.email : 'null'}</div>
              <div><strong>Profile:</strong> {profile ? profile.full_name : 'null'}</div>
              <div><strong>Roles:</strong> {roles.join(', ') || 'none'}</div>
              <div><strong>Session:</strong> {session ? 'active' : 'null'}</div>
            </div>
          </div>

          {/* Sign In Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sign In:</h3>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex space-x-2">
                <Button onClick={handleSignIn} disabled={loading}>
                  Sign In
                </Button>
                <Button onClick={handleSignOut} variant="outline" disabled={!user}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Result */}
          {signInResult && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Sign In Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {signInResult}
              </pre>
            </div>
          )}

          {/* Debug Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Debug Info:</h3>
            <div className="bg-gray-100 p-4 rounded text-sm">
              <div><strong>User ID:</strong> {user?.id || 'null'}</div>
              <div><strong>User Email:</strong> {user?.email || 'null'}</div>
              <div><strong>User Created:</strong> {user?.created_at || 'null'}</div>
              <div><strong>Profile ID:</strong> {profile?.id || 'null'}</div>
              <div><strong>Profile Role:</strong> {profile?.role || 'null'}</div>
              <div><strong>Session Access Token:</strong> {session?.access_token ? 'present' : 'null'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 