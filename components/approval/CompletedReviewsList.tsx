"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, MessageSquare, FileText, Users, Calendar, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CompletedReview {
  id: string
  contract_number: string
  job_title: string
  contract_type: string
  approval_status: string
  action: string
  comments?: string
  reviewed_at: string
  reviewer_name: string
  first_party: { name_en: string; name_ar: string } | null
  second_party: { name_en: string; name_ar: string } | null
  promoter: { name_en: string; name_ar: string } | null
}

export function CompletedReviewsList() {
  const [reviews, setReviews] = useState<CompletedReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCompletedReviews()
  }, [])

  const fetchCompletedReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reviews/pending?status=completed')
      const data = await response.json()

      if (data.success) {
        setReviews(data.reviews || [])
      } else {
        setError(data.error || 'Failed to fetch completed reviews')
      }
    } catch (err) {
      setError('Failed to fetch completed reviews')
      console.error('Error fetching completed reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'legal_review':
        return <FileText className="h-4 w-4" />
      case 'hr_review':
        return <Users className="h-4 w-4" />
      case 'final_approval':
        return <CheckCircle className="h-4 w-4" />
      case 'signature':
        return <Calendar className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'requested_changes':
        return <MessageSquare className="h-4 w-4 text-yellow-600" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'requested_changes':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'legal_review':
        return 'bg-blue-100 text-blue-800'
      case 'hr_review':
        return 'bg-green-100 text-green-800'
      case 'final_approval':
        return 'bg-purple-100 text-purple-800'
      case 'signature':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'legal_review':
        return 'Legal Review'
      case 'hr_review':
        return 'HR Review'
      case 'final_approval':
        return 'Final Approval'
      case 'signature':
        return 'Signature'
      default:
        return status
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'requested_changes':
        return 'Changes Requested'
      default:
        return action
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading completed reviews...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-32">
          <XCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-32">
          <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
          <p className="text-muted-foreground">No completed reviews</p>
          <p className="text-sm text-muted-foreground">Reviews will appear here once completed</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(review.approval_status)}
                <div>
                  <CardTitle className="text-lg">
                    {review.contract_number}
                  </CardTitle>
                  <CardDescription>
                    {review.job_title} • {review.contract_type}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(review.approval_status)}>
                  {getStatusLabel(review.approval_status)}
                </Badge>
                <Badge className={getActionColor(review.action)}>
                  {getActionIcon(review.action)}
                  {getActionLabel(review.action)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="text-sm">{review.first_party?.name_en || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employer</p>
                <p className="text-sm">{review.second_party?.name_en || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employee</p>
                <p className="text-sm">{review.promoter?.name_en || 'N/A'}</p>
              </div>
            </div>

            {review.comments && (
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">Comments</p>
                <p className="text-sm bg-gray-50 p-3 rounded-md">{review.comments}</p>
              </div>
            )}

            <Separator className="my-3" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div>
                  Reviewed by: {review.reviewer_name}
                </div>
                <div>
                  {formatDate(review.reviewed_at)}
                </div>
              </div>
              
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 