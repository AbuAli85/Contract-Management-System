import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/src/components/auth/auth-provider"
import { Providers } from "./providers"
import { GlobalPerformanceOptimizer } from "@/components/global-performance-optimizer"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Optimize font loading
  preload: true,
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: "Contract Management System",
  description: "Streamline your contract generation and management process",
  keywords: ["contracts", "management", "business", "legal"],
  authors: [{ name: "Contract Management System" }],
  robots: "index, follow",
  openGraph: {
    title: "Contract Management System",
    description: "Streamline your contract generation and management process",
    type: "website",
  },
  // Remove viewport from metadata - it should be in viewport export
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ekdjxzhujettocosgzql.supabase.co" />
        
        {/* Performance hints */}
        <meta name="theme-color" content="#000000" />
        {/* Remove deprecated apple-mobile-web-app-capable */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <GlobalPerformanceOptimizer />
        <Providers>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
