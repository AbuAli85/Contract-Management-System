'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface ProductionCaptchaProps {
  onCaptchaReady?: (token: string) => void;
  onCaptchaError?: (error: string) => void;
  onCaptchaExpired?: () => void;
  provider?: 'hcaptcha' | 'turnstile';
  siteKey?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

declare global {
  interface Window {
    hcaptcha: any;
    turnstile: any;
  }
}

export default function ProductionCaptcha({
  onCaptchaReady,
  onCaptchaError,
  onCaptchaExpired,
  provider = 'hcaptcha',
  siteKey,
  theme = 'light',
  size = 'normal',
  className = '',
}: ProductionCaptchaProps) {
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Get site key from environment or props
  const captchaSiteKey =
    siteKey ||
    (provider === 'hcaptcha'
      ? process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY
      : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  useEffect(() => {
    if (!captchaSiteKey) {
      setError('CAPTCHA site key not configured');
      setLoading(false);
      return;
    }

    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const loadCaptcha = async () => {
      try {
        setLoading(true);
        setError(null);

        if (provider === 'hcaptcha') {
          await loadHCaptcha();
        } else {
          await loadTurnstile();
        }
      } catch (err) {
        console.error('CAPTCHA loading error:', err);
        setError('Failed to load CAPTCHA');
        onCaptchaError?.('Failed to load CAPTCHA');
      } finally {
        setLoading(false);
      }
    };

    const loadHCaptcha = async () => {
      if (window.hcaptcha) {
        renderHCaptcha();
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://js.hcaptcha.com/1/api.js?onload=onHCaptchaLoad&render=explicit`;
        script.async = true;
        script.defer = true;

        window.onHCaptchaLoad = () => {
          try {
            renderHCaptcha();
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        script.onerror = () => {
          reject(new Error('Failed to load hCaptcha script'));
        };

        document.head.appendChild(script);
      });
    };

    const loadTurnstile = async () => {
      if (window.turnstile) {
        renderTurnstile();
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit`;
        script.async = true;
        script.defer = true;

        window.onTurnstileLoad = () => {
          try {
            renderTurnstile();
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        script.onerror = () => {
          reject(new Error('Failed to load Turnstile script'));
        };

        document.head.appendChild(script);
      });
    };

    const renderHCaptcha = () => {
      if (!captchaRef.current || !window.hcaptcha || !captchaSiteKey) return;

      try {
        const widgetId = window.hcaptcha.render(captchaRef.current, {
          sitekey: captchaSiteKey,
          theme,
          size,
          callback: (token: string) => {
            setIsReady(true);
            onCaptchaReady?.(token);
          },
          'error-callback': (error: string) => {
            setError(error);
            onCaptchaError?.(error);
          },
          'expired-callback': () => {
            setIsReady(false);
            onCaptchaExpired?.();
          },
          'chalexpired-callback': () => {
            setIsReady(false);
            onCaptchaExpired?.();
          },
        });
        widgetIdRef.current = widgetId;
      } catch (err) {
        console.error('hCaptcha render error:', err);
        throw new Error('Failed to render hCaptcha');
      }
    };

    const renderTurnstile = () => {
      if (!captchaRef.current || !window.turnstile || !captchaSiteKey) return;

      try {
        const widgetId = window.turnstile.render(captchaRef.current, {
          sitekey: captchaSiteKey,
          theme,
          size,
          callback: (token: string) => {
            setIsReady(true);
            onCaptchaReady?.(token);
          },
          'error-callback': (error: string) => {
            setError(error);
            onCaptchaError?.(error);
          },
          'expired-callback': () => {
            setIsReady(false);
            onCaptchaExpired?.();
          },
        });
        widgetIdRef.current = widgetId;
      } catch (err) {
        console.error('Turnstile render error:', err);
        throw new Error('Failed to render Turnstile');
      }
    };

    loadCaptcha();

    return () => {
      // Cleanup
      if (widgetIdRef.current) {
        try {
          if (provider === 'hcaptcha' && window.hcaptcha) {
            window.hcaptcha.remove(widgetIdRef.current);
          } else if (provider === 'turnstile' && window.turnstile) {
            window.turnstile.remove(widgetIdRef.current);
          }
        } catch (err) {
          console.warn('CAPTCHA cleanup error:', err);
        }
      }
    };
  }, [
    provider,
    captchaSiteKey,
    theme,
    size,
    onCaptchaReady,
    onCaptchaError,
    onCaptchaExpired,
  ]);

  const reset = () => {
    if (widgetIdRef.current) {
      try {
        if (provider === 'hcaptcha' && window.hcaptcha) {
          window.hcaptcha.reset(widgetIdRef.current);
        } else if (provider === 'turnstile' && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        setIsReady(false);
        setError(null);
      } catch (err) {
        console.warn('CAPTCHA reset error:', err);
      }
    }
  };

  const execute = () => {
    if (widgetIdRef.current) {
      try {
        if (provider === 'hcaptcha' && window.hcaptcha) {
          window.hcaptcha.execute(widgetIdRef.current);
        } else if (provider === 'turnstile' && window.turnstile) {
          window.turnstile.execute(widgetIdRef.current);
        }
      } catch (err) {
        console.warn('CAPTCHA execute error:', err);
      }
    }
  };

  // Expose methods via ref
  React.useImperativeHandle(captchaRef, () => ({
    reset,
    execute,
    isReady: () => isReady,
  }));

  if (!captchaSiteKey) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          CAPTCHA site key not configured. Please set{' '}
          {provider === 'hcaptcha'
            ? 'NEXT_PUBLIC_HCAPTCHA_SITE_KEY'
            : 'NEXT_PUBLIC_TURNSTILE_SITE_KEY'}{' '}
          in your environment variables.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className='h-6 w-6 animate-spin mr-2' />
        <span>Loading CAPTCHA...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive' className={className}>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>CAPTCHA Error: {error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`captcha-container ${className}`}>
      <div ref={captchaRef} className='captcha-widget' />
      {isReady && (
        <div className='flex items-center mt-2 text-sm text-green-600'>
          <CheckCircle className='h-4 w-4 mr-1' />
          Verified
        </div>
      )}
    </div>
  );
}
