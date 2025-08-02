"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X, User, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

interface PendingUser {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    company?: string;
  };
}

export default function UserApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users?status=pending');
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data.users || []);
      } else {
        throw new Error('Failed to fetch pending users');
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load pending users"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string, action: 'approve' | 'reject') => {
    try {
      console.log(`🔄 Approval: Starting ${action} for user:`, userId);
      setApproving(userId);
      const newStatus = action === 'approve' ? 'active' : 'inactive';
      
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log(`📊 Approval: API response status:`, response.status);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Approval: Success result:`, result);
        toast({
          title: "Success",
          description: `User ${action === 'approve' ? 'approved' : 'rejected'} successfully`
        });
        // Remove the user from pending list immediately
        setPendingUsers(prev => prev.filter(user => user.id !== userId));
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('userApprovalChanged', { 
          detail: { userId, action, newStatus } 
        }));
        
        // Also refetch the pending users to ensure consistency
        setTimeout(() => {
          fetchPendingUsers();
        }, 500);
      } else {
        const errorData = await response.json();
        console.error(`❌ Approval: API error:`, errorData);
        throw new Error(errorData.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`❌ Approval: ${action} error:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${action} user`
      });
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-6 w-6" />
          <h1 className="text-2xl font-bold">User Approvals</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6" />
          <h1 className="text-2xl font-bold">User Approvals</h1>
          <Badge variant="secondary" className="ml-2">
            {pendingUsers.length} pending
          </Badge>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchPendingUsers}
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-gray-600">No pending user approvals at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {user.profile?.first_name && user.profile?.last_name 
                          ? `${user.profile.first_name} ${user.profile.last_name}`
                          : user.email}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    Pending Approval
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Role:</span>
                      <Badge variant="secondary" className="ml-2">
                        {user.role}
                      </Badge>
                    </div>
                    {user.profile?.company && (
                      <div>
                        <span className="font-medium">Company:</span>
                        <span className="ml-2">{user.profile.company}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Registered: {format(new Date(user.created_at), 'PPP')}</span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handleApproveUser(user.id, 'approve')}
                      disabled={approving === user.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {approving === user.id ? 'Approving...' : 'Approve'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleApproveUser(user.id, 'reject')}
                      disabled={approving === user.id}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {approving === user.id ? 'Rejecting...' : 'Reject'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
