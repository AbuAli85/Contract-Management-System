"use client"

import { Link } from "@/navigation"
import { Button } from "@/components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
      <h2 className="mb-4 text-3xl font-semibold">Page Not Found</h2>
      <p className="mb-8 text-lg text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  )
}
