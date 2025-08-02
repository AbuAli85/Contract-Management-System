import { Suspense } from "react"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  UserPlus,
  AlertTriangle,
  RefreshCw
} from "lucide-react"
import { PendingApprovalsList } from "@/components/pending-approvals-list"

// Loading fallback
function UserApprovalsLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="mr-2 animate-spin">⏳</div> Loading user approvals...
    </div>
  )
}

export default async function UserApprovalsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  return (
    <DashboardAuthGuard locale={locale}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Approvals</h1>
            <p className="text-muted-foreground">
              Review and manage pending user registrations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">12</div>
              <p className="text-xs text-muted-foreground">
                Users waiting for review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">8</div>
              <p className="text-xs text-muted-foreground">
                Users approved today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected Today</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">2</div>
              <p className="text-xs text-muted-foreground">
                Users rejected today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Pending User Approvals
                </CardTitle>
                <CardDescription>
                  Review and approve new user registrations
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Clock className="mr-1 h-3 w-3" />
                12 Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<UserApprovalsLoading />}>
              <PendingApprovalsList />
            </Suspense>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common actions for user management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm">
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve All Pending
              </Button>
              <Button variant="outline" size="sm">
                <XCircle className="mr-2 h-4 w-4" />
                Reject All Pending
              </Button>
              <Button variant="outline" size="sm">
                <AlertTriangle className="mr-2 h-4 w-4" />
                View Rejected Users
              </Button>
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                View All Users
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardAuthGuard>
  )
}
