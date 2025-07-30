"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Clock,
  AlertTriangle,
  FileText,
  Users,
  CheckCircle,
  Calendar,
  Eye,
  MessageSquare,
} from "lucide-react"
import { ContractReviewForm } from "./ContractReviewForm"

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
  priority: "high" | "medium" | "normal"
  is_overdue: boolean
  first_party: { name_en: string; name_ar: string } | null
  second_party: { name_en: string; name_ar: string } | null
  promoter: { name_en: string; name_ar: string } | null
}

interface PendingReviewsListProps {
  reviews: Review[]
  onReviewComplete: () => void
}

export function PendingReviewsList({ reviews, onReviewComplete }: PendingReviewsListProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "legal_review":
        return <FileText className="h-4 w-4" />
      case "hr_review":
        return <Users className="h-4 w-4" />
      case "final_approval":
        return <CheckCircle className="h-4 w-4" />
      case "signature":
        return <Calendar className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "legal_review":
        return "bg-blue-100 text-blue-800"
      case "hr_review":
        return "bg-green-100 text-green-800"
      case "final_approval":
        return "bg-purple-100 text-purple-800"
      case "signature":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "normal":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "legal_review":
        return "Legal Review"
      case "hr_review":
        return "HR Review"
      case "final_approval":
        return "Final Approval"
      case "signature":
        return "Signature"
      default:
        return status
    }
  }

  const handleReviewClick = (review: Review) => {
    setSelectedReview(review)
    setShowReviewForm(true)
  }

  const handleReviewComplete = () => {
    setShowReviewForm(false)
    setSelectedReview(null)
    onReviewComplete()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Handle empty reviews
  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-32 flex-col items-center justify-center">
          <CheckCircle className="mb-2 h-8 w-8 text-green-500" />
          <p className="text-muted-foreground">No pending reviews</p>
          <p className="text-sm text-muted-foreground">All caught up!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(review.approval_status)}
                <div>
                  <CardTitle className="text-lg">{review.contract_number}</CardTitle>
                  <CardDescription>
                    {review.job_title} • {review.contract_type}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(review.approval_status)}>
                  {getStatusLabel(review.approval_status)}
                </Badge>
                <Badge className={getPriorityColor(review.priority)}>{review.priority}</Badge>
                {review.is_overdue && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Client</p>
                <p className="text-sm">{review.first_party?.name_en || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employer</p>
                <p className="text-sm">{review.second_party?.name_en || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employee</p>
                <p className="text-sm">{review.promoter?.name_en || "N/A"}</p>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {review.days_pending} day{review.days_pending !== 1 ? "s" : ""} pending
                </div>
                <div>Submitted: {formatDate(review.submitted_for_review_at)}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleReviewClick(review)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Review
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReviewClick(review)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Add Comment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Review Form Modal */}
      {showReviewForm && selectedReview && (
        <ContractReviewForm
          contract={selectedReview}
          onClose={() => setShowReviewForm(false)}
          onComplete={handleReviewComplete}
        />
      )}
    </div>
  )
}
