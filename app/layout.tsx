import type { Metadata } from "next"
import { Inter, Lexend } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const fontLexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
})

export const metadata: Metadata = {
  title: "Contract Management System",
  description: "Professional contract management and generation system",
}

// Inline script to preload user role from cache
const rolePreloadScript = `
  (function() {
    try {
      // Check if user is logged in by looking for auth token
      const authToken = localStorage.getItem('sb-auth-token') || 
                       sessionStorage.getItem('sb-auth-token') ||
                       document.cookie.includes('sb-auth-token');
      
      if (authToken) {
        // Try to get user ID from various sources
        const userData = localStorage.getItem('sb-user-data') || 
                        sessionStorage.getItem('sb-user-data');
        
        if (userData) {
          try {
            const user = JSON.parse(userData);
            if (user && user.id) {
              // Check for cached role
              const cachedRole = localStorage.getItem('user_role_' + user.id);
              if (cachedRole && ['admin', 'manager', 'user'].includes(cachedRole)) {
                console.log('✅ Preload: Found cached role:', cachedRole);
                // Set a global flag to indicate role is available
                window.__PRECACHED_ROLE__ = cachedRole;
              } else {
                console.log('🔄 Preload: No cached role found, will load from API');
                // Set admin as default to prevent "user" flash
                window.__PRECACHED_ROLE__ = 'admin';
              }
            }
          } catch (e) {
            console.log('⚠️ Preload: Error parsing user data, defaulting to admin');
            window.__PRECACHED_ROLE__ = 'admin';
          }
        } else {
          console.log('🔄 Preload: No user data found, defaulting to admin');
          window.__PRECACHED_ROLE__ = 'admin';
        }
      } else {
        console.log('🔄 Preload: No auth token found');
      }
    } catch (e) {
      console.log('⚠️ Preload: Error in role preload script:', e);
    }
  })();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: rolePreloadScript }} />
      </head>
      <body className={`${fontInter.variable} ${fontLexend.variable}`} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
