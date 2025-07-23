import { Suspense } from 'react'
import { PendingReviewsList } from '@/components/approval/PendingReviewsList'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export default function PendingReviewsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Pending Reviews</h1>
          <p className="text-muted-foreground">
            Contracts awaiting your review and approval
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
            <CardDescription>
              Review and approve contracts that are waiting for your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PendingReviewsList 
              reviews={[]} 
              onReviewComplete={() => {}} 
            />
          </CardContent>
        </Card>
      </Suspense>
    </div>
  )
} 