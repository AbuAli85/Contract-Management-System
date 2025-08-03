import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Users, BarChart3, PlusCircle } from "lucide-react"

interface QuickActionProps {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

function QuickAction({ href, icon, title, description, className }: QuickActionProps) {
  return (
    <Link href={href}>
      <Card className={"transition-all hover:-translate-y-1 hover:shadow-lg " + (className || "")}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="w-fit rounded-lg bg-primary/10 p-3">{icon}</div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function QuickActions() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <QuickAction
        href="/generate-contract"
        icon={<PlusCircle className="h-6 w-6 text-blue-600" />}
        title="Generate Contract"
        description="Create a new contract with automated document generation"
        className="border-blue-100 hover:border-blue-200"
      />
      <QuickAction
        href="/contracts"
        icon={<FileText className="h-6 w-6 text-green-600" />}
        title="View Contracts"
        description="Browse and manage all contracts"
        className="border-green-100 hover:border-green-200"
      />
      <QuickAction
        href="/manage-parties"
        icon={<Users className="h-6 w-6 text-purple-600" />}
        title="Manage Parties"
        description="Add and manage contract parties"
        className="border-purple-100 hover:border-purple-200"
      />
      <QuickAction
        href="/analytics"
        icon={<BarChart3 className="h-6 w-6 text-orange-600" />}
        title="Analytics"
        description="View contract analytics and insights"
        className="border-orange-100 hover:border-orange-200"
      />
    </div>
  )
}
