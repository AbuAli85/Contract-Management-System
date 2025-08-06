import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Booking System | Contract Management System",
  description: "Professional resource booking and scheduling system",
}

import { BookingSystem } from "@/components/advanced/booking-system"

export default function BookingSystemPage() {
  return <BookingSystem />
}
