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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${fontInter.variable} ${fontLexend.variable}`} suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
