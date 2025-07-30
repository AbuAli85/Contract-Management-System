"use client"
import { useParams } from "next/navigation"

// ...other imports...

export default function LocaleAnalyticsPage() {
  const params = useParams()
  const locale = (params?.locale ?? "en") as string
  // ...rest of your code, use `locale` as needed...
}
