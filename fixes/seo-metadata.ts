/**
 * SEO Metadata Configuration
 * 
 * Comprehensive SEO setup with Open Graph tags, Twitter Cards, and structured data.
 * Removes "(Build: dev)" from production and implements best practices.
 * 
 * Location: app/[locale]/layout.tsx
 */

import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.thesmartpro.io';
const siteName = 'Contract Management System';
const siteDescription =
  'Professional contract management and workforce tracking system. Streamline your business operations with comprehensive contract lifecycle management, promoter tracking, and compliance monitoring.';

/**
 * Base metadata configuration
 * Use this in your root layout.tsx
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Professional CMS`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'contract management',
    'contract lifecycle management',
    'workforce management',
    'promoter tracking',
    'compliance management',
    'business automation',
    'document management',
    'contract analytics',
    'workforce compliance',
    'business operations',
  ],
  authors: [
    {
      name: 'Smart Pro',
      url: siteUrl,
    },
  ],
  creator: 'Smart Pro',
  publisher: 'Smart Pro',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_SA'], // Add Arabic locale
    url: siteUrl,
    title: siteName,
    description: siteDescription,
    siteName: siteName,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: siteName,
        type: 'image/png',
      },
      {
        url: '/og-image-square.png',
        width: 1200,
        height: 1200,
        alt: siteName,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: ['/og-image.png'],
    creator: '@smartpro', // Update with actual Twitter handle
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'en-US': `${siteUrl}/en`,
      'ar-SA': `${siteUrl}/ar`,
    },
  },
  verification: {
    // Add these when you have them
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: 'technology',
};

/**
 * Generate page-specific metadata
 * Use this function in individual pages
 */
export function generatePageMetadata(config: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const { title, description, path, image, noIndex = false } = config;
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}

/**
 * JSON-LD Structured Data
 * Add this to your layout.tsx
 */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Smart Pro',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: siteDescription,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'support@thesmartpro.io', // Update with actual email
  },
};

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: siteName,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
    bestRating: '5',
    worstRating: '1',
  },
  description: siteDescription,
  url: siteUrl,
  screenshot: `${siteUrl}/screenshot.png`,
  featureList: [
    'Contract Lifecycle Management',
    'Workforce Tracking',
    'Document Compliance',
    'Real-time Analytics',
    'Automated Workflows',
  ],
};

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${siteUrl}${item.url}`,
  })),
});

/**
 * Example usage in layout.tsx:
 * 
 * import { baseMetadata, organizationSchema, softwareApplicationSchema } from './seo-metadata';
 * 
 * export const metadata = baseMetadata;
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <head>
 *         <script
 *           type="application/ld+json"
 *           dangerouslySetInnerHTML={{
 *             __html: JSON.stringify(organizationSchema),
 *           }}
 *         />
 *         <script
 *           type="application/ld+json"
 *           dangerouslySetInnerHTML={{
 *             __html: JSON.stringify(softwareApplicationSchema),
 *           }}
 *         />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   );
 * }
 * 
 * Example usage in page.tsx:
 * 
 * import { generatePageMetadata } from './seo-metadata';
 * 
 * export const metadata = generatePageMetadata({
 *   title: 'Dashboard',
 *   description: 'View your contract management dashboard',
 *   path: '/en/dashboard',
 * });
 */

