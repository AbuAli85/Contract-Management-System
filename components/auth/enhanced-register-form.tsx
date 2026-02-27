'use client';

/**
 * EnhancedRegisterForm — Production-ready registration form.
 *
 * Features:
 * - Real-time password strength indicator
 * - Comprehensive client-side validation
 * - Proper error handling without leaking info
 * - Accessible form with ARIA labels
 * - Email normalization
 * - Password confirmation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Eye, EyeOff, Loader2, Shield, ArrowRight,
  AlertCircle, CheckCircle, Lock, Mail, User, Phone, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// ─── Password strength ────────────────────────────────────────────────────────

interface PasswordStrength {
  score: number; // 0–5
  label: string;
  color: string;
  percentage: number;
}

function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200', percentage: 0 };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const colors = [
    'bg-red-500', 'bg-red-400', 'bg-yellow-400',
    'bg-yellow-500', 'bg-green-400', 'bg-green-500',
  ];

  return {
    score,
    label: labels[score] ?? 'Very weak',
    color: colors[score] ?? 'bg-red-500',
    percentage: (score / 5) * 100,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: string;
  phone: string;
  companyName: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  role?: string;
}

const VALID_ROLES = ['provider', 'client', 'user'];

// ─── Component ────────────────────────────────────────────────────────────────

export function EnhancedRegisterForm() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'provider',
    phone: '',
    companyName: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0, label: '', color: 'bg-gray-200', percentage: 0,
  });

  // Real-time password strength
  useEffect(() => {
    setPasswordStrength(evaluatePasswordStrength(formData.password));
  }, [formData.password]);

  // ── Validation ──────────────────────────────────────────────────────────────

  const validateField = useCallback(
    (name: keyof RegisterFormData, value: string): string => {
      switch (name) {
        case 'email':
          if (!value.trim()) return 'Email address is required';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
            return 'Please enter a valid email address';
          break;
        case 'password':
          if (!value) return 'Password is required';
          if (value.length < 8) return 'Password must be at least 8 characters';
          if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
          if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
          break;
        case 'confirmPassword':
          if (!value) return 'Please confirm your password';
          if (value !== formData.password) return 'Passwords do not match';
          break;
        case 'fullName':
          if (!value.trim()) return 'Full name is required';
          if (value.trim().length < 2) return 'Name must be at least 2 characters';
          break;
        case 'role':
          if (!value || !VALID_ROLES.includes(value)) return 'Please select a valid role';
          break;
      }
      return '';
    },
    [formData.password]
  );

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    (['email', 'password', 'confirmPassword', 'fullName', 'role'] as const).forEach(field => {
      const err = validateField(field, formData[field]);
      if (err) errors[field] = err;
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      setError('');
      if (fieldErrors[name as keyof FieldErrors]) {
        setFieldErrors(prev => ({ ...prev, [name]: '' }));
      }
    },
    [fieldErrors]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const err = validateField(name as keyof RegisterFormData, value);
      setFieldErrors(prev => ({ ...prev, [name]: err }));
    },
    [validateField]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          role: formData.role,
          phone: formData.phone.trim() || undefined,
          company: formData.companyName.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 429) {
          setError('Too many registration attempts. Please wait before trying again.');
        } else if (result.errors?.length) {
          setError(result.errors[0]);
        } else {
          setError(result.error ?? 'Registration failed. Please try again.');
        }
        return;
      }

      setSuccess(
        'Account created successfully! Please check your email to verify your address, then sign in.'
      );

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push(`/${locale}/auth/login`);
      }, 3000);
    } catch (err) {
      console.error('[RegisterForm] Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const showCompanyField = formData.role === 'provider';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 mb-4">
            <User className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
          <p className="text-slate-500 text-sm mt-1">Fill in the details below to get started</p>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/60 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-slate-800">Register</CardTitle>
            <CardDescription className="text-slate-500">
              All fields marked with * are required
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-slate-700 text-sm font-medium">
                  Full name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="John Smith"
                    className={`pl-9 h-11 border-slate-200 ${fieldErrors.fullName ? 'border-red-400' : ''}`}
                    disabled={loading}
                    aria-invalid={!!fieldErrors.fullName}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{fieldErrors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700 text-sm font-medium">
                  Email address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="you@example.com"
                    className={`pl-9 h-11 border-slate-200 ${fieldErrors.email ? 'border-red-400' : ''}`}
                    disabled={loading}
                    aria-invalid={!!fieldErrors.email}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <Label className="text-slate-700 text-sm font-medium">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={value => setFormData(prev => ({ ...prev, role: value }))}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11 border-slate-200">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="provider">Service Provider</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="user">General User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Company (providers only) */}
              {showCompanyField && (
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-slate-700 text-sm font-medium">
                    Company name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Your company name"
                      className="pl-9 h-11 border-slate-200"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-slate-700 text-sm font-medium">
                  Phone number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                    className="pl-9 h-11 border-slate-200"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Create a strong password"
                    className={`pl-9 pr-10 h-11 border-slate-200 ${fieldErrors.password ? 'border-red-400' : ''}`}
                    disabled={loading}
                    aria-invalid={!!fieldErrors.password}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <Progress
                      value={passwordStrength.percentage}
                      className="h-1.5"
                    />
                    <p className={`text-xs ${
                      passwordStrength.score >= 4 ? 'text-green-600' :
                      passwordStrength.score >= 3 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      Password strength: {passwordStrength.label}
                    </p>
                  </div>
                )}

                {fieldErrors.password && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-slate-700 text-sm font-medium">
                  Confirm password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder="Repeat your password"
                    className={`pl-9 pr-10 h-11 border-slate-200 ${fieldErrors.confirmPassword ? 'border-red-400' : ''}`}
                    disabled={loading}
                    aria-invalid={!!fieldErrors.confirmPassword}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{fieldErrors.confirmPassword}
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* Success */}
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md shadow-blue-500/20"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>
                ) : (
                  <>Create account<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 mt-4 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600 hover:text-blue-700 text-sm font-medium"
                  onClick={() => router.push(`/${locale}/auth/login`)}
                >
                  Sign in
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
          <Shield className="h-3.5 w-3.5" />
          <span>Secured with 256-bit SSL encryption</span>
        </div>
      </div>
    </div>
  );
}
