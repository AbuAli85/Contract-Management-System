import React from "react"
import type { Metadata } from "next"
import { Inter, Lexend } from "next/font/google"
import "./globals.css"
import { SimpleProviders } from "./providers-simple"
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
  title: "Test - Contract Management System",
  description: "Test page for debugging",
}

export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${fontInter.variable} ${fontLexend.variable}`} suppressHydrationWarning>
        <SimpleProviders>
          {children}
          <Toaster />
        </SimpleProviders>
      </body>
    </html>
  )
} 