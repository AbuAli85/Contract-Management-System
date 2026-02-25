'use client';

import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useCompanyUpsert, useCompanyForm } from '@/hooks/use-company';
import { CompanyResponse } from '@/lib/company-service';
import { toast } from 'sonner';

interface CompanyUpsertFormProps {
  existingCompany?: CompanyResponse;
  onSuccess?: (company: CompanyResponse) => void;
  onCancel?: () => void;
  className?: string;
}

export function CompanyUpsertForm({
  existingCompany,
  onSuccess,
  onCancel,
  className,
}: CompanyUpsertFormProps) {
  const { upsertCompany, isLoading } = useCompanyUpsert();
  const {
    formData,
    errors,
    updateField,
    generateSlugFromName,
    validateForm,
    resetForm,
    loadCompany,
    isValid,
  } = useCompanyForm();

  // Load existing company data if provided
  useEffect(() => {
    if (existingCompany) {
      loadCompany(existingCompany);
    }
  }, [existingCompany, loadCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    try {
      const result = await upsertCompany({
        ...formData,
        createdBy: '', // Will be set by the API from auth
        upsert_strategy: formData.email ? 'email' : 'slug',
      } as any);

      onSuccess?.(result);

      if (!existingCompany) {
        resetForm();
      }
    } catch (error) {
    }
  };

  const handleNameChange = (value: string) => {
    updateField('name', value);

    // Auto-generate slug from name if this is a new company and slug is empty
    if (!existingCompany && !formData.slug) {
      generateSlugFromName(value);
    }
  };

  const businessTypeOptions = [
    { value: 'individual', label: 'Individual' },
    { value: 'small_business', label: 'Small Business' },
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'non_profit', label: 'Non-Profit' },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Building2 className='h-5 w-5' />
          {existingCompany ? 'Edit Company' : 'Create Company'}
        </CardTitle>
        <CardDescription>
          {existingCompany
            ? 'Update your company information and settings'
            : 'Add a new company to the system with automatic conflict resolution'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium'>Basic Information</h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Company Name *</Label>
                <Input
                  id='name'
                  placeholder='Enter company name'
                  value={formData.name || ''}
                  onChange={e => handleNameChange(e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className='text-sm text-red-500'>{errors.name}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='slug'>URL Slug *</Label>
                <Input
                  id='slug'
                  placeholder='company-url-slug'
                  value={formData.slug || ''}
                  onChange={e =>
                    updateField('slug', e.target.value.toLowerCase())
                  }
                  className={errors.slug ? 'border-red-500' : ''}
                />
                {errors.slug && (
                  <p className='text-sm text-red-500'>{errors.slug}</p>
                )}
                <p className='text-xs text-gray-500'>
                  This will be used in URLs: /companies/
                  {formData.slug || 'your-slug'}
                </p>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                placeholder='Brief description of the company'
                value={formData.description || ''}
                onChange={e => updateField('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='business_type'>Business Type</Label>
              <Select
                value={formData.business_type || 'small_business'}
                onValueChange={value => updateField('business_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select business type' />
                </SelectTrigger>
                <SelectContent>
                  {businessTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium flex items-center gap-2'>
              <Phone className='h-4 w-4' />
              Contact Information
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='email' className='flex items-center gap-2'>
                  <Mail className='h-3 w-3' />
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='company@example.com'
                  value={formData.email || ''}
                  onChange={e => updateField('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className='text-sm text-red-500'>{errors.email}</p>
                )}
                <p className='text-xs text-gray-500'>
                  Used for upsert conflict resolution
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phone'>Phone</Label>
                <Input
                  id='phone'
                  placeholder='+1 (555) 123-4567'
                  value={formData.phone || ''}
                  onChange={e => updateField('phone', e.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='website' className='flex items-center gap-2'>
                <Globe className='h-3 w-3' />
                Website
              </Label>
              <Input
                id='website'
                placeholder='https://company.com'
                value={formData.website || ''}
                onChange={e => updateField('website', e.target.value)}
                className={errors.website ? 'border-red-500' : ''}
              />
              {errors.website && (
                <p className='text-sm text-red-500'>{errors.website}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-medium flex items-center gap-2'>
              <MapPin className='h-4 w-4' />
              Address Information
            </h3>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='street'>Street Address</Label>
                <Input
                  id='street'
                  placeholder='123 Business St'
                  value={formData.address?.street || ''}
                  onChange={e =>
                    updateField('address', {
                      ...formData.address,
                      street: e.target.value,
                    })
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='city'>City</Label>
                <Input
                  id='city'
                  placeholder='Business City'
                  value={formData.address?.city || ''}
                  onChange={e =>
                    updateField('address', {
                      ...formData.address,
                      city: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='state'>State/Province</Label>
                <Input
                  id='state'
                  placeholder='State'
                  value={formData.address?.state || ''}
                  onChange={e =>
                    updateField('address', {
                      ...formData.address,
                      state: e.target.value,
                    })
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='postal_code'>Postal Code</Label>
                <Input
                  id='postal_code'
                  placeholder='12345'
                  value={formData.address?.postal_code || ''}
                  onChange={e =>
                    updateField('address', {
                      ...formData.address,
                      postal_code: e.target.value,
                    })
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='country'>Country</Label>
                <Input
                  id='country'
                  placeholder='Country'
                  value={formData.address?.country || ''}
                  onChange={e =>
                    updateField('address', {
                      ...formData.address,
                      country: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Upsert Strategy Info */}
          <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
            <h4 className='font-medium text-blue-900 mb-2'>
              Conflict Resolution Strategy
            </h4>
            <div className='flex items-center gap-2 mb-2'>
              <Badge variant={formData.email ? 'default' : 'secondary'}>
                {formData.email ? 'Email-based upsert' : 'Slug-based upsert'}
              </Badge>
            </div>
            <p className='text-sm text-blue-700'>
              {formData.email
                ? 'If a company with this email exists, it will be updated. Otherwise, a new company will be created.'
                : 'If a company with this slug exists, it will be updated. Otherwise, a new company will be created.'}
            </p>
          </div>

          {/* Form Actions */}
          <div className='flex items-center justify-between pt-6'>
            <div className='flex gap-2'>
              {onCancel && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}

              <Button
                type='button'
                variant='outline'
                onClick={resetForm}
                disabled={isLoading}
              >
                <RotateCcw className='h-4 w-4 mr-2' />
                Reset
              </Button>
            </div>

            <Button
              type='submit'
              disabled={!isValid || isLoading}
              className='min-w-[120px]'
            >
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Save className='h-4 w-4 mr-2' />
                  {existingCompany ? 'Update' : 'Create'} Company
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
