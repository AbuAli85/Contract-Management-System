'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building2,
  Hash,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeamMember {
  id: string;
  employee_id: string;
  employee_code?: string;
  job_title?: string;
  department?: string;
  employment_type?: string;
  employment_status: string;
  employee: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
  } | null;
}

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onSuccess: () => void;
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  member,
  onSuccess,
}: EditEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    job_title: '',
    department: '',
    employment_type: 'full_time',
    employee_code: '',
  });
  const { toast } = useToast();

  // Reset form when member changes
  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.employee?.full_name || '',
        email: member.employee?.email || '',
        phone: member.employee?.phone || '',
        job_title: member.job_title || '',
        department: member.department || '',
        employment_type: member.employment_type || 'full_time',
        employee_code: member.employee_code || '',
      });
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/employer/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update employee');
      }

      toast({
        title: 'Employee Updated!',
        description: 'Employee details have been saved successfully.',
      });
      
      onSuccess();
      onOpenChange(false);
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

  const hasNoEmail = !member?.employee?.email && !formData.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Edit Employee
          </DialogTitle>
          <DialogDescription>
            Update employee information and work details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasNoEmail && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                This employee has no email. Add one so they can log in to the system.
              </AlertDescription>
            </Alert>
          )}

          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Personal Information
            </h4>
            
            <div className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  Email Address
                  {hasNoEmail && <span className="text-xs text-amber-600">(Required for login)</span>}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@company.com"
                  className={hasNoEmail ? 'border-amber-300 focus:border-amber-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+968 XXXX XXXX"
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Work Information
            </h4>
            
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job_title" className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                  Job Title
                </Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  placeholder="Sales Representative"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                  Department
                </Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Sales"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_code" className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-gray-400" />
                  Employee Code
                </Label>
                <Input
                  id="employee_code"
                  value={formData.employee_code}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  placeholder="EMP-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

