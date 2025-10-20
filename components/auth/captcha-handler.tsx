'use client';

import React, { useEffect, useRef } from 'react';

interface CaptchaHandlerProps {
  onCaptchaReady?: (token: string) => void;
  onCaptchaError?: (error: string) => void;
  siteKey?: string;
}

declare global {
  interface Window {
    hcaptcha: any;
    turnstile: any;
  }
}

export default function CaptchaHandler({
  onCaptchaReady,
  onCaptchaError,
  siteKey,
}: CaptchaHandlerProps) {
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;

    // Try to load hCaptcha first
    const loadHCaptcha = () => {
      if (window.hcaptcha) {
        renderHCaptcha();
        return;
      }

      const script = document.createElement('script');
      script.src =
        'https://js.hcaptcha.com/1/api.js?onload=onHCaptchaLoad&render=explicit';
      script.async = true;
      script.defer = true;

      window.onHCaptchaLoad = () => {
        renderHCaptcha();
      };

      document.head.appendChild(script);
    };

    // Try to load Turnstile as fallback
    const loadTurnstile = () => {
      if (window.turnstile) {
        renderTurnstile();
        return;
      }

      const script = document.createElement('script');
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
      script.async = true;
      script.defer = true;

      window.onTurnstileLoad = () => {
        renderTurnstile();
      };

      document.head.appendChild(script);
    };

    const renderHCaptcha = () => {
      if (!captchaRef.current || !window.hcaptcha) return;

      try {
        const widgetId = window.hcaptcha.render(captchaRef.current, {
          sitekey: siteKey || '10000000-ffff-ffff-ffff-000000000001', // Default test key
          callback: (token: string) => {
            onCaptchaReady?.(token);
          },
          'error-callback': (error: string) => {
            onCaptchaError?.(error);
          },
          'expired-callback': () => {
            onCaptchaError?.('CAPTCHA expired');
          },
        });
        widgetIdRef.current = widgetId;
      } catch (error) {
        console.error('hCaptcha render error:', error);
        onCaptchaError?.('Failed to load CAPTCHA');
      }
    };

    const renderTurnstile = () => {
      if (!captchaRef.current || !window.turnstile) return;

      try {
        const widgetId = window.turnstile.render(captchaRef.current, {
          sitekey: siteKey || '1x00000000000000000000AA', // Default test key
          callback: (token: string) => {
            onCaptchaReady?.(token);
          },
          'error-callback': (error: string) => {
            onCaptchaError?.(error);
          },
          'expired-callback': () => {
            onCaptchaError?.('CAPTCHA expired');
          },
        });
        widgetIdRef.current = widgetId;
      } catch (error) {
        console.error('Turnstile render error:', error);
        onCaptchaError?.('Failed to load CAPTCHA');
      }
    };

    // Try hCaptcha first, then Turnstile as fallback
    loadHCaptcha();

    // If hCaptcha fails, try Turnstile after a delay
    setTimeout(() => {
      if (!widgetIdRef.current) {
        loadTurnstile();
      }
    }, 2000);

    return () => {
      // Cleanup
      if (widgetIdRef.current) {
        try {
          if (window.hcaptcha) {
            window.hcaptcha.remove(widgetIdRef.current);
          }
          if (window.turnstile) {
            window.turnstile.remove(widgetIdRef.current);
          }
        } catch (error) {
          console.warn('CAPTCHA cleanup error:', error);
        }
      }
    };
  }, [onCaptchaReady, onCaptchaError, siteKey]);

  const resetCaptcha = () => {
    if (widgetIdRef.current) {
      try {
        if (window.hcaptcha) {
          window.hcaptcha.reset(widgetIdRef.current);
        }
        if (window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      } catch (error) {
        console.warn('CAPTCHA reset error:', error);
      }
    }
  };

  // Expose reset function
  React.useImperativeHandle(captchaRef, () => ({
    reset: resetCaptcha,
  }));

  return (
    <div className='captcha-container'>
      <div ref={captchaRef} className='captcha-widget' />
    </div>
  );
}
