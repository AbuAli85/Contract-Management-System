import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - Contract Management System',
  description: 'Sign in to your account to continue',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
