'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { UserPlus, Loader2, Mail, Shield, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const roleDescriptions: Record<string, string> = {
  admin: 'Full access to company settings, team, and all features',
  manager: 'Can manage assigned employees and view reports',
  hr: 'Access to HR features: employees, leave, attendance',
  accountant: 'Access to financial features: expenses, reports',
  member: 'Basic team member access',
  viewer: 'Read-only access to company data',
};

interface InviteAdminDialogProps {
  onSuccess?: () => void;
}

export function InviteAdminDialog({ onSuccess }: InviteAdminDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'manager',
    department: '',
    job_title: '',
    message: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/company/invite-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log full error details for debugging

        // Build a comprehensive error message
        let errorMessage =
          data.message || data.error || 'Failed to send invitation';

        // If there are details with steps, include them
        if (data.details && data.details.steps) {
          errorMessage += `\n\n${data.details.steps.join('\n')}`;
        } else if (data.details && typeof data.details === 'string') {
          errorMessage += `\n\n${data.details}`;
        }

        // Include technical details in development
        if (process.env.NODE_ENV === 'development' && data.technicalDetails) {
        }

        throw new Error(errorMessage);
      }

      toast({
        title: data.is_new_user ? '📧 Invitation Sent' : '✅ Member Added',
        description:
          data.message ||
          (data.is_new_user
            ? 'An invitation email has been sent to the user.'
            : 'The member has been added to the company.'),
      });

      setOpen(false);
      setFormData({
        email: '',
        role: 'manager',
        department: '',
        job_title: '',
        message: '',
      });
      onSuccess?.();
    } catch (error: any) {

      toast({
        title: 'Error',
        description:
          error.message ||
          'An unexpected error occurred. Please check the console for details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' className='gap-2'>
          <UserPlus className='h-4 w-4' />
          Invite Admin
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5 text-blue-600' />
            Invite Admin or Manager
          </DialogTitle>
          <DialogDescription>
            Invite someone to help manage this company. They'll get an email
            notification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email' className='flex items-center gap-2'>
              <Mail className='h-4 w-4' />
              Email Address *
            </Label>
            <Input
              id='email'
              type='email'
              placeholder='colleague@example.com'
              value={formData.email}
              onChange={e =>
                setFormData(prev => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='role'>Role *</Label>
            <Select
              value={formData.role}
              onValueChange={v => setFormData(prev => ({ ...prev, role: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='admin'>
                  <div className='flex flex-col'>
                    <span className='font-medium'>Admin</span>
                  </div>
                </SelectItem>
                <SelectItem value='manager'>
                  <span className='font-medium'>Manager</span>
                </SelectItem>
                <SelectItem value='hr'>
                  <span className='font-medium'>HR Staff</span>
                </SelectItem>
                <SelectItem value='accountant'>
                  <span className='font-medium'>Accountant</span>
                </SelectItem>
                <SelectItem value='member'>
                  <span className='font-medium'>Team Member</span>
                </SelectItem>
                <SelectItem value='viewer'>
                  <span className='font-medium'>Viewer (Read-only)</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-gray-500'>
              {roleDescriptions[formData.role]}
            </p>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='department'>Department</Label>
              <Input
                id='department'
                placeholder='e.g., Operations'
                value={formData.department}
                onChange={e =>
                  setFormData(prev => ({ ...prev, department: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='job_title' className='flex items-center gap-1'>
                <Briefcase className='h-3 w-3' />
                Job Title
              </Label>
              <Input
                id='job_title'
                placeholder='e.g., Operations Manager'
                value={formData.job_title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, job_title: e.target.value }))
                }
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='message'>Personal Message (Optional)</Label>
            <Textarea
              id='message'
              placeholder='Add a personal note to the invitation...'
              value={formData.message}
              onChange={e =>
                setFormData(prev => ({ ...prev, message: e.target.value }))
              }
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading || !formData.email}>
              {loading && <Loader2 className='h-4 w-4 animate-spin mr-2' />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
