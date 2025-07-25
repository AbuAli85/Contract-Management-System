'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthenticatedLayout } from '@/components/authenticated-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToastHelpers } from '@/components/toast-notifications'
import { usePermissions } from '@/hooks/use-permissions'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Phone, 
  Building, 
  User,
  Eye,
  Calendar,
  Loader2
} from 'lucide-react'

interface PendingUser {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  department: string | null
  position: string | null
  phone: string | null
  created_at: string
  email_verified: boolean
}

export default function UserApprovalsPage() {
  const pathname = usePathname()
  const locale = pathname ? pathname.split('/')[1] || 'en' : 'en'
  const { canManageUsers } = usePermissions()
  const { success, error, warning } = useToastHelpers()

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [approvalDialog, setApprovalDialog] = useState(false)
  const [approvalData, setApprovalData] = useState({
    role: 'user',
    department: '',
    position: '',
    notes: ''
  })

  // Check permissions
  if (!canManageUsers()) {
    return (
      <AuthenticatedLayout locale={locale}>
        <div className="container mx-auto p-6">
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access user approvals. Please contact an administrator.
            </AlertDescription>
          </Alert>
        </div>
      </AuthenticatedLayout>
    )
  }

  // Fetch pending users
  const fetchPendingUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/approval')
      const data = await response.json()

      if (data.success) {
        setPendingUsers(data.pendingUsers)
      } else {
        error('Failed to fetch pending users', data.error)
      }
    } catch (err) {
      error('Error fetching pending users', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  // Handle user approval/rejection
  const handleUserAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      setApproving(userId)
      
      const response = await fetch('/api/users/approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action,
          ...approvalData
        }),
      })

      const data = await response.json()

      if (data.success) {
        success(
          `User ${action}d successfully`,
          action === 'approve' 
            ? `User has been approved and can now access the system.`
            : `User has been rejected and cannot access the system.`
        )
        setApprovalDialog(false)
        setSelectedUser(null)
        setApprovalData({ role: 'user', department: '', position: '', notes: '' })
        fetchPendingUsers() // Refresh the list
      } else {
        error(`Failed to ${action} user`, data.error)
      }
    } catch (err) {
      error(`Error ${action}ing user`, 'An unexpected error occurred')
    } finally {
      setApproving(null)
    }
  }

  const openApprovalDialog = (user: PendingUser) => {
    setSelectedUser(user)
    setApprovalData({
      role: 'user',
      department: user.department || '',
      position: user.position || '',
      notes: ''
    })
    setApprovalDialog(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'inactive':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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

  return (
    <AuthenticatedLayout locale={locale}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Approvals</h1>
            <p className="text-gray-600 mt-2">
              Review and approve new user registrations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            <Badge variant="outline" className="text-lg px-3 py-1">
              {pendingUsers.length} Pending
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Requests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingUsers.filter(user => {
                      const today = new Date().toDateString()
                      return new Date(user.created_at).toDateString() === today
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Email Verified</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingUsers.filter(user => user.email_verified).length}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">With Phone</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingUsers.filter(user => user.phone).length}
                  </p>
                </div>
                <Phone className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pending User Approvals
            </CardTitle>
            <CardDescription>
              Review and approve new user registrations. Users cannot access the system until approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading pending users...</span>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Approvals</h3>
                <p className="text-gray-600">All user registrations have been processed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {user.full_name || 'No Name Provided'}
                            </h3>
                            {getStatusBadge(user.status)}
                            {user.email_verified && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <Mail className="w-3 h-3 mr-1" />Verified
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {user.phone}
                              </div>
                            )}
                            {user.department && (
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                {user.department}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(user.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openApprovalDialog(user)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Review User Application</DialogTitle>
              <DialogDescription>
                Review the user's information and decide whether to approve or reject their application.
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={selectedUser.full_name || 'No Name Provided'} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={selectedUser.email} disabled />
                </div>

                {selectedUser.phone && (
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={selectedUser.phone} disabled />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input 
                    value={approvalData.department}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Enter department"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input 
                    value={approvalData.position}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Enter position"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select 
                    value={approvalData.role}
                    onValueChange={(value) => setApprovalData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea 
                    value={approvalData.notes}
                    onChange={(e) => setApprovalData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any notes about this approval..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setApprovalDialog(false)}
                disabled={approving !== null}
              >
                Cancel
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => selectedUser && handleUserAction(selectedUser.id, 'reject')}
                disabled={approving !== null}
              >
                {approving === selectedUser?.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Reject
              </Button>
              
              <Button
                onClick={() => selectedUser && handleUserAction(selectedUser.id, 'approve')}
                disabled={approving !== null}
              >
                {approving === selectedUser?.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  )
} 