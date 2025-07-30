import React from "react"
import type { Metadata } from "next"
import { Inter, Lexend } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

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
  description: `Professional contract management and generation system (Build: ${buildTimestamp.buildId})`,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get messages for the default locale
  const messages = await getMessages()
  
  // Get initial session for SSR
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body className={`${fontInter.variable} ${fontLexend.variable}`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers initialSession={session}>
            {children}
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
