"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Users,
  Calendar,
} from "lucide-react"
import { useAuth } from "@/lib/auth-service"
import { PendingReviewsList } from "./PendingReviewsList"
import { CompletedReviewsList } from "./CompletedReviewsList"
import { WorkflowStats } from "./WorkflowStats"

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

interface ApprovalDashboardProps {
  userRole?: "legal_reviewer" | "hr_reviewer" | "final_approver" | "signatory"
}

export function ApprovalDashboard({ userRole }: ApprovalDashboardProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    pending: 0,
    overdue: 0,
    completed: 0,
    highPriority: 0,
  })

  useEffect(() => {
    if (user) {
      fetchPendingReviews()
    }
  }, [user])

  const fetchPendingReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/reviews/pending?status=active")
      const data = await response.json()

      if (data.success) {
        setReviews(data.reviews || [])
        calculateStats(data.reviews || [])
      } else {
        setError(data.error || "Failed to fetch pending reviews")
      }
    } catch (err) {
      setError("Failed to fetch pending reviews")
      console.error("Error fetching pending reviews:", err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (reviews: Review[]) => {
    const pending = reviews.length
    const overdue = reviews.filter((r) => r.is_overdue).length
    const highPriority = reviews.filter((r) => r.priority === "high").length
    const completed = 0 // This would come from a separate API call

    setStats({ pending, overdue, completed, highPriority })
  }

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading approval dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Approval Dashboard</h2>
          <p className="text-muted-foreground">Manage contract reviews and approvals</p>
        </div>
        <Button onClick={fetchPendingReviews} variant="outline">
          <Loader2 className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <WorkflowStats stats={stats} />

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Reviews
            {stats.pending > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed Reviews
            {stats.completed > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.completed}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {stats.overdue > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have <strong>{stats.overdue} overdue reviews</strong> that require immediate
                attention.
              </AlertDescription>
            </Alert>
          )}

          {reviews.length === 0 ? (
            <Card>
              <CardContent className="flex h-32 flex-col items-center justify-center">
                <CheckCircle className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-muted-foreground">No pending reviews</p>
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </CardContent>
            </Card>
          ) : (
            <PendingReviewsList reviews={reviews} onReviewComplete={fetchPendingReviews} />
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <CompletedReviewsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
