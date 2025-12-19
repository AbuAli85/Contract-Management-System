'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MoreHorizontal,
  Edit,
  Download,
  Send,
  UserCheck,
  UserX,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BulkOperationsToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
  totalCount?: number;
}

export function BulkOperationsToolbar({
  selectedIds,
  onClearSelection,
  onRefresh,
  totalCount = 0,
}: BulkOperationsToolbarProps) {
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [bulkEditData, setBulkEditData] = useState({
    employment_status: '',
    department: '',
    job_title: '',
  });

  const [bulkAssignData, setBulkAssignData] = useState({
    task_title: '',
    task_description: '',
    priority: 'medium',
    due_date: '',
  });

  const handleBulkEdit = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: 'No selection',
        description: 'Please select at least one team member',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/employer/team/bulk/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_ids: selectedIds,
          updates: bulkEditData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update team members');
      }

      toast({
        title: 'Success',
        description: `Updated ${selectedIds.length} team member(s)`,
      });

      setShowBulkEdit(false);
      setBulkEditData({ employment_status: '', department: '', job_title: '' });
      onClearSelection();
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update team members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: 'No selection',
        description: 'Please select at least one team member',
        variant: 'destructive',
      });
      return;
    }

    if (!bulkAssignData.task_title) {
      toast({
        title: 'Validation error',
        description: 'Task title is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/employer/team/bulk/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_ids: selectedIds,
          task: bulkAssignData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign tasks');
      }

      toast({
        title: 'Success',
        description: `Assigned task to ${selectedIds.length} team member(s)`,
      });

      setShowBulkAssign(false);
      setBulkAssignData({
        task_title: '',
        task_description: '',
        priority: 'medium',
        due_date: '',
      });
      onClearSelection();
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (selectedIds.length === 0) {
      toast({
        title: 'No selection',
        description: 'Please select at least one team member',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/employer/team/bulk/export?format=${format}&ids=${selectedIds.join(',')}`
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team-export.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: `Exported ${selectedIds.length} team member(s) as ${format.toUpperCase()}`,
      });

      setShowExport(false);
      onClearSelection();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {selectedIds.length} {selectedIds.length === 1 ? 'member' : 'members'} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7"
          >
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Bulk Operations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowBulkEdit(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBulkAssign(true)}>
                <Send className="h-4 w-4 mr-2" />
                Assign Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowExport(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bulk Edit Dialog */}
      <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit Team Members</DialogTitle>
            <DialogDescription>
              Update {selectedIds.length} selected team member(s). Leave fields empty to skip.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employment Status</Label>
              <Select
                value={bulkEditData.employment_status}
                onValueChange={(value) =>
                  setBulkEditData({ ...bulkEditData, employment_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                placeholder="Enter department (optional)"
                value={bulkEditData.department}
                onChange={(e) =>
                  setBulkEditData({ ...bulkEditData, department: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                placeholder="Enter job title (optional)"
                value={bulkEditData.job_title}
                onChange={(e) =>
                  setBulkEditData({ ...bulkEditData, job_title: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkEdit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update {selectedIds.length} Member(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={showBulkAssign} onOpenChange={setShowBulkAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task to Selected Members</DialogTitle>
            <DialogDescription>
              Assign a task to {selectedIds.length} selected team member(s).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input
                placeholder="Enter task title"
                value={bulkAssignData.task_title}
                onChange={(e) =>
                  setBulkAssignData({ ...bulkAssignData, task_title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md"
                placeholder="Enter task description"
                value={bulkAssignData.task_description}
                onChange={(e) =>
                  setBulkAssignData({ ...bulkAssignData, task_description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={bulkAssignData.priority}
                onValueChange={(value) =>
                  setBulkAssignData({ ...bulkAssignData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={bulkAssignData.due_date}
                onChange={(e) =>
                  setBulkAssignData({ ...bulkAssignData, due_date: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkAssign(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssign} disabled={loading || !bulkAssignData.task_title}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign to {selectedIds.length} Member(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Team Members</DialogTitle>
            <DialogDescription>
              Export {selectedIds.length} selected team member(s) in your preferred format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-3">
              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => handleExport('csv')}
                disabled={loading}
              >
                <FileSpreadsheet className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">CSV Format</div>
                  <div className="text-xs text-gray-500">Comma-separated values, compatible with Excel</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => handleExport('excel')}
                disabled={loading}
              >
                <FileSpreadsheet className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Excel Format</div>
                  <div className="text-xs text-gray-500">Formatted Excel file with styling</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto py-4"
                onClick={() => handleExport('pdf')}
                disabled={loading}
              >
                <FileText className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">PDF Format</div>
                  <div className="text-xs text-gray-500">Professional PDF report</div>
                </div>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExport(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

