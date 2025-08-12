'use client';

import { useState } from 'react';
import { useRouter } from '@/navigation';
import { useAuth } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Signup Debug - Starting signup process...');
      console.log('📝 Signup Debug - Email:', email);
      console.log('📝 Signup Debug - Full Name:', fullName);

      // Use the API endpoint for signup instead of auth service
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          isSignup: true, // Flag to indicate this is a signup request
        }),
      });

      const result = await response.json();

      console.log('📝 Signup Debug - API response:', result);

      if (!response.ok) {
        console.error('📝 Signup Debug - Signup error:', result.error);
        setError(result.error || 'Signup failed');
        setLoading(false);
        return;
      }

      console.log('📝 Signup Debug - Signup successful');
      setSuccess(
        result.message ||
          'Account created successfully! Please wait for admin approval before accessing the system.'
      );

      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFullName('');

      // Redirect to login page after successful signup
      setTimeout(() => {
        // Use router.push for proper Next.js navigation
        router.push(
          '/auth/login?message=Account created successfully. Please wait for admin approval.'
        );
      }, 3000);
    } catch (error) {
      console.error('📝 Signup Debug - Unexpected error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      {error && (
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className='space-y-2'>
        <Label htmlFor='fullName'>Full Name</Label>
        <Input
          id='fullName'
          type='text'
          placeholder='Enter your full name'
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='email'>Email</Label>
        <Input
          id='email'
          type='email'
          placeholder='Enter your email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='password'>Password</Label>
        <div className='relative'>
          <Input
            id='password'
            type={showPassword ? 'text' : 'password'}
            placeholder='Enter your password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? (
              <EyeOff className='h-4 w-4' />
            ) : (
              <Eye className='h-4 w-4' />
            )}
          </Button>
        </div>
        <p className='text-sm text-muted-foreground'>
          Password must be at least 8 characters long
        </p>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='confirmPassword'>Confirm Password</Label>
        <div className='relative'>
          <Input
            id='confirmPassword'
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder='Confirm your password'
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={loading}
          >
            {showConfirmPassword ? (
              <EyeOff className='h-4 w-4' />
            ) : (
              <Eye className='h-4 w-4' />
            )}
          </Button>
        </div>
      </div>

      <Button type='submit' className='w-full' disabled={loading}>
        {loading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>
    </form>
  );
}
