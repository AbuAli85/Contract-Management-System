import React from 'react';
import type { Metadata } from 'next';
import { Inter, Lexend } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { DOMErrorBoundary } from '@/components/dom-error-boundary';

// 🔥 TEMPORARY TEST - Global Settings Fix for Root Layout (DISABLED FOR DEBUGGING)
// import { Settings, UserPlus, Menu, Search, HelpCircle } from "lucide-react"

// Make all critical icons globally available (DISABLED FOR DEBUGGING)
// if (typeof window !== 'undefined') {
//   (window as any).Settings = Settings;
//   (window as any).UserPlus = UserPlus;
//   (window as any).Menu = Menu;
//   (window as any).Search = Search;
//   (window as any).HelpCircle = HelpCircle;
// }

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const fontLexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
});

// Build timestamp for cache busting - simplified approach
const buildTimestamp = { buildId: process.env.BUILD_ID || 'dev' };

export const metadata: Metadata = {
  title: 'Contract Management System',
  description: `Professional contract management and generation system (Build: ${
    buildTimestamp.buildId
  })`,
};

// Note: Removed aggressive auth cleanup script that was breaking Supabase authentication

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        {/* Performance and SEO optimizations */}
        <link rel='manifest' href='/manifest.json' />
        <link rel='apple-touch-icon' href='/placeholder-logo.png' />
        <meta name='theme-color' content='#3b82f6' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, maximum-scale=5'
        />

        {/* Preconnect to external domains for better performance */}
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />

        {/* Auth cleanup script removed - was breaking Supabase authentication */}
      </head>
      <body
        className={`${fontInter.variable} ${fontLexend.variable} min-h-screen bg-background font-sans antialiased`}
        suppressHydrationWarning
      >
        <DOMErrorBoundary>
          <Providers>{children}</Providers>
        </DOMErrorBoundary>
      </body>
    </html>
  );
}
