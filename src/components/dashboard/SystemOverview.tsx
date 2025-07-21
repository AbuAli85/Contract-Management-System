import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { 
  FileText, 
  Users, 
  BarChart3,
  ChevronRight,
} from 'lucide-react'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-accent/50 transition-colors">
      <div className="p-2 bg-primary/10 rounded-lg">
        {icon}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function SystemOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Overview</CardTitle>
        <CardDescription>Get started with contract management</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <FeatureCard
          icon={<FileText className="h-5 w-5" />}
          title="Contract Generation"
          description="Automated document generation with image processing"
        />
        <FeatureCard
          icon={<Users className="h-5 w-5" />}
          title="Party Management"
          description="Manage contract parties and promoters"
        />
        <FeatureCard
          icon={<BarChart3 className="h-5 w-5" />}
          title="Analytics Dashboard"
          description="Track contract metrics and performance"
        />
        <div className="flex justify-end">
          <Button variant="default">
            Get Started
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
