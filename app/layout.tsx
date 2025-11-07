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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.thesmartpro.io';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Contract Management System | Professional CMS',
    template: '%s | Contract Management System',
  },
  description:
    'Professional contract management and workforce tracking system. Manage contracts, promoters, and compliance with ease.',
  keywords: [
    'contract management',
    'workforce management',
    'promoter tracking',
    'compliance management',
    'business automation',
    'CRM',
    'contract tracking',
  ],
  authors: [{ name: 'Smart Pro' }],
  creator: 'Smart Pro',
  publisher: 'Smart Pro',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://portal.thesmartpro.io',
    title: 'Contract Management System',
    description:
      'Professional contract management and workforce tracking system',
    siteName: 'Contract Management System',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Contract Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contract Management System',
    description:
      'Professional contract management and workforce tracking system',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://portal.thesmartpro.io',
  },
};

// Note: Removed aggressive auth cleanup script that was breaking Supabase authentication

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Contract Management System',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
    },
    description: 'Professional contract management and workforce tracking system',
    url: 'https://portal.thesmartpro.io',
  };

  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <head>
        {/* Performance and SEO optimizations */}
        <link rel='manifest' href='/manifest.json' />
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
        
        {/* Google Fonts for Arabic support */}
        <link
          href='https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap'
          rel='stylesheet'
        />

        {/* JSON-LD Structured Data */}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${fontInter.variable} ${fontLexend.variable} min-h-screen bg-background font-sans antialiased`}
        suppressHydrationWarning
      >
        <a
          href='#main-content'
          className='sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2'
        >
          Skip to main content
        </a>
        <DOMErrorBoundary>
          <Providers>
            <main id='main-content'>{children}</main>
          </Providers>
        </DOMErrorBoundary>
      </body>
    </html>
  );
}
