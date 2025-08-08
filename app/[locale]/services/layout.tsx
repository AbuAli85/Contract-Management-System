import { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, List } from "lucide-react"

interface ServicesLayoutProps {
  children: ReactNode
  params: { locale: string }
}

export default function ServicesLayout({ children, params }: ServicesLayoutProps) {
  const { locale } = params

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Services Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">Services</h1>
              <nav className="flex items-center gap-4">
                <Link href={`/${locale}/services`}>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    All Services
                  </Button>
                </Link>
                <Link href={`/${locale}/services/new`}>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Service
                  </Button>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
} 