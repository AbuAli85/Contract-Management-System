'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  UserPlus,
  Mail,
  User,
  Phone,
  Briefcase,
  Building2,
  Loader2,
  CheckCircle2,
  Copy,
  Key,
  AlertCircle,
  MessageCircle,
  Share2,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InviteEmployeeDialogProps {
  onSuccess?: () => void;
}

interface Credentials {
  email: string;
  temporary_password: string;
  login_url: string;
  note: string;
}

export function InviteEmployeeDialog({ onSuccess }: InviteEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    job_title: '',
    department: '',
    employment_type: 'full_time',
  });

  const resetForm = () => {
    setShowOptions(false);
    setFormData({
      email: '',
      full_name: '',
      phone: '',
      job_title: '',
      department: '',
      employment_type: 'full_time',
    });
    setCredentials(null);
    setCopied(false);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after animation
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async () => {
    if (!formData.email.trim() || !formData.full_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Email and full name are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/employer/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite employee');
      }

      if (data.credentials) {
        // New user created - show credentials
        setCredentials(data.credentials);
        toast({
          title: 'Employee Account Created!',
          description:
            'Share the login credentials with your employee securely.',
        });
      } else {
        // Existing user added
        toast({
          title: 'Employee Added!',
          description: 'Existing user has been added to your team.',
        });
        handleClose();
      }

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to invite employee',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCredentialsText = () => {
    if (!credentials) return '';
    return `🔐 Your Login Credentials

📧 Email: ${credentials.email}
🔑 Password: ${credentials.temporary_password}
🔗 Login: ${credentials.login_url}

⚠️ Please change your password after first login!`;
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(getCredentialsText());
    setCopied(true);
    toast({ title: 'Copied!', description: 'Credentials copied to clipboard' });
    setTimeout(() => setCopied(false), 3000);
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(getCredentialsText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    if (!credentials) return;
    const subject = encodeURIComponent(
      'Your Login Credentials - SmartPro Portal'
    );
    const body = encodeURIComponent(getCredentialsText());
    window.open(
      `mailto:${credentials.email}?subject=${subject}&body=${body}`,
      '_blank'
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant='outline'
          className='border-dashed border-2 hover:border-solid hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
        >
          <UserPlus className='h-4 w-4 mr-2 text-emerald-600' />
          Invite New Employee
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <div className='p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg'>
              <UserPlus className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
            </div>
            {credentials ? 'Employee Credentials' : 'Invite New Employee'}
          </DialogTitle>
          <DialogDescription>
            {credentials
              ? 'Share these credentials with your employee securely'
              : 'Create an account for a new employee. They can change their password after first login.'}
          </DialogDescription>
        </DialogHeader>

        {credentials ? (
          // Show credentials after successful creation
          <div className='space-y-4 py-4'>
            <Alert className='border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20'>
              <CheckCircle2 className='h-4 w-4 text-emerald-600' />
              <AlertTitle className='text-emerald-800 dark:text-emerald-200'>
                Account Created Successfully!
              </AlertTitle>
              <AlertDescription className='text-emerald-700 dark:text-emerald-300'>
                The employee can now login with these credentials.
              </AlertDescription>
            </Alert>

            <div className='space-y-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-sm'>
                  <Mail className='h-4 w-4 text-gray-500' />
                  <span className='text-gray-500'>Email:</span>
                </div>
                <span className='font-mono font-medium'>
                  {credentials.email}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2 text-sm'>
                  <Key className='h-4 w-4 text-gray-500' />
                  <span className='text-gray-500'>Password:</span>
                </div>
                <span className='font-mono font-medium text-emerald-600'>
                  {credentials.temporary_password}
                </span>
              </div>
            </div>

            <Alert className='border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'>
              <AlertCircle className='h-4 w-4 text-amber-600' />
              <AlertDescription className='text-amber-700 dark:text-amber-300 text-sm'>
                {credentials.note}
              </AlertDescription>
            </Alert>

            {/* Share Options */}
            <div className='space-y-2'>
              <p className='text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                <Share2 className='h-4 w-4' />
                Share credentials with employee:
              </p>
              <div className='grid grid-cols-3 gap-2'>
                <Button
                  onClick={shareViaWhatsApp}
                  variant='outline'
                  className='flex-col h-auto py-3 hover:bg-green-50 hover:border-green-500 hover:text-green-600 dark:hover:bg-green-900/20'
                >
                  <MessageCircle className='h-5 w-5 mb-1' />
                  <span className='text-xs'>WhatsApp</span>
                </Button>
                <Button
                  onClick={shareViaEmail}
                  variant='outline'
                  className='flex-col h-auto py-3 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600 dark:hover:bg-blue-900/20'
                >
                  <Send className='h-5 w-5 mb-1' />
                  <span className='text-xs'>Email</span>
                </Button>
                <Button
                  onClick={copyCredentials}
                  variant='outline'
                  className={`flex-col h-auto py-3 ${copied ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'hover:bg-gray-50'}`}
                >
                  {copied ? (
                    <CheckCircle2 className='h-5 w-5 mb-1' />
                  ) : (
                    <Copy className='h-5 w-5 mb-1' />
                  )}
                  <span className='text-xs'>{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Show form for creating employee
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='email' className='flex items-center gap-1'>
                  <Mail className='h-3 w-3' />
                  Email *
                </Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='employee@example.com'
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='full_name' className='flex items-center gap-1'>
                  <User className='h-3 w-3' />
                  Full Name *
                </Label>
                <Input
                  id='full_name'
                  placeholder='John Doe'
                  value={formData.full_name}
                  onChange={e =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Toggle for optional fields */}
            <button
              type='button'
              onClick={() => setShowOptions(!showOptions)}
              className='text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1'
            >
              {showOptions ? '− Hide' : '+ Add'} optional details (phone, job
              title, etc.)
            </button>

            {showOptions && (
              <div className='space-y-4 pt-2 border-t'>
                <div className='space-y-2'>
                  <Label htmlFor='phone' className='flex items-center gap-1'>
                    <Phone className='h-3 w-3' />
                    Phone
                  </Label>
                  <Input
                    id='phone'
                    type='tel'
                    placeholder='+968 9123 4567'
                    value={formData.phone}
                    onChange={e =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='job_title'
                      className='flex items-center gap-1'
                    >
                      <Briefcase className='h-3 w-3' />
                      Job Title
                    </Label>
                    <Input
                      id='job_title'
                      placeholder='Sales Representative'
                      value={formData.job_title}
                      onChange={e =>
                        setFormData({ ...formData, job_title: e.target.value })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='department'
                      className='flex items-center gap-1'
                    >
                      <Building2 className='h-3 w-3' />
                      Department
                    </Label>
                    <Input
                      id='department'
                      placeholder='Sales'
                      value={formData.department}
                      onChange={e =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Employment Type</Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={value =>
                      setFormData({ ...formData, employment_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='full_time'>Full Time</SelectItem>
                      <SelectItem value='part_time'>Part Time</SelectItem>
                      <SelectItem value='contract'>Contract</SelectItem>
                      <SelectItem value='temporary'>Temporary</SelectItem>
                      <SelectItem value='intern'>Intern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {credentials ? (
            <Button variant='outline' onClick={handleClose}>
              Done
            </Button>
          ) : (
            <>
              <Button variant='outline' onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className='bg-gradient-to-r from-emerald-600 to-teal-600'
              >
                {loading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className='h-4 w-4 mr-2' />
                    Create & Invite
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
