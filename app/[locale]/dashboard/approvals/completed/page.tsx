import { Suspense } from 'react'
import { CompletedReviewsList } from '@/components/approval/CompletedReviewsList'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export default function CompletedReviewsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Completed Reviews</h1>
          <p className="text-muted-foreground">
            History of all completed contract reviews
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <Card>
          <CardHeader>
            <CardTitle>Completed Reviews</CardTitle>
            <CardDescription>
              View all completed contract reviews and approvals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompletedReviewsList />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  )
} 