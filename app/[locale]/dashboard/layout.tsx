import { type Metadata } from "next"
import DashboardLayout from "@/components/dashboard/dashboard-layout"

export const metadata: Metadata = {
  title: "Dashboard - Contract Management System",
  description: "Streamline your contract generation and management process",
}

export default async function DashboardLayoutWrapper({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}
