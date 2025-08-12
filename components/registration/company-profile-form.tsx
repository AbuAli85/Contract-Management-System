'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  Building2,
  Upload,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  AlertCircle,
  Check,
  Loader2,
} from 'lucide-react';

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import {
  companyProfileSchema,
  type CompanyProfile,
  BUSINESS_CATEGORIES,
  PROVIDER_SERVICES,
} from '@/types/company';
import { CompanyService } from '@/lib/company-service';

interface CompanyProfileFormProps {
  userId: string;
  role: 'client' | 'provider';
  initialData?: Partial<CompanyProfile>;
  onSuccess?: (data: CompanyProfile) => void;
  onError?: (error: string) => void;
}

export function CompanyProfileForm({
  userId,
  role,
  initialData,
  onSuccess,
  onError,
}: CompanyProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData?.logo_url || null
  );
  const [formProgress, setFormProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CompanyProfile>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      user_id: userId,
      role,
      user_type: 'company',
      verification_status: 'pending',
      documents_uploaded: false,
      is_active: true,
      country: 'Oman',
      notify_days_before_cr_expiry: 30,
      notify_days_before_license_expiry: 30,
      ...initialData,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = form;

  // Calculate form completion progress
  React.useEffect(() => {
    const watchedValues = watch();
    const requiredFields = [
      'company_name',
      'commercial_registration',
      'contact_person',
      'email',
      'phone',
      'address',
    ];
    const filledFields = requiredFields.filter(field => {
      const value = watchedValues[field as keyof CompanyProfile];
      return value && value !== '';
    });
    setFormProgress((filledFields.length / requiredFields.length) * 100);
  }, [watch]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSubmitMessage({
        type: 'error',
        text: 'Please select a valid image file',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSubmitMessage({
        type: 'error',
        text: 'Logo file size must be less than 2MB',
      });
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = e => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: CompanyProfile) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      let logoUrl = data.logo_url;

      // Upload logo if a new file was selected
      if (logoFile) {
        const uploadResult = await CompanyService.uploadCompanyLogo(
          logoFile,
          userId
        );
        if (uploadResult.error) {
          throw new Error(uploadResult.error);
        }
        logoUrl = uploadResult.url;
      }

      // Save company profile
      const profileData = {
        ...data,
        logo_url: logoUrl,
      };

      const response = await fetch('/api/companies', {
        method: initialData?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profileData,
          id: initialData?.id,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save company profile');
      }

      const result = await response.json();

      // If this is a provider registration, ensure the role is properly set up
      if (role === 'provider') {
        console.log('Setting up provider role...');
        try {
          const roleSetupResponse = await fetch('/api/setup-user-role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId,
              role: 'provider',
            }),
          });

          if (roleSetupResponse.ok) {
            const roleSetupResult = await roleSetupResponse.json();
            console.log('Provider role setup successful:', roleSetupResult);
          } else {
            console.warn('Provider role setup failed, but continuing...');
          }
        } catch (roleError) {
          console.warn('Provider role setup error:', roleError);
          // Don't fail the whole process if role setup fails
        }
      }

      setSubmitMessage({
        type: 'success',
        text: initialData?.id
          ? 'Company profile updated successfully!'
          : `Company profile created successfully! ${role === 'provider' ? 'You now have provider access.' : ''}`,
      });

      if (onSuccess && result) {
        onSuccess(result);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to save company profile';
      setSubmitMessage({ type: 'error', text: errorMessage });
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='max-w-4xl mx-auto p-6'
    >
      <Card>
        <CardHeader className='text-center'>
          <CardTitle className='flex items-center justify-center gap-2 text-2xl'>
            <Building2 className='h-6 w-6' />
            {role === 'client' ? 'Client Company' : 'Service Provider'}{' '}
            Registration
          </CardTitle>
          <CardDescription>
            {role === 'client'
              ? 'Register your company to request services and manage contracts'
              : 'Register your company to offer services and manage promoters'}
          </CardDescription>

          {/* Progress indicator */}
          <div className='mt-4'>
            <div className='flex justify-between text-sm text-muted-foreground mb-2'>
              <span>Profile Completion</span>
              <span>{Math.round(formProgress)}%</span>
            </div>
            <Progress value={formProgress} className='h-2' />
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
            {/* Company Logo */}
            <div className='text-center'>
              <Label className='text-sm font-medium'>Company Logo</Label>
              <div className='mt-2'>
                {logoPreview ? (
                  <div className='relative inline-block'>
                    <img
                      src={logoPreview}
                      alt='Company Logo'
                      className='w-24 h-24 rounded-lg object-cover border-2 border-dashed border-gray-300'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='absolute -top-2 -right-2'
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className='h-4 w-4' />
                    </Button>
                  </div>
                ) : (
                  <div
                    className='w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400'
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className='h-8 w-8 text-gray-400' />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleLogoUpload}
                  className='hidden'
                  aria-label='Upload company logo'
                  title='Upload company logo'
                />
                <p className='text-xs text-muted-foreground mt-2'>
                  PNG, JPG up to 2MB
                </p>
              </div>
            </div>

            {/* Company Information */}
            <div className='space-y-6'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <Building2 className='h-5 w-5' />
                Company Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label
                    htmlFor='company_name'
                    className='flex items-center gap-2'
                  >
                    <Building2 className='h-4 w-4' />
                    Company Name *
                  </Label>
                  <Input
                    id='company_name'
                    {...register('company_name')}
                    placeholder='Enter company name'
                    className={errors.company_name ? 'border-red-500' : ''}
                  />
                  {errors.company_name && (
                    <p className='text-sm text-red-500 mt-1'>
                      {errors.company_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='commercial_registration'
                    className='flex items-center gap-2'
                  >
                    <FileText className='h-4 w-4' />
                    Commercial Registration *
                  </Label>
                  <Input
                    id='commercial_registration'
                    {...register('commercial_registration')}
                    placeholder='CR number'
                    className={
                      errors.commercial_registration ? 'border-red-500' : ''
                    }
                  />
                  {errors.commercial_registration && (
                    <p className='text-sm text-red-500 mt-1'>
                      {errors.commercial_registration.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor='cr_expiry_date'
                    className='flex items-center gap-2'
                  >
                    <Calendar className='h-4 w-4' />
                    CR Expiry Date
                  </Label>
                  <Input
                    id='cr_expiry_date'
                    type='date'
                    {...register('cr_expiry_date', { valueAsDate: true })}
                    className={errors.cr_expiry_date ? 'border-red-500' : ''}
                  />
                  {errors.cr_expiry_date && (
                    <p className='text-sm text-red-500 mt-1'>
                      {errors.cr_expiry_date.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='license_number'>License Number</Label>
                  <Input
                    id='license_number'
                    {...register('license_number')}
                    placeholder='Business license number'
                  />
                </div>

                <div>
                  <Label htmlFor='tax_number'>Tax Number</Label>
                  <Input
                    id='tax_number'
                    {...register('tax_number')}
                    placeholder='Tax identification number'
                  />
                </div>

                <div>
                  <Label htmlFor='business_category'>Business Category</Label>
                  <Select
                    onValueChange={value =>
                      setValue('business_category', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className='space-y-6'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <User className='h-5 w-5' />
                Contact Information
              </h3>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label
                    htmlFor='contact_person'
                    className='flex items-center gap-2'
                  >
                    <User className='h-4 w-4' />
                    Contact Person *
                  </Label>
                  <Input
                    id='contact_person'
                    {...register('contact_person')}
                    placeholder='Primary contact name'
                    className={errors.contact_person ? 'border-red-500' : ''}
                  />
                  {errors.contact_person && (
                    <p className='text-sm text-red-500 mt-1'>
                      {errors.contact_person.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='email' className='flex items-center gap-2'>
                    <Mail className='h-4 w-4' />
                    Email Address *
                  </Label>
                  <Input
                    id='email'
                    type='email'
                    {...register('email')}
                    placeholder='company@example.com'
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className='text-sm text-red-500 mt-1'>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='phone' className='flex items-center gap-2'>
                    <Phone className='h-4 w-4' />
                    Phone Number *
                  </Label>
                  <Input
                    id='phone'
                    {...register('phone')}
                    placeholder='+968 XX XX XXXX'
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className='text-sm text-red-500 mt-1'>
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='mobile'>Mobile Number</Label>
                  <Input
                    id='mobile'
                    {...register('mobile')}
                    placeholder='+968 XX XX XXXX'
                  />
                </div>

                <div className='md:col-span-2'>
                  <Label htmlFor='address' className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4' />
                    Address *
                  </Label>
                  <Textarea
                    id='address'
                    {...register('address')}
                    placeholder='Complete company address'
                    className={errors.address ? 'border-red-500' : ''}
                    rows={3}
                  />
                  {errors.address && (
                    <p className='text-sm text-red-500 mt-1'>
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='website' className='flex items-center gap-2'>
                    <Globe className='h-4 w-4' />
                    Website
                  </Label>
                  <Input
                    id='website'
                    {...register('website')}
                    placeholder='https://www.company.com'
                  />
                </div>

                <div>
                  <Label htmlFor='employee_count'>Number of Employees</Label>
                  <Input
                    id='employee_count'
                    type='number'
                    {...register('employee_count', { valueAsNumber: true })}
                    placeholder='e.g., 50'
                    min='1'
                  />
                </div>
              </div>
            </div>

            {/* Provider-specific fields */}
            {role === 'provider' && (
              <div className='space-y-6'>
                <h3 className='text-lg font-semibold'>Services Offered</h3>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                  {PROVIDER_SERVICES.map(service => (
                    <Badge
                      key={service}
                      variant='outline'
                      className='cursor-pointer hover:bg-primary hover:text-primary-foreground'
                    >
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Message */}
            {submitMessage && (
              <Alert
                className={`${submitMessage.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}
              >
                {submitMessage.type === 'error' ? (
                  <AlertCircle className='h-4 w-4 text-red-600' />
                ) : (
                  <Check className='h-4 w-4 text-green-600' />
                )}
                <AlertDescription
                  className={
                    submitMessage.type === 'error'
                      ? 'text-red-700'
                      : 'text-green-700'
                  }
                >
                  {submitMessage.text}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type='submit'
              className='w-full'
              disabled={isSubmitting}
              size='lg'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {initialData?.id ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{initialData?.id ? 'Update Profile' : 'Create Profile'}</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
