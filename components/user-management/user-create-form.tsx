'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  UserPlus,
  Mail,
  Phone,
  Building,
  Briefcase,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserCreateFormProps {
  onSuccess?: () => void;
}

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'provider', label: 'Provider' },
  { value: 'client', label: 'Client' },
  { value: 'viewer', label: 'Viewer' },
];

export function UserCreateForm({ onSuccess }: UserCreateFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'user',
    department: '',
    position: '',
    phone: '',
  });
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          department: formData.department || undefined,
          position: formData.position || undefined,
          phone: formData.phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast({
        title: 'User created successfully',
        description:
          'The user has been created and will receive an email with login instructions.',
      });

      // Reset form
      setFormData({
        email: '',
        full_name: '',
        role: 'user',
        department: '',
        position: '',
        phone: '',
      });
      setOpen(false);

      // Refresh the page or call success callback
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      toast({
        title: 'Error creating user',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className='mr-2 h-4 w-4' />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a new user account. The user will receive an email with login
            instructions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='email'>
              <Mail className='mr-2 h-4 w-4 inline' />
              Email Address *
            </Label>
            <Input
              id='email'
              type='email'
              placeholder='user@example.com'
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='full_name'>
              <UserPlus className='mr-2 h-4 w-4 inline' />
              Full Name *
            </Label>
            <Input
              id='full_name'
              type='text'
              placeholder='John Doe'
              value={formData.full_name}
              onChange={e => handleChange('full_name', e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='role'>Role *</Label>
              <Select
                value={formData.role}
                onValueChange={value => handleChange('role', value)}
                disabled={loading}
              >
                <SelectTrigger id='role'>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='phone'>
                <Phone className='mr-2 h-4 w-4 inline' />
                Phone
              </Label>
              <Input
                id='phone'
                type='tel'
                placeholder='+1 (555) 000-0000'
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='department'>
                <Building className='mr-2 h-4 w-4 inline' />
                Department
              </Label>
              <Input
                id='department'
                type='text'
                placeholder='Engineering'
                value={formData.department}
                onChange={e => handleChange('department', e.target.value)}
                disabled={loading}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='position'>
                <Briefcase className='mr-2 h-4 w-4 inline' />
                Position
              </Label>
              <Input
                id='position'
                type='text'
                placeholder='Software Engineer'
                value={formData.position}
                onChange={e => handleChange('position', e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className='mr-2 h-4 w-4' />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
