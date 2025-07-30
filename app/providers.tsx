"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs"
import { AuthProvider } from "@/components/auth-provider"
import { RBACProvider } from "@/src/components/auth/rbac-provider"
import { ThemeProvider } from "@/components/theme-provider"
import type { Session } from "@supabase/supabase-js"

const isDev = process.env.NODE_ENV === "development"
const refetchOnFocus = process.env.NODE_ENV === "production"

interface ProvidersContentProps {
  children: React.ReactNode
  initialSession?: Session | null
}

function ProvidersContent({ children, initialSession }: ProvidersContentProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: refetchOnFocus, // Only in prod
          },
        },
      }),
  )

  // Single Supabase client instance - no more duplicates
  const [supabaseClient] = useState(() => createPagesBrowserClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabaseClient} initialSession={initialSession}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <RBACProvider>{children}</RBACProvider>
          </AuthProvider>
        </ThemeProvider>
      </SessionContextProvider>
      {/* {isDev && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  )
}

interface ProvidersProps {
  children: React.ReactNode
  initialSession?: Session | null
}

export function Providers({ children, initialSession }: ProvidersProps) {
  return <ProvidersContent initialSession={initialSession}>{children}</ProvidersContent>
}
