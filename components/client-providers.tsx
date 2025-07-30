"use client"

import type React from "react"
import { Toaster } from "@/components/ui/toaster"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

export { ClientProviders as QueryClientProviderWrapper }
