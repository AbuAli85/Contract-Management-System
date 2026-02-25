'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  GraduationCap,
  Loader2,
  Phone,
  Save,
  Shield,
  Star,
  User,
  Users,
  Briefcase,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DatePickerWithManualInput } from '@/components/date-picker-with-manual-input';
import {
  promoterFormSchema,
  type PromoterFormData,
  FORM_SECTIONS,
  type FormSection,
} from '@/lib/schemas/promoter-form-schema';

interface PromoterFormProps {
  initialData?: Partial<PromoterFormData>;
  promoterId?: string | undefined;
  onSubmit: (data: PromoterFormData) => Promise<void>;
  onCancel?: () => void;
  mode?: 'create' | 'edit';
}

const SECTION_ICONS: Record<FormSection, React.ReactNode> = {
  basic: <User className='h-5 w-5' />,
  contact: <Phone className='h-5 w-5' />,
  personal: <Users className='h-5 w-5' />,
  documents: <Shield className='h-5 w-5' />,
  emergency: <AlertCircle className='h-5 w-5' />,
  employment: <Briefcase className='h-5 w-5' />,
  education: <GraduationCap className='h-5 w-5' />,
  banking: <CreditCard className='h-5 w-5' />,
  status: <Star className='h-5 w-5' />,
  additional: <FileText className='h-5 w-5' />,
};

