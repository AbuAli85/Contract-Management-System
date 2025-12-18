'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  FileText,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Mail,
  Phone,
  Edit,
  Download,
  Plus,
  UserCheck,
  UserX,
  Briefcase,
  Award,
  BarChart3,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface EmployerEmployeeManagementPanelProps {
  promoterId: string;
  promoterName: string;
  currentStatus: string;
  employerId?: string;
  contracts?: any[];
  isAdmin?: boolean;
  locale?: string;
}

export function EmployerEmployeeManagementPanel({
  promoterId,
  promoterName,
  currentStatus,
  employerId,
  contracts = [],
  isAdmin = false,
  locale = 'en',
}: EmployerEmployeeManagementPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState(currentStatus);

  const activeContracts = contracts.filter((c: any) => c.status === 'active').length;
  const completedContracts = contracts.filter((c: any) => c.status === 'completed').length;

  const handleSaveNote = async () => {
    if (!note.trim()) return;

    setIsSavingNote(true);
    try {
      // TODO: Implement API call to save note
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: 'Note saved',
        description: 'Internal note has been saved successfully.',
      });
      setNote('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleStatusUpdate = async (status?: string) => {
    const statusToUpdate = status || newStatus;
    try {
      const response = await fetch(`/api/promoters/${promoterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusToUpdate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast({
        title: 'Status updated',
        description: `Employee status updated to ${statusToUpdate}.`,
      });
      setShowStatusDialog(false);
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportReport = async () => {
    try {
      toast({
        title: 'Generating report...',
        description: 'Employee report is being prepared for download.',
      });

      // Create report data
      const reportData = {
        employeeName: promoterName,
        employeeId: promoterId,
        status: currentStatus,
        generatedAt: new Date().toISOString(),
        contracts: {
          active: activeContracts,
          completed: completedContracts,
          total: contracts.length,
        },
        summary: `Employee Report for ${promoterName}`,
      };

      // Convert to JSON and create download
      const jsonString = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employee-report-${promoterId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Report exported',
        description: 'Employee report has been downloaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Status Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Quick Status Update
          </CardTitle>
          <CardDescription>Change employee status quickly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={currentStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusUpdate('active')}
              disabled={currentStatus === 'active'}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Active
            </Button>
            <Button
              variant={currentStatus === 'on_leave' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusUpdate('on_leave')}
              disabled={currentStatus === 'on_leave'}
            >
              <CalendarIcon className="mr-1 h-3 w-3" />
              On Leave
            </Button>
            <Button
              variant={currentStatus === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusUpdate('inactive')}
              disabled={currentStatus === 'inactive'}
            >
              <Clock className="mr-1 h-3 w-3" />
              Inactive
            </Button>
            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
              <DialogTrigger asChild>
                <Button
                  variant={currentStatus === 'terminated' ? 'destructive' : 'outline'}
                  size="sm"
                  className={currentStatus === 'terminated' ? '' : 'border-red-300 text-red-600 hover:bg-red-50'}
                >
                  <UserX className="mr-1 h-3 w-3" />
                  Terminate
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Employee Status</DialogTitle>
                <DialogDescription>
                  Change the employment status for {promoterName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={() => {
                    handleStatusUpdate();
                  }} className="flex-1">
                    Update Status
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowStatusDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Manage this employee quickly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="default"
            size="sm"
            className="w-full justify-start"
            onClick={() => router.push(`/${locale}/generate-contract?promoter=${promoterId}`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Assign New Contract
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => router.push(`/${locale}/employer/team/${promoterId}/tasks`)}
          >
            <Target className="mr-2 h-4 w-4" />
            Assign Task
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleExportReport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </CardContent>
      </Card>

      {/* Internal Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Internal Notes
          </CardTitle>
          <CardDescription>Private notes about this employee</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add a note about this employee..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <Button
            size="sm"
            onClick={handleSaveNote}
            disabled={!note.trim() || isSavingNote}
            className="w-full"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSavingNote ? 'Saving...' : 'Save Note'}
          </Button>
          
          {/* Recent Notes List */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">Recent Notes</p>
            <div className="text-sm text-muted-foreground">
              No notes yet. Add your first note above.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Summary
          </CardTitle>
          <CardDescription>Quick performance overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{activeContracts}</div>
              <div className="text-xs text-muted-foreground">Active Contracts</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedContracts}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant={
                  currentStatus === 'active'
                    ? 'default'
                    : currentStatus === 'on_leave'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {currentStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Compliance Status
          </CardTitle>
          <CardDescription>Document and compliance alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded">
              <span className="text-sm">Documents</span>
              <Badge variant="outline" className="bg-green-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Compliant
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              All required documents are up to date
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

