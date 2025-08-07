import React from "react"
import type { Metadata } from "next"
import { Inter, Lexend } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"
import { DOMErrorBoundary } from "@/components/dom-error-boundary"

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
  subsets: ["latin"],
  variable: "--font-inter",
})

const fontLexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
})

// Build timestamp for cache busting - simplified approach
const buildTimestamp = { buildId: process.env.BUILD_ID || "dev" }

export const metadata: Metadata = {
  title: "Contract Management System",
  description: "Professional contract management and generation system (Build: " + (buildTimestamp.buildId) + ")",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={fontInter.variable + " " + fontLexend.variable} suppressHydrationWarning>
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-2 text-sm">
          🔧 Authentication System: Hybrid mode with enhanced error handling
        </div>
        <DOMErrorBoundary>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </DOMErrorBoundary>
      </body>
    </html>
  )
} 