export function PromoterFormComprehensive({
  initialData,
  promoterId,
  onSubmit,
  onCancel,
  mode = 'create',
}: PromoterFormProps) {
  const [currentSection, setCurrentSection] = useState<FormSection>('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [employers, setEmployers] = useState<
    Array<{ id: string; name_en?: string | null; name_ar?: string | null }>
  >([]);
  const [isLoadingEmployers, setIsLoadingEmployers] = useState(true);

  const form = useForm<PromoterFormData>({
    resolver: zodResolver(promoterFormSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      first_name: initialData?.first_name ?? '',
      last_name: initialData?.last_name ?? '',
      name_en: initialData?.name_en ?? '',
      name_ar: initialData?.name_ar ?? '',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
      mobile_number: initialData?.mobile_number ?? '',
      profile_picture_url: initialData?.profile_picture_url ?? '',
      id_card_number: initialData?.id_card_number ?? '',
      id_card_expiry_date:
        initialData?.id_card_expiry_date ??
        new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      passport_number: initialData?.passport_number ?? '',
      passport_expiry_date: initialData?.passport_expiry_date ?? undefined,
      visa_number: initialData?.visa_number ?? '',
      visa_expiry_date: initialData?.visa_expiry_date ?? undefined,
      work_permit_number: initialData?.work_permit_number ?? '',
      work_permit_expiry_date:
        initialData?.work_permit_expiry_date ?? undefined,
      nationality: initialData?.nationality ?? '',
      date_of_birth: initialData?.date_of_birth ?? undefined,
      gender: initialData?.gender ?? undefined,
      marital_status: initialData?.marital_status ?? undefined,
      address: initialData?.address ?? '',
      city: initialData?.city ?? '',
      state: initialData?.state ?? '',
      country: initialData?.country ?? '',
      postal_code: initialData?.postal_code ?? '',
      emergency_contact: initialData?.emergency_contact ?? '',
      emergency_phone: initialData?.emergency_phone ?? '',
      job_title: initialData?.job_title ?? '',
      company: initialData?.company ?? '',
      department: initialData?.department ?? '',
      specialization: initialData?.specialization ?? '',
      experience_years: initialData?.experience_years ?? undefined,
      education_level: initialData?.education_level ?? undefined,
      university: initialData?.university ?? '',
      graduation_year: initialData?.graduation_year ?? undefined,
      skills: initialData?.skills ?? '',
      certifications: initialData?.certifications ?? '',
      bank_name: initialData?.bank_name ?? '',
      account_number: initialData?.account_number ?? '',
      iban: initialData?.iban ?? '',
      swift_code: initialData?.swift_code ?? '',
      tax_id: initialData?.tax_id ?? '',
      status: initialData?.status ?? 'pending',
      overall_status: initialData?.overall_status ?? 'good',
      rating: initialData?.rating ?? undefined,
      availability: initialData?.availability ?? 'available',
      preferred_language: initialData?.preferred_language ?? 'en',
      timezone: initialData?.timezone ?? '',
      special_requirements: initialData?.special_requirements ?? '',
      notes: initialData?.notes ?? '',
      employer_id: initialData?.employer_id ?? '',
      notify_days_before_id_expiry:
        initialData?.notify_days_before_id_expiry ?? 100,
      notify_days_before_passport_expiry:
        initialData?.notify_days_before_passport_expiry ?? 210,
    },
  });

  const sections = Object.keys(FORM_SECTIONS) as FormSection[];
  const currentSectionIndex = sections.indexOf(currentSection);
  const progress = ((currentSectionIndex + 1) / sections.length) * 100;

  // Track form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Auto-save to localStorage
  useEffect(() => {
    if (mode === 'edit' && promoterId) {
      const autoSaveKey = `promoter-form-draft-${promoterId}`;
      const autoSaveInterval = setInterval(() => {
        const formData = form.getValues();
        try {
          localStorage.setItem(autoSaveKey, JSON.stringify(formData));
          setLastSaved(new Date());
        } catch (error) {
        }
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [form, mode, promoterId]);

  // Load draft on mount
  useEffect(() => {
    if (mode === 'edit' && promoterId) {
      const autoSaveKey = `promoter-form-draft-${promoterId}`;
      try {
        const savedDraft = localStorage.getItem(autoSaveKey);
        if (savedDraft) {
          const draftData = JSON.parse(savedDraft);
          // Only load draft if there's no initial data
          if (!initialData || Object.keys(initialData).length === 0) {
            Object.keys(draftData).forEach(key => {
              form.setValue(key as any, draftData[key]);
            });
          }
        }
      } catch (error) {
      }
    }
  }, [form, mode, promoterId, initialData]);

  // Fetch employers
  useEffect(() => {
    const fetchEmployers = async () => {
      setIsLoadingEmployers(true);
      try {
        const response = await fetch('/api/parties?type=Employer&limit=1000');
        const data = await response.json();
        if (data.success && data.parties) {
          setEmployers(data.parties);
        }
      } catch (error) {
      } finally {
        setIsLoadingEmployers(false);
      }
    };
    fetchEmployers();
  }, []);

  // Check section completion
  const getSectionCompletion = (section: FormSection): number => {
    const sectionFields = FORM_SECTIONS[section].fields;
    const formValues = form.getValues();
    let completedFields = 0;

    sectionFields.forEach(field => {
      const value = formValues[field as keyof PromoterFormData];
      if (value !== undefined && value !== null && value !== '') {
        completedFields++;
      }
    });

    return sectionFields.length > 0
      ? Math.round((completedFields / sectionFields.length) * 100)
      : 0;
  };

  const isSectionComplete = (section: FormSection): boolean => {
    return getSectionCompletion(section) === 100;
  };

  const handleNext = () => {
    const nextIndex = currentSectionIndex + 1;
    if (nextIndex < sections.length) {
      const nextSection = sections[nextIndex];
      if (nextSection) {
        setCurrentSection(nextSection);
      }
    }
  };

  const handlePrevious = () => {
    const previousIndex = currentSectionIndex - 1;
    if (previousIndex >= 0) {
      const previousSection = sections[previousIndex];
      if (previousSection) {
        setCurrentSection(previousSection);
      }
    }
  };

  const handleFormSubmit = async (data: PromoterFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);

      // Clear draft after successful save
      if (mode === 'edit' && promoterId) {
        const autoSaveKey = `promoter-form-draft-${promoterId}`;
        localStorage.removeItem(autoSaveKey);
      }

      setHasUnsavedChanges(false);
      toast.success(
        mode === 'create'
          ? 'Promoter created successfully!'
          : 'Promoter updated successfully!'
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to save promoter. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicSection = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='first_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl>
                <Input placeholder='John' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='last_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input placeholder='Doe' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='name_en'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name (English)</FormLabel>
              <FormControl>
                <Input
                  placeholder='John Doe'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='name_ar'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name (Arabic)</FormLabel>
              <FormControl>
                <Input
                  placeholder='جون دو'
                  {...field}
                  value={field.value || ''}
                  dir='rtl'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='profile_picture_url'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profile Picture URL</FormLabel>
            <FormControl>
              <Input
                placeholder='https://example.com/image.jpg'
                type='url'
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              Enter a valid URL for the profile picture
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderContactSection = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='john.doe@example.com'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='phone'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  placeholder='+968 9123 4567'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='mobile_number'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mobile Number</FormLabel>
            <FormControl>
              <Input
                placeholder='+968 9876 5432'
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='address'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Street address'
                {...field}
                value={field.value || ''}
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='city'
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input
                  placeholder='Muscat'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='state'
          render={({ field }) => (
            <FormItem>
              <FormLabel>State/Province</FormLabel>
              <FormControl>
                <Input
                  placeholder='Muscat Governorate'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='country'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input
                  placeholder='Oman'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='postal_code'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal Code</FormLabel>
              <FormControl>
                <Input placeholder='100' {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderPersonalSection = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='nationality'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nationality</FormLabel>
              <FormControl>
                <Input
                  placeholder='Omani'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='date_of_birth'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <DatePickerWithManualInput
                  date={field.value === null ? undefined : field.value}
                  onDateChange={field.onChange}
                  placeholder='Select date of birth'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='gender'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select gender' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='male'>Male</SelectItem>
                  <SelectItem value='female'>Female</SelectItem>
                  <SelectItem value='other'>Other</SelectItem>
                  <SelectItem value='prefer_not_to_say'>
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='marital_status'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marital Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='single'>Single</SelectItem>
                  <SelectItem value='married'>Married</SelectItem>
                  <SelectItem value='divorced'>Divorced</SelectItem>
                  <SelectItem value='widowed'>Widowed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderDocumentsSection = () => (
    <div className='space-y-6'>
      {/* ID Card */}
      <div className='space-y-4 p-4 border rounded-lg'>
        <h4 className='font-medium flex items-center gap-2'>
          <Shield className='h-4 w-4' />
          ID Card
        </h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='id_card_number'
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Card Number *</FormLabel>
                <FormControl>
                  <Input placeholder='12345678' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='id_card_expiry_date'
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Card Expiry Date *</FormLabel>
                <FormControl>
                  <DatePickerWithManualInput
                    date={field.value}
                    onDateChange={field.onChange}
                    placeholder='Select expiry date'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Passport */}
      <div className='space-y-4 p-4 border rounded-lg'>
        <h4 className='font-medium flex items-center gap-2'>
          <Globe className='h-4 w-4' />
          Passport
        </h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='passport_number'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passport Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder='A12345678'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='passport_expiry_date'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passport Expiry Date</FormLabel>
                <FormControl>
                  <DatePickerWithManualInput
                    date={field.value === null ? undefined : field.value}
                    onDateChange={field.onChange}
                    placeholder='Select expiry date'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Visa */}
      <div className='space-y-4 p-4 border rounded-lg'>
        <h4 className='font-medium'>Visa</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='visa_number'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visa Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder='V123456789'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='visa_expiry_date'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visa Expiry Date</FormLabel>
                <FormControl>
                  <DatePickerWithManualInput
                    date={field.value === null ? undefined : field.value}
                    onDateChange={field.onChange}
                    placeholder='Select expiry date'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Work Permit */}
      <div className='space-y-4 p-4 border rounded-lg'>
        <h4 className='font-medium'>Work Permit</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='work_permit_number'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Permit Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder='WP123456'
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='work_permit_expiry_date'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Permit Expiry Date</FormLabel>
                <FormControl>
                  <DatePickerWithManualInput
                    date={field.value === null ? undefined : field.value}
                    onDateChange={field.onChange}
                    placeholder='Select expiry date'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderEmergencySection = () => (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='emergency_contact'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Emergency Contact Name</FormLabel>
            <FormControl>
              <Input
                placeholder='Jane Doe'
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              Name of person to contact in case of emergency
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='emergency_phone'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Emergency Phone Number</FormLabel>
            <FormControl>
              <Input
                placeholder='+968 9123 4567'
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderEmploymentSection = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='job_title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input
                  placeholder='Senior Developer'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='company'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input
                  placeholder='Tech Solutions Inc.'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='department'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input
                  placeholder='Engineering'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='specialization'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialization</FormLabel>
              <FormControl>
                <Input
                  placeholder='Full Stack Development'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='experience_years'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Years of Experience</FormLabel>
            <FormControl>
              <Input
                type='number'
                placeholder='5'
                {...field}
                value={field.value || ''}
                onChange={e =>
                  field.onChange(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='employer_id'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Employer</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || ''}
              disabled={isLoadingEmployers}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingEmployers
                        ? 'Loading employers...'
                        : 'Select employer (optional)'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value=''>None (Unassigned)</SelectItem>
                {employers.map(employer => (
                  <SelectItem key={employer.id} value={employer.id}>
                    {employer.name_en || employer.name_ar || employer.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Link to employer from parties table (optional)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderEducationSection = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='education_level'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Education Level</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select level' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='high_school'>High School</SelectItem>
                  <SelectItem value='diploma'>Diploma</SelectItem>
                  <SelectItem value='bachelor'>Bachelor's Degree</SelectItem>
                  <SelectItem value='master'>Master's Degree</SelectItem>
                  <SelectItem value='phd'>PhD</SelectItem>
                  <SelectItem value='other'>Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='university'
          render={({ field }) => (
            <FormItem>
              <FormLabel>University</FormLabel>
              <FormControl>
                <Input
                  placeholder='Sultan Qaboos University'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='graduation_year'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Graduation Year</FormLabel>
            <FormControl>
              <Input
                type='number'
                placeholder='2020'
                {...field}
                value={field.value || ''}
                onChange={e =>
                  field.onChange(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='skills'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Skills</FormLabel>
            <FormControl>
              <Textarea
                placeholder='JavaScript, TypeScript, React, Node.js...'
                {...field}
                value={field.value || ''}
                rows={3}
              />
            </FormControl>
            <FormDescription>List skills separated by commas</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='certifications'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Certifications</FormLabel>
            <FormControl>
              <Textarea
                placeholder='AWS Certified Developer, PMP...'
                {...field}
                value={field.value || ''}
                rows={3}
              />
            </FormControl>
            <FormDescription>
              List certifications separated by commas
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderBankingSection = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='bank_name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bank Name</FormLabel>
              <FormControl>
                <Input
                  placeholder='Bank Muscat'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='account_number'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Number</FormLabel>
              <FormControl>
                <Input
                  placeholder='1234567890'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='iban'
          render={({ field }) => (
            <FormItem>
              <FormLabel>IBAN</FormLabel>
              <FormControl>
                <Input
                  placeholder='OM12 3456 7890 1234 5678 90'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='swift_code'
          render={({ field }) => (
            <FormItem>
              <FormLabel>SWIFT Code</FormLabel>
              <FormControl>
                <Input
                  placeholder='BMUSOMRX'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name='tax_id'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tax ID</FormLabel>
            <FormControl>
              <Input
                placeholder='TAX123456789'
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStatusSection = () => (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='status'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='suspended'>Suspended</SelectItem>
                  <SelectItem value='on_leave'>On Leave</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='overall_status'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overall Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select overall status' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='excellent'>Excellent</SelectItem>
                  <SelectItem value='good'>Good</SelectItem>
                  <SelectItem value='fair'>Fair</SelectItem>
                  <SelectItem value='warning'>Warning</SelectItem>
                  <SelectItem value='critical'>Critical</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='rating'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating (0-5)</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  step='0.1'
                  min='0'
                  max='5'
                  placeholder='4.5'
                  {...field}
                  value={field.value || ''}
                  onChange={e =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='availability'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Availability</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select availability' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='available'>Available</SelectItem>
                  <SelectItem value='busy'>Busy</SelectItem>
                  <SelectItem value='unavailable'>Unavailable</SelectItem>
                  <SelectItem value='part_time'>Part Time</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='preferred_language'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Language</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select language' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='en'>English</SelectItem>
                  <SelectItem value='ar'>Arabic</SelectItem>
                  <SelectItem value='both'>Both</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='timezone'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <FormControl>
                <Input
                  placeholder='Asia/Muscat'
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderAdditionalSection = () => (
    <div className='space-y-4'>
      <FormField
        control={form.control}
        name='special_requirements'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Requirements</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Any special requirements or accommodations needed...'
                {...field}
                value={field.value || ''}
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name='notes'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Additional notes or comments...'
                {...field}
                value={field.value || ''}
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <div className='space-y-4'>
        <h4 className='font-medium'>Notification Settings</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='notify_days_before_id_expiry'
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Card Expiry Notification (days)</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='90'
                    {...field}
                    value={field.value || ''}
                    onChange={e =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Days before ID expiry to send notification
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='notify_days_before_passport_expiry'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passport Expiry Notification (days)</FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    placeholder='210'
                    {...field}
                    value={field.value || ''}
                    onChange={e =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Days before passport expiry to send notification
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (currentSection) {
      case 'basic':
        return renderBasicSection();
      case 'contact':
        return renderContactSection();
      case 'personal':
        return renderPersonalSection();
      case 'documents':
        return renderDocumentsSection();
      case 'emergency':
        return renderEmergencySection();
      case 'employment':
        return renderEmploymentSection();
      case 'education':
        return renderEducationSection();
      case 'banking':
        return renderBankingSection();
      case 'status':
        return renderStatusSection();
      case 'additional':
        return renderAdditionalSection();
      default:
        return null;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>
          {mode === 'create' ? 'Add New Promoter' : 'Edit Promoter'}
        </h2>
        <p className='text-muted-foreground'>
          {mode === 'create'
            ? 'Fill in the promoter information across multiple sections.'
            : 'Update the promoter information.'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>
            Section {currentSectionIndex + 1} of {sections.length}
          </span>
          <div className='flex items-center gap-4'>
            {hasUnsavedChanges && (
              <span className='text-amber-600 text-xs flex items-center gap-1'>
                <AlertCircle className='h-3 w-3' />
                Unsaved changes
              </span>
            )}
            {lastSaved && (
              <span className='text-muted-foreground text-xs'>
                Last saved: {format(lastSaved, 'HH:mm:ss')}
              </span>
            )}
            <span className='font-medium'>
              {Math.round(progress)}% Complete
            </span>
          </div>
        </div>
        <Progress value={progress} className='h-2' />
      </div>

      {/* Section Navigation */}
      <div className='flex flex-wrap gap-2'>
        {sections.map(section => {
          const isComplete = isSectionComplete(section);
          const completion = getSectionCompletion(section);

          return (
            <Button
              key={section}
              type='button'
              variant={currentSection === section ? 'default' : 'outline'}
              size='sm'
              onClick={() => setCurrentSection(section)}
              className='flex items-center gap-2 relative'
            >
              {SECTION_ICONS[section]}
              <span className='hidden sm:inline'>
                {FORM_SECTIONS[section].title}
              </span>
              {isComplete && (
                <CheckCircle2 className='h-3 w-3 text-green-600' />
              )}
              {!isComplete && completion > 0 && (
                <span className='text-xs text-muted-foreground'>
                  {completion}%
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className='space-y-6'
        >
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                {SECTION_ICONS[currentSection]}
                {FORM_SECTIONS[currentSection].title}
              </CardTitle>
              <CardDescription>
                {FORM_SECTIONS[currentSection].description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderSection()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className='flex items-center justify-between gap-4'>
            <div className='flex gap-2'>
              {currentSectionIndex > 0 && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={handlePrevious}
                >
                  <ChevronLeft className='h-4 w-4 mr-2' />
                  Previous
                </Button>
              )}
            </div>

            <div className='flex gap-2'>
              {onCancel && (
                <Button
                  type='button'
                  variant='ghost'
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}

              {currentSectionIndex < sections.length - 1 ? (
                <Button type='button' onClick={handleNext}>
                  Next
                  <ChevronRight className='h-4 w-4 ml-2' />
                </Button>
              ) : (
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className='h-4 w-4 mr-2' />
                      {mode === 'create'
                        ? 'Create Promoter'
                        : 'Update Promoter'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
