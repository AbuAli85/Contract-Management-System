'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Building2,
  MapPin,
  Users,
  Edit,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Briefcase,
  FolderKanban,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeeScheduleSelector } from './employee-schedule-selector';

interface EmployeeGroup {
  id: string;
  name: string;
  description?: string;
  group_type: 'location' | 'department' | 'custom' | 'project';
  office_location?: {
    id: string;
    name: string;
    address: string;
  };
  employee_count: number;
  default_check_in_time?: string;
  default_check_out_time?: string;
}

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
}

export function EmployeeGroupManager() {
  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EmployeeGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_type: 'location' as 'location' | 'department' | 'custom' | 'project',
    office_location_id: '',
    department_name: '',
    project_name: '',
    default_check_in_time: '',
    default_check_out_time: '',
    employee_ids: [] as string[],
  });

  useEffect(() => {
    fetchGroups();
    fetchOfficeLocations();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employer/attendance-groups');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch groups');
      }

      setGroups(data.groups || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficeLocations = async () => {
    try {
      const response = await fetch('/api/employer/office-locations');
      const data = await response.json();

      if (response.ok && data.locations) {
        setOfficeLocations(data.locations);
      }
    } catch (error) {
      console.error('Error fetching office locations:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Group name is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.group_type === 'location' && !formData.office_location_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select an office location',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name: formData.name,
        description: formData.description,
        group_type: formData.group_type,
        office_location_id: formData.group_type === 'location' ? formData.office_location_id : null,
        department_name: formData.group_type === 'department' ? formData.department_name : null,
        project_name: formData.group_type === 'project' ? formData.project_name : null,
        default_check_in_time: formData.default_check_in_time || null,
        default_check_out_time: formData.default_check_out_time || null,
        employee_ids: formData.employee_ids,
      };

      const url = editingGroup
        ? `/api/employer/attendance-groups/${editingGroup.id}`
        : '/api/employer/attendance-groups';
      
      const method = editingGroup ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save group');
      }

      toast({
        title: 'Success',
        description: editingGroup 
          ? 'Group updated successfully' 
          : 'Group created successfully',
      });

      setShowCreateDialog(false);
      setEditingGroup(null);
      resetForm();
      fetchGroups();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (group: EmployeeGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      group_type: group.group_type,
      office_location_id: group.office_location?.id || '',
      department_name: '',
      project_name: '',
      default_check_in_time: group.default_check_in_time || '',
      default_check_out_time: group.default_check_out_time || '',
      employee_ids: [],
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group? Employees will be unassigned.')) {
      return;
    }

    try {
      const response = await fetch(`/api/employer/attendance-groups/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete group');
      }

      toast({
        title: 'Success',
        description: 'Group deleted successfully',
      });

      fetchGroups();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      group_type: 'location',
      office_location_id: '',
      department_name: '',
      project_name: '',
      default_check_in_time: '',
      default_check_out_time: '',
      employee_ids: [],
    });
  };

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'location':
        return <MapPin className="h-4 w-4" />;
      case 'department':
        return <Briefcase className="h-4 w-4" />;
      case 'project':
        return <FolderKanban className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employee Groups</h2>
          <p className="text-muted-foreground">
            Organize employees by location, department, or custom criteria for attendance schedules
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setEditingGroup(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </DialogTitle>
              <DialogDescription>
                Organize employees into groups for easier schedule management
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Grand Mall Muscat Team"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="groupType">Group Type *</Label>
                <Select
                  value={formData.group_type}
                  onValueChange={(value: 'location' | 'department' | 'custom' | 'project') => 
                    setFormData(prev => ({ ...prev, group_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="location">Location-Based</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.group_type === 'location' && (
                <div>
                  <Label htmlFor="officeLocation">Office Location *</Label>
                  <Select
                    value={formData.office_location_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, office_location_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select office location" />
                    </SelectTrigger>
                    <SelectContent>
                      {officeLocations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name} - {loc.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.group_type === 'department' && (
                <div>
                  <Label htmlFor="departmentName">Department Name</Label>
                  <Input
                    id="departmentName"
                    value={formData.department_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, department_name: e.target.value }))}
                    placeholder="e.g., Sales, Marketing, Operations"
                  />
                </div>
              )}

              {formData.group_type === 'project' && (
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={formData.project_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                    placeholder="e.g., Project Alpha, Q1 Campaign"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultCheckIn">Default Check-In Time (Optional)</Label>
                  <Input
                    id="defaultCheckIn"
                    type="time"
                    value={formData.default_check_in_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_check_in_time: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="defaultCheckOut">Default Check-Out Time (Optional)</Label>
                  <Input
                    id="defaultCheckOut"
                    type="time"
                    value={formData.default_check_out_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_check_out_time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>Assign Employees</Label>
                <EmployeeScheduleSelector
                  selectedEmployeeIds={formData.employee_ids}
                  selectedGroupIds={[]}
                  assignmentType="selected"
                  onSelectionChange={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      employee_ids: data.employeeIds,
                    }));
                  }}
                  showLocationBased={false}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {editingGroup ? 'Update Group' : 'Create Group'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingGroup(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Groups Created</p>
            <p className="text-sm text-muted-foreground">
              Create employee groups to organize attendance schedules by location or department
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {getGroupTypeIcon(group.group_type)}
                      {group.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {group.description || `${group.group_type} group`}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{group.group_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.office_location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{group.office_location.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{group.employee_count} employees</span>
                  </div>
                  {group.default_check_in_time && (
                    <div className="text-sm text-muted-foreground">
                      Default: {group.default_check_in_time}
                      {group.default_check_out_time && ` - ${group.default_check_out_time}`}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(group)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(group.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

