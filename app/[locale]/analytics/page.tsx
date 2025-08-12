import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics | Contract Management System",
  description: "Contract analytics and reporting dashboard",
}

import { AnalyticsView } from "@/components/analytics-view"

export default function AnalyticsPage() {
  return <AnalyticsView />
}
