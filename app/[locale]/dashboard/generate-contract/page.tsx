'use client';

// 🔥 TEMPORARY TEST - Global Settings Fix
import { Settings } from 'lucide-react';

// Make Settings globally available (temporary fix)
if (typeof window !== 'undefined') {
  (window as any).Settings = Settings;
}

// Add it to React's global scope as well
import React from 'react';
(React as any).Settings = Settings;

import { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  // Navigation & Menus,
  // ← The current missing one,
  // Users,
  // ← Previously missing,
  Users,
  // Core UI Icons,
  Sparkles,
  FileText,
  Info,
  CheckCircle,
  AlertTriangle,
  // Additional common icons that might be missing,
  // Settings,
  // ← MOVED TO TOP FOR GLOBAL ACCESS,
  // ← ALTERNATIVE SETTINGS ICON,
  // ← ALTERNATIVE SETTINGS ICON,
  Globe,
  Shield,
  Zap,
  Star,
  Award,
  TrendingUp,
} from 'lucide-react';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {

  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <div className='space-y-2'>
              <p>Failed to load the contract form. This might be due to:</p>
              <ul className='list-disc list-inside text-sm space-y-1'>
                <li>A JavaScript initialization error</li>
                <li>Missing dependencies</li>
                <li>Build configuration issues</li>
              </ul>
              <Button
                onClick={() => window.location.reload()}
                variant='outline'
                size='sm'
                className='mt-2'
              >
                Reload Page
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// More robust lazy loading with retry mechanism
const GenerateContractForm = lazy(
  (): Promise<{ default: React.ComponentType<any> }> => {
    let retryCount = 0;
    const maxRetries = 3;

    const loadWithRetry = (): Promise<{
      default: React.ComponentType<any>;
    }> => {
      return import('@/components/enhanced-contract-form')
        .then(module => ({
          default: module.default,
        }))
        .catch(error => {
          

          if (retryCount < maxRetries) {
            retryCount++;
            // Wait a bit before retrying
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                loadWithRetry().then(resolve).catch(reject);
              }, 1000 * retryCount);
            });
          }

          // If all retries failed, return a fallback component
          return {
            default: () => (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  <div className='space-y-2'>
                    <p>
                      <strong>Contract Form Load Error</strong>
                    </p>
                    <p>
                      The contract form failed to load after multiple attempts.
                    </p>
                    <p className='text-sm text-gray-600'>
                      Error: {error.message || 'Unknown error'}
                    </p>
                    <div className='flex gap-2 mt-3'>
                      <Button
                        onClick={() => window.location.reload()}
                        size='sm'
                      >
                        Reload Page
                      </Button>
                      <Button
                        onClick={() => {
                          // Clear module cache and try again
                          window.location.reload();
                        }}
                        variant='outline'
                        size='sm'
                      >
                        Clear Cache & Reload
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ),
          };
        });
    };

    return loadWithRetry();
  }
);

// Fallback component for loading states
const FormLoadingFallback = () => (
  <div className='flex flex-col items-center justify-center p-12 space-y-4'>
    <div className='h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent'></div>
    <div className='text-center'>
      <p className='text-lg font-medium text-gray-700'>
        Loading Contract Form...
      </p>
      <p className='text-sm text-gray-500 mt-1'>This may take a moment</p>
    </div>
  </div>
);

