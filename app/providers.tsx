"use client"

import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"
import { AuthProvider, useAuth } from "@/src/components/auth/auth-provider"
import { RBACProvider } from "@/src/components/auth/rbac-provider"

const isDev = process.env.NODE_ENV === "development"
const refetchOnFocus = process.env.NODE_ENV === "production"

// Wrapper component to connect AuthProvider and RBACProvider
function AuthRBACWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  
  return (
    <RBACProvider user={user}>
      {children}
    </RBACProvider>
  )
}

function ProvidersContent({ children }: { children: React.ReactNode }) {
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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthRBACWrapper>
          {children}
        </AuthRBACWrapper>
      </AuthProvider>
      {/* {isDev && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <ProvidersContent>{children}</ProvidersContent>
}
