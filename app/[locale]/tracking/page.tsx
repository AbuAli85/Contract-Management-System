import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tracking Dashboard | Contract Management System",
  description: "Real-time project and delivery tracking system",
}

import { TrackingDashboard } from "@/components/advanced/tracking-dashboard"

export default function TrackingPage() {
  return <TrackingDashboard />
}