export default function DashboardGenerateContractPage() {
  const pathname = usePathname();
  const _locale = pathname ? pathname.match(/^\/([a-z]{2})\//)?.[1] ?? 'en' : 'en';
  const [_progress, _setProgress] = useState(65);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [insights, _setInsights] = useState({
    totalRequiredFields: 25,
    completedFields: 16,
    completionPercentage: 64,
    validationScore: 87,
    complianceStatus: 'Excellent' as 'Excellent' | 'Good' | 'Fair' | 'Poor',
  });

  // Memoize heavy computations
  const features = useMemo(
    () => [
      {
        icon: Sparkles,
        title: 'AI-Powered',
        description: 'Smart contract generation',
        color: 'from-blue-500 to-cyan-500',
      },
      {
        icon: Shield,
        title: '100% Compliant',
        description: 'Oman labor law validated',
        color: 'from-green-500 to-emerald-500',
      },
      {
        icon: Globe,
        title: 'Bilingual',
        description: 'Arabic & English support',
        color: 'from-purple-500 to-pink-500',
      },
      {
        icon: Zap,
        title: 'Lightning Fast',
        description: 'Generate in seconds',
        color: 'from-orange-500 to-red-500',
      },
    ],
    []
  );

  const stats = useMemo(
    () => [
      {
        icon: TrendingUp,
        label: 'Success Rate',
        value: '99.8%',
        color: 'from-green-500 to-emerald-600',
      },
      {
        icon: Users,
        label: 'Contracts Generated',
        value: '10,000+',
        color: 'from-blue-500 to-cyan-600',
      },
      {
        icon: Shield,
        label: 'Compliance Score',
        value: '100%',
        color: 'from-purple-500 to-pink-600',
      },
      {
        icon: Star,
        label: 'User Rating',
        value: '4.9/5',
        color: 'from-orange-500 to-red-600',
      },
    ],
    []
  );

  useEffect(() => {
    const featureTimer = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 3000);

    return () => clearInterval(featureTimer);
  }, []);

  // Preload with error handling
  const preloadForm = () => {
    import('@/components/enhanced-contract-form').catch(error => {

      setFormError('Form preload failed - it may not load properly');
    });
  };

  // Load CSS when form is shown (removed since not needed)
  useEffect(() => {
    if (showForm) {
      // CSS loading removed to simplify
    }
  }, [showForm]);

  if (showForm) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mx-auto max-w-6xl space-y-8'
        >
          {/* Back Button */}
          <Button
            onClick={() => {
              setShowForm(false);
              setFormError(null);
            }}
            variant='outline'
            className='mb-6 border-white/30 bg-white/80 shadow-lg backdrop-blur-sm hover:bg-white/90'
          >
            ← Back to Overview
          </Button>

          {/* Error Display */}
          {formError && (
            <Alert variant='destructive' className='mb-6'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {/* Form Section */}
          <Card className='overflow-hidden border-white/30 bg-white/80 shadow-2xl backdrop-blur-xl'>
            <CardHeader className='border-b border-white/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10'>
              <div className='flex items-center gap-4'>
                <div className='rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-4 shadow-lg'>
                  <FileText className='h-10 w-10 text-white' />
                </div>
                <div>
                  <CardTitle className='bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-4xl font-bold text-transparent'>
                    Contract Details
                  </CardTitle>
                  <CardDescription className='mt-2 text-xl text-gray-600'>
                    Create your professional contract with intelligent
                    assistance
                  </CardDescription>
                </div>
              </div>

              {/* Progress Bar for Form */}
              <div className='mt-6'>
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>
                    Form Progress
                  </span>
                  <span className='text-sm font-bold text-blue-600'>
                    {insights.completionPercentage}%
                  </span>
                </div>
                <Progress
                  value={insights.completionPercentage}
                  className='h-3 overflow-hidden rounded-full bg-gray-200'
                />
              </div>
            </CardHeader>
            <CardContent className='bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 p-8'>
              <ErrorBoundary>
                <Suspense fallback={<FormLoadingFallback />}>
                  <GenerateContractForm />
                </Suspense>
              </ErrorBoundary>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'>
      {/* Animated Background Elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className='absolute left-20 top-20 h-72 w-72 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl'
        />
        <motion.div
          animate={{
            x: [0, -120, 0],
            y: [0, 80, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 5,
          }}
          className='absolute bottom-20 right-20 h-96 w-96 rounded-full bg-gradient-to-r from-pink-400/20 to-blue-400/20 blur-3xl'
        />
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 10,
          }}
          className='absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-gradient-to-r from-green-400/15 to-cyan-400/15 blur-2xl'
        />
      </div>

      {/* Main Content */}
      <div className='relative z-10 space-y-12 p-8'>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className='space-y-8 text-center'
        >
          <div className='space-y-6'>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className='flex justify-center'
            >
              <div className='rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-2xl'>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <FileText className='h-16 w-16 text-white' />
                </motion.div>
              </div>
            </motion.div>

            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className='bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-7xl font-black leading-tight text-transparent md:text-8xl'
              >
                Generate Contract
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className='mx-auto mt-4 max-w-4xl text-2xl font-medium text-gray-700 md:text-3xl'
              >
                Create professional bilingual contracts with AI-powered
                validation and real-time compliance checking
              </motion.p>
            </div>
          </div>

          {/* Feature Badges */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className='flex flex-wrap justify-center gap-4'
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r px-6 py-4 ${feature.color} border border-white/20 text-white shadow-xl backdrop-blur-sm ${
                  activeFeature === index ? 'ring-4 ring-white/30' : ''
                }`}
              >
                <feature.icon className='h-6 w-6' />
                <div>
                  <div className='text-lg font-bold'>{feature.title}</div>
                  <div className='text-sm opacity-90'>
                    {feature.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Progress Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className='mx-auto max-w-4xl'
        >
          <Card className='overflow-hidden border-white/30 bg-white/80 shadow-2xl backdrop-blur-xl'>
            <CardHeader className='bg-gradient-to-r from-blue-500/10 to-purple-500/10 pb-8'>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-3xl font-bold text-transparent'>
                    Current Progress
                  </CardTitle>
                  <CardDescription className='mt-2 text-lg'>
                    Your contract generation workflow status
                  </CardDescription>
                </div>
                <div className='text-right'>
                  <div className='text-4xl font-black text-blue-600'>
                    {insights.completionPercentage}%
                  </div>
                  <div className='text-sm text-gray-500'>Complete</div>
                </div>
              </div>

              <div className='mt-6'>
                <Progress
                  value={insights.completionPercentage}
                  className='h-4 overflow-hidden rounded-full bg-gray-200'
                />
              </div>

              <div className='mt-4 flex items-center justify-between text-sm'>
                <span className='text-gray-600'>
                  {insights.completedFields} of {insights.totalRequiredFields}{' '}
                  fields completed
                </span>
                <Badge
                  variant='outline'
                  className='border-green-200 bg-green-50 text-green-700'
                >
                  {insights.complianceStatus} Compliance
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className='mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -10 }}
              className='group relative'
            >
              <Card className='overflow-hidden border-white/30 bg-white/80 shadow-xl backdrop-blur-xl transition-all duration-300 group-hover:shadow-2xl'>
                <CardContent className='p-6 text-center'>
                  <div className='mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-r flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110'>
                    <stat.icon className='h-8 w-8 text-white' />
                  </div>
                  <div className='mb-2 text-3xl font-black text-gray-800'>
                    {stat.value}
                  </div>
                  <div className='text-sm font-medium text-gray-600'>
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className='mx-auto max-w-6xl'
        >
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
            {/* Contract Insights */}
            <Card className='overflow-hidden border-white/30 bg-white/80 shadow-xl backdrop-blur-xl'>
              <CardHeader className='bg-gradient-to-r from-blue-500/10 to-cyan-500/10'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-2'>
                    <Info className='h-5 w-5 text-white' />
                  </div>
                  <CardTitle className='text-lg'>Smart Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>
                      Validation Score
                    </span>
                    <span className='font-bold text-green-600'>
                      {insights.validationScore}/100
                    </span>
                  </div>
                  <Progress value={insights.validationScore} className='h-2' />
                  <div className='text-xs text-gray-500'>
                    All contracts are validated against Oman labor law
                    requirements
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Types */}
            <Card className='overflow-hidden border-white/30 bg-white/80 shadow-xl backdrop-blur-xl'>
              <CardHeader className='bg-gradient-to-r from-purple-500/10 to-pink-500/10'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-2'>
                    <FileText className='h-5 w-5 text-white' />
                  </div>
                  <CardTitle className='text-lg'>Contract Types</CardTitle>
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <div className='rounded-lg bg-gray-50 p-3 text-center'>
                    <div className='font-bold text-blue-600'>8</div>
                    <div className='text-gray-600'>Available Types</div>
                  </div>
                  <div className='rounded-lg bg-gray-50 p-3 text-center'>
                    <div className='font-bold text-green-600'>100%</div>
                    <div className='text-gray-600'>Compliant</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className='overflow-hidden border-white/30 bg-white/80 shadow-xl backdrop-blur-xl'>
              <CardHeader className='bg-gradient-to-r from-green-500/10 to-emerald-500/10'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 p-2'>
                    <Zap className='h-5 w-5 text-white' />
                  </div>
                  <CardTitle className='text-lg'>Quick Start</CardTitle>
                </div>
              </CardHeader>
              <CardContent className='p-6'>
                <div className='space-y-3'>
                  <Button
                    variant='outline'
                    className='w-full justify-start border-gray-200 bg-white/60 hover:bg-white/80'
                  >
                    <Users className='mr-2 h-4 w-4' />
                    Import Parties
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full justify-start border-gray-200 bg-white/60 hover:bg-white/80'
                  >
                    <FileText className='mr-2 h-4 w-4' />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className='space-y-8 text-center'
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowForm(true)}
              onMouseEnter={preloadForm}
              className='transform rounded-2xl border-none bg-gradient-to-r from-blue-500 to-purple-600 px-12 py-6 text-xl font-bold text-white shadow-2xl transition-all duration-300 hover:from-blue-600 hover:to-purple-700'
            >
              <Sparkles className='mr-3 h-6 w-6' />
              Start Creating Your Contract
            </Button>
          </motion.div>

          <div className='flex items-center justify-center gap-8 text-sm text-gray-600'>
            <div className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              <span>Free to start</span>
            </div>
            <div className='flex items-center gap-2'>
              <Shield className='h-5 w-5 text-blue-600' />
              <span>Secure & compliant</span>
            </div>
            <div className='flex items-center gap-2'>
              <Award className='h-5 w-5 text-purple-600' />
              <span>Professional quality</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
