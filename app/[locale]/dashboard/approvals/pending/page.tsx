"use client"

import { Suspense, useState, useEffect } from 'react'
import { PendingReviewsList } from '@/components/approval/PendingReviewsList'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Review {
  id: string
  contract_number: string
  job_title: string
  contract_type: string
  approval_status: string
  submitted_for_review_at: string
  current_reviewer_id: string
  created_at: string
  updated_at: string
  days_pending: number
  priority: 'high' | 'medium' | 'normal'
  is_overdue: boolean
  first_party: { name_en: string; name_ar: string } | null
  second_party: { name_en: string; name_ar: string } | null
  promoter: { name_en: string; name_ar: string } | null
}

export default function PendingReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingReviews()
  }, [])

  const fetchPendingReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reviews/pending?status=active')
      const data = await response.json()

      if (data.success) {
        setReviews(data.reviews || [])
      } else {
        setError(data.error || 'Failed to fetch pending reviews')
      }
    } catch (err) {
      setError('Failed to fetch pending reviews')
      console.error('Error fetching pending reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewComplete = () => {
    fetchPendingReviews()
  }

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

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>
            Review and approve contracts that are waiting for your attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : (
            <PendingReviewsList 
              reviews={reviews} 
              onReviewComplete={handleReviewComplete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
} 