"use client"

import React, { useEffect, useState } from "react"

interface ClientLayoutProps {
  children: React.ReactNode
  locale: string
}

export function ClientLayout({ children, locale }: ClientLayoutProps) {
  // If you need to use browser-specific APIs
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <>
      <header>
        <h1>Current Locale: {locale}</h1>
      </header>
      <main>{isClient ? children : children /* or a loading fallback */}</main>
    </>
  )
}
