'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  AlertCircle,
  Shield,
  Smartphone,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const { enableMFA, verifyMFA, disableMFA, mfaEnabled, mfaVerified } =
    useAuth();

  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Generate backup codes
  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  // Initialize MFA setup
  useEffect(() => {
    if (mfaEnabled && mfaVerified) {
      setStep('complete');
    } else if (mfaEnabled && !mfaVerified) {
      setStep('verify');
    }
  }, [mfaEnabled, mfaVerified]);

  const handleEnableMFA = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await enableMFA();

      if (result.success && result.secret && result.qrCode) {
        setSecret(result.secret);
        setQrCode(result.qrCode);
        setBackupCodes(generateBackupCodes());
        setStep('verify');
        toast.success('MFA setup initiated successfully');
      } else {
        setError(result.error || 'Failed to enable MFA');
        toast.error('Failed to enable MFA');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      toast.error('Failed to enable MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyMFA(verificationCode);

      if (result.success) {
        setStep('complete');
        toast.success('MFA verified successfully');
        onComplete?.();
      } else {
        setError(result.error || 'Invalid verification code');
        toast.error('Invalid verification code');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      toast.error('Failed to verify MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code to disable MFA');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await disableMFA(verificationCode);

      if (result.success) {
        setStep('setup');
        setVerificationCode('');
        setError('');
        toast.success('MFA disabled successfully');
      } else {
        setError(result.error || 'Invalid verification code');
        toast.error('Invalid verification code');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      toast.error('Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (step === 'verify') {
      setStep('setup');
      setVerificationCode('');
      setError('');
    } else {
      onCancel?.();
    }
  };

  if (step === 'complete') {
    return (
      <Card className='mx-auto w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100'>
            <CheckCircle className='h-6 w-6 text-green-600' />
          </div>
          <CardTitle>MFA Setup Complete</CardTitle>
          <CardDescription>
            Two-factor authentication is now enabled for your account
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert>
            <Shield className='h-4 w-4' />
            <AlertDescription>
              Your account is now protected with two-factor authentication.
              You'll need to enter a verification code from your authenticator
              app when signing in.
            </AlertDescription>
          </Alert>

          <div className='space-y-2'>
            <Label className='text-sm font-medium'>Backup Codes</Label>
            <div className='grid grid-cols-2 gap-2 text-sm'>
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className='rounded bg-gray-50 p-2 text-center font-mono'
                >
                  {code}
                </div>
              ))}
            </div>
            <p className='text-xs text-gray-500'>
              Save these backup codes in a secure location. You can use them to
              access your account if you lose your authenticator device.
            </p>
          </div>

          <Button onClick={onComplete} className='w-full'>
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mx-auto w-full max-w-md'>
      <CardHeader className='text-center'>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
          <Shield className='h-6 w-6 text-blue-600' />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          {step === 'setup'
            ? 'Add an extra layer of security to your account'
            : 'Verify your authenticator app to complete setup'}
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {error && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'setup' && (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>How it works</Label>
              <div className='space-y-2 text-sm text-gray-600'>
                <div className='flex items-center gap-2'>
                  <Smartphone className='h-4 w-4' />
                  <span>
                    Download an authenticator app (Google Authenticator, Authy,
                    etc.)
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Key className='h-4 w-4' />
                  <span>Scan the QR code or enter the secret key</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle className='h-4 w-4' />
                  <span>Enter the 6-digit code to verify setup</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className='space-y-2'>
              <Label className='text-sm font-medium'>Security Benefits</Label>
              <div className='space-y-1 text-sm text-gray-600'>
                <div>• Protection against password breaches</div>
                <div>• Secure access to sensitive data</div>
                <div>• Compliance with security standards</div>
              </div>
            </div>

            <Button
              onClick={handleEnableMFA}
              disabled={loading}
              className='w-full'
            >
              {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
            </Button>

            {onCancel && (
              <Button
                variant='outline'
                onClick={handleCancel}
                className='w-full'
              >
                Cancel
              </Button>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className='space-y-4'>
            {qrCode && (
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>QR Code</Label>
                <div className='flex justify-center'>
                  <div className='rounded border bg-white p-4'>
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt='QR Code for MFA setup'
                      className='h-48 w-48'
                    />
                  </div>
                </div>
                <p className='text-center text-xs text-gray-500'>
                  Scan this QR code with your authenticator app
                </p>
              </div>
            )}

            {secret && (
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Secret Key</Label>
                <div className='rounded bg-gray-50 p-2 text-center font-mono text-sm'>
                  {secret}
                </div>
                <p className='text-center text-xs text-gray-500'>
                  Or manually enter this key in your authenticator app
                </p>
              </div>
            )}

            <Separator />

            <div className='space-y-2'>
              <Label
                htmlFor='verification-code'
                className='text-sm font-medium'
              >
                Verification Code
              </Label>
              <Input
                id='verification-code'
                type='text'
                placeholder='Enter 6-digit code'
                value={verificationCode}
                onChange={e =>
                  setVerificationCode(
                    e.target.value.replace(/\D/g, '').slice(0, 6)
                  )
                }
                maxLength={6}
                className='text-center font-mono text-lg'
              />
              <p className='text-xs text-gray-500'>
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className='flex gap-2'>
              <Button
                onClick={handleVerifyMFA}
                disabled={loading || verificationCode.length !== 6}
                className='flex-1'
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </Button>

              <Button
                variant='outline'
                onClick={handleCancel}
                className='flex-1'
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// MFA verification component for login flow
export function MFAVerification({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { verifyMFA } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyMFA(verificationCode);

      if (result.success) {
        toast.success('MFA verification successful');
        onSuccess();
      } else {
        setError(result.error || 'Invalid verification code');
        toast.error('Invalid verification code');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      toast.error('Failed to verify MFA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-md'>
      <CardHeader className='text-center'>
        <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100'>
          <Shield className='h-6 w-6 text-blue-600' />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the verification code from your authenticator app
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {error && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className='space-y-2'>
          <Label htmlFor='mfa-code' className='text-sm font-medium'>
            Verification Code
          </Label>
          <Input
            id='mfa-code'
            type='text'
            placeholder='Enter 6-digit code'
            value={verificationCode}
            onChange={e =>
              setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            maxLength={6}
            className='text-center font-mono text-lg'
            autoFocus
          />
          <p className='text-xs text-gray-500'>
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <div className='flex gap-2'>
          <Button
            onClick={handleVerify}
            disabled={loading || verificationCode.length !== 6}
            className='flex-1'
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>

          <Button variant='outline' onClick={onCancel} className='flex-1'>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
