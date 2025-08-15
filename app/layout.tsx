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

// Global authentication cleanup script
const AuthCleanupScript = () => {
  if (typeof window === 'undefined') return null;
  
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            // Force clear all authentication data on every page load
            try {
              console.log('🧹 Starting global auth cleanup...');
              
              // Clear localStorage
              localStorage.removeItem('demo-user-session');
              localStorage.removeItem('user-role');
              localStorage.removeItem('auth-mode');
              localStorage.removeItem('supabase.auth.token');
              localStorage.removeItem('supabase.auth.expires_at');
              localStorage.removeItem('supabase.auth.refresh_token');
              localStorage.removeItem('auth-token');
              localStorage.removeItem('user-session');
              localStorage.removeItem('admin-session');
              
              // Clear sessionStorage
              sessionStorage.clear();
              
              // Clear cookies
              document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
              });
              
              console.log('🧹 Global auth cleanup completed');
            } catch (error) {
              console.warn('Global auth cleanup failed:', error);
            }
          })();
        `,
      }}
    />
  );
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <AuthCleanupScript />
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
