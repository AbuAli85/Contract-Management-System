// Dashboard layout is now handled by the universal layout
// This file can remain simple since navigation is handled globally

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  return <>{children}</>
}