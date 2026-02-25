'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebouncedAutoSave } from '@/hooks/use-auto-save';
import {
  AutoSaveIndicator,
  DraftRecoveryBanner,
} from '@/components/ui/auto-save-indicator';

import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Building,
  CreditCard,
  Camera,
  Upload,
  Download,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Star,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { formatDateForDatabase } from '@/lib/date-utils';
import { PROMOTER_NOTIFICATION_DAYS } from '@/constants/notification-days';
import { DateInput } from '@/components/ui/date-input';

interface PromoterFormProps {
  promoterToEdit?: any | null;
  onFormSubmit: () => void;
  onCancel?: () => void;
}

export default function PromoterForm(props: PromoterFormProps) {
  const { promoterToEdit, onFormSubmit, onCancel } = props;
  const { toast } = useToast();
  const isEditMode = Boolean(promoterToEdit);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Information (only fields that exist in database)
    full_name: promoterToEdit?.name_en || '',
    name_en: promoterToEdit?.name_en || '',
    name_ar: promoterToEdit?.name_ar || '',
    email: promoterToEdit?.email || '',
    phone: promoterToEdit?.phone || '',
    mobile_number: promoterToEdit?.mobile_number || '',

    // Document Information (only fields that exist in database)
    id_number: promoterToEdit?.id_card_number || '',
    passport_number: promoterToEdit?.passport_number || '',
    id_expiry_date: promoterToEdit?.id_card_expiry_date || '',
    passport_expiry_date: promoterToEdit?.passport_expiry_date || '',

    // Status and Preferences (only fields that exist in database)
    status: promoterToEdit?.status || 'active',

    // Additional Information (only fields that exist in database)
    notes: promoterToEdit?.notes || '',
    profile_picture_url: promoterToEdit?.profile_picture_url || '',

    // Notification settings (only fields that exist in database)
    notify_days_before_id_expiry:
      promoterToEdit?.notify_days_before_id_expiry ||
      PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY,
    notify_days_before_passport_expiry:
      promoterToEdit?.notify_days_before_passport_expiry ||
      PROMOTER_NOTIFICATION_DAYS.PASSPORT_EXPIRY,

    // Additional fields that might be used in the form
    rating: promoterToEdit?.rating || 0,
    availability: promoterToEdit?.availability || 'available',
    preferred_language: promoterToEdit?.preferred_language || 'en',
    timezone: promoterToEdit?.timezone || '',
    special_requirements: promoterToEdit?.special_requirements || '',

    // Personal details
    date_of_birth: promoterToEdit?.date_of_birth || '',
    nationality: promoterToEdit?.nationality || '',
    gender: promoterToEdit?.gender || '',
    marital_status: promoterToEdit?.marital_status || '',

    // Address information
    city: promoterToEdit?.city || '',
    state: promoterToEdit?.state || '',
    country: promoterToEdit?.country || '',
    postal_code: promoterToEdit?.postal_code || '',

    // Emergency contact
    emergency_contact: promoterToEdit?.emergency_contact || '',
    emergency_phone: promoterToEdit?.emergency_phone || '',

    // Additional documents
    visa_number: promoterToEdit?.visa_number || '',
    visa_expiry_date: promoterToEdit?.visa_expiry_date || '',
    work_permit_number: promoterToEdit?.work_permit_number || '',
    work_permit_expiry_date: promoterToEdit?.work_permit_expiry_date || '',

    // Professional information
    company: promoterToEdit?.company || '',
    job_title: promoterToEdit?.job_title || '',
    department: promoterToEdit?.department || '',
    specialization: promoterToEdit?.specialization || '',
    experience_years: promoterToEdit?.experience_years || '',
    education_level: promoterToEdit?.education_level || '',
    university: promoterToEdit?.university || '',
    graduation_year: promoterToEdit?.graduation_year || '',
    skills: promoterToEdit?.skills || '',
    certifications: promoterToEdit?.certifications || '',

    // Financial information
    bank_name: promoterToEdit?.bank_name || '',
    account_number: promoterToEdit?.account_number || '',
    iban: promoterToEdit?.iban || '',
    swift_code: promoterToEdit?.swift_code || '',
    tax_id: promoterToEdit?.tax_id || '',
  });

  // Auto-save functionality (only for new forms, not edit mode)
  const autoSave = useDebouncedAutoSave({
    key: `promoter-form-draft-${isEditMode ? promoterToEdit?.id : 'new'}`,
    debounceMs: 3000, // Save 3 seconds after user stops typing
    enabled: !isEditMode, // Only auto-save for new promoters
    excludeFields: ['password', 'confirm_password'], // Don't save sensitive fields
    onSave: data => {},
    onRestore: data => {
      setShowDraftRecovery(true);
    },
  });

  // Document upload state
  const [uploadedDocuments, setUploadedDocuments] = useState({
    id_document: promoterToEdit?.id_document_url || null,
    passport_document: promoterToEdit?.passport_document_url || null,
  });
  const [uploading, setUploading] = useState(false);

  // Dropdown data state
  const [companies, setCompanies] = useState<string[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Predefined lists
  const jobTitles = [
    'Account Manager',
    'Administrative Assistant',
    'Business Analyst',
    'CEO',
    'CFO',
    'CTO',
    'Customer Service Representative',
    'Data Analyst',
    'Developer',
    'Director',
    'Engineer',
    'Executive Assistant',
    'Finance Manager',
    'General Manager',
    'HR Manager',
    'IT Manager',
    'Marketing Manager',
    'Operations Manager',
    'Project Manager',
    'Sales Manager',
    'Sales Promoter',
    'Senior Developer',
    'Software Engineer',
    'Team Lead',
    'Technical Lead',
    'VP of Operations',
  ];

  const departments = [
    'Accounting',
    'Administration',
    'Business Development',
    'Customer Service',
    'Engineering',
    'Finance',
    'Human Resources',
    'Information Technology',
    'Legal',
    'Marketing',
    'Operations',
    'Product Management',
    'Quality Assurance',
    'Research & Development',
    'Sales',
    'Strategy',
    'Support',
  ];

  const nationalities = [
    'Afghan',
    'Albanian',
    'Algerian',
    'American',
    'Argentine',
    'Australian',
    'Austrian',
    'Bahraini',
    'Bangladeshi',
    'Belgian',
    'Brazilian',
    'British',
    'Bulgarian',
    'Canadian',
    'Chilean',
    'Chinese',
    'Colombian',
    'Croatian',
    'Czech',
    'Danish',
    'Dutch',
    'Egyptian',
    'Emirati',
    'Estonian',
    'Filipino',
    'Finnish',
    'French',
    'German',
    'Greek',
    'Hong Kong',
    'Hungarian',
    'Indian',
    'Indonesian',
    'Iranian',
    'Iraqi',
    'Irish',
    'Israeli',
    'Italian',
    'Japanese',
    'Jordanian',
    'Kazakh',
    'Kuwaiti',
    'Lebanese',
    'Libyan',
    'Malaysian',
    'Maltese',
    'Mexican',
    'Moroccan',
    'Nepalese',
    'New Zealander',
    'Norwegian',
    'Omani',
    'Pakistani',
    'Palestinian',
    'Polish',
    'Portuguese',
    'Qatari',
    'Romanian',
    'Russian',
    'Saudi',
    'Singaporean',
    'Slovak',
    'Slovenian',
    'South African',
    'South Korean',
    'Spanish',
    'Sri Lankan',
    'Swedish',
    'Swiss',
    'Syrian',
    'Taiwanese',
    'Thai',
    'Tunisian',
    'Turkish',
    'Ukrainian',
    'Uruguayan',
    'Venezuelan',
    'Vietnamese',
    'Yemeni',
  ];

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // Trigger auto-save after field change
    if (!isEditMode) {
      autoSave.saveDraft(newData);
    }
  };

  // Handle draft recovery
  const handleRestoreDraft = () => {
    const draft = autoSave.loadDraft();
    if (draft) {
      setFormData(draft);
      setShowDraftRecovery(false);
      toast({
        title: 'Draft restored',
        description: 'Your previous work has been restored.',
      });
    }
  };

  const handleDiscardDraft = () => {
    autoSave.clearDraft();
    setShowDraftRecovery(false);
    toast({
      title: 'Draft discarded',
      description: 'Starting with a fresh form.',
    });
  };

  // Handle document upload
  const handleDocumentUpload = async (
    file: File,
    documentType: 'id_document' | 'passport_document'
  ) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or PDF file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Failed to create Supabase client');
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `promoter-documents/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('promoter-documents')
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('promoter-documents')
        .getPublicUrl(filePath);

      // Update uploaded documents state
      setUploadedDocuments(prev => ({
        ...prev,
        [documentType]: {
          url: urlData.publicUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        },
      }));

      toast({
        title: 'Document uploaded successfully',
        description: `${file.name} has been uploaded`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description:
          error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle document removal
  const handleDocumentRemove = (
    documentType: 'id_document' | 'passport_document'
  ) => {
    setUploadedDocuments(prev => ({
      ...prev,
      [documentType]: null,
    }));
  };

  // Fetch companies from parties table
  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Failed to create Supabase client');
      }

      const { data, error } = await supabase
        .from('parties')
        .select('name_en, name_ar')
        .eq('type', 'Employer')
        .order('name_en');

      if (error) {
        throw error;
      }

      const companyNames: string[] =
        data
          ?.map(party => party.name_en || party.name_ar)
          .filter((name): name is string => Boolean(name)) || [];
      setCompanies(companyNames);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Load companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();

      if (!supabase) {
        throw new Error('Failed to create Supabase client');
      }

      // Map form data to database schema - only include fields that exist in the database
      // Available fields in promoters table:
      // - id, name_en, name_ar, id_card_number, id_card_url, passport_url
      // - passport_number, mobile_number, profile_picture_url
      // - status, id_card_expiry_date, passport_expiry_date
      // - notify_days_before_*, notes, created_at, email, phone
      const promoterData: any = {
        name_en: formData.full_name,
        name_ar: formData.name_ar,
        id_card_number: formData.id_number,
        passport_number: formData.passport_number,
        mobile_number: formData.mobile_number,
        id_card_expiry_date: formatDateForDatabase(formData.id_expiry_date),
        passport_expiry_date: formatDateForDatabase(
          formData.passport_expiry_date
        ),
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        notes: formData.notes,
        profile_picture_url: formData.profile_picture_url,
        notify_days_before_id_expiry:
          formData.notify_days_before_id_expiry ||
          PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY,
        notify_days_before_passport_expiry:
          formData.notify_days_before_passport_expiry ||
          PROMOTER_NOTIFICATION_DAYS.PASSPORT_EXPIRY,
      };

      let result;
      if (isEditMode) {
        // Check if ID card number has changed
        const idCardNumberChanged =
          formData.id_number !== promoterToEdit.id_card_number;

        if (idCardNumberChanged) {
          // Check if the new ID card number already exists for another promoter
          const { data: existingPromoter, error: checkError } = await supabase
            .from('promoters')
            .select('id')
            .eq('id_card_number', formData.id_number)
            .neq('id', promoterToEdit.id) // Exclude current promoter
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 = no rows returned
            throw new Error(checkError.message);
          }

          if (existingPromoter) {
            throw new Error(
              `ID card number ${formData.id_number} already exists for another promoter`
            );
          }

          // Add ID card number to update data only if it has changed
          promoterData.id_card_number = formData.id_number;
        }
        // If ID card number hasn't changed, don't include it in the update to avoid constraint issues

        // Use API route instead of direct Supabase call for better error handling
        const response = await fetch(`/api/promoters/${promoterToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promoterData),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Unknown error' }));
          throw new Error(
            errorData.error ||
              errorData.message ||
              `Failed to update promoter: ${response.statusText}`
          );
        }

        const responseData = await response.json();
        result = { data: responseData.promoter || responseData, error: null };
      } else {
        // For new promoters, always include the ID card number
        promoterData.id_card_number = formData.id_number;

        result = await supabase
          .from('promoters')
          .insert([{ ...promoterData, created_at: new Date().toISOString() }]);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: isEditMode ? 'Promoter Updated' : 'Promoter Added',
        description: isEditMode
          ? 'Promoter details have been updated successfully.'
          : 'New promoter has been added successfully.',
      });

      // Clear draft after successful submission
      if (!isEditMode) {
        autoSave.clearDraft();
      }

      onFormSubmit();
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save promoter',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold'>
              {isEditMode ? 'Edit Promoter' : 'Add New Promoter'}
            </h2>
            <p className='text-muted-foreground'>
              {isEditMode
                ? 'Update promoter information'
                : 'Fill in the promoter details'}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            {/* Auto-Save Indicator - Only show for new forms */}
            {!isEditMode && (
              <AutoSaveIndicator
                isSaving={autoSave.isSaving}
                lastSaved={autoSave.lastSaved}
                variant='detailed'
              />
            )}
            <Badge variant={isEditMode ? 'secondary' : 'default'}>
              {isEditMode ? 'Edit Mode' : 'New Promoter'}
            </Badge>
          </div>
        </div>

        {/* Draft Recovery Banner */}
        {showDraftRecovery && autoSave.hasDraft && !isEditMode && (
          <DraftRecoveryBanner
            onRestore={handleRestoreDraft}
            onDiscard={handleDiscardDraft}
            draftAge={autoSave.getTimeSinceLastSave()}
          />
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-6'>
            <TabsTrigger value='personal' className='flex items-center gap-2'>
              <User className='h-4 w-4' />
              Personal
            </TabsTrigger>
            <TabsTrigger value='contact' className='flex items-center gap-2'>
              <Mail className='h-4 w-4' />
              Contact
            </TabsTrigger>
            <TabsTrigger value='documents' className='flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              Documents
            </TabsTrigger>
            <TabsTrigger
              value='professional'
              className='flex items-center gap-2'
            >
              <Briefcase className='h-4 w-4' />
              Professional
            </TabsTrigger>
            <TabsTrigger value='financial' className='flex items-center gap-2'>
              <CreditCard className='h-4 w-4' />
              Financial
            </TabsTrigger>
            <TabsTrigger value='additional' className='flex items-center gap-2'>
              <Plus className='h-4 w-4' />
              Additional
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value='personal' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <User className='h-5 w-5' />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Basic personal details and identification information
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='full_name'>Full Name (English) *</Label>
                    <Input
                      id='full_name'
                      value={formData.full_name}
                      onChange={e =>
                        handleInputChange('full_name', e.target.value)
                      }
                      placeholder='Enter full name in English'
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='name_ar'>Full Name (Arabic)</Label>
                    <Input
                      id='name_ar'
                      value={formData.name_ar}
                      onChange={e =>
                        handleInputChange('name_ar', e.target.value)
                      }
                      placeholder='Enter full name in Arabic'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email Address *</Label>
                    <Input
                      id='email'
                      type='email'
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder='Enter email address'
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Phone Number</Label>
                    <Input
                      id='phone'
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      placeholder='Enter phone number'
                    />
                  </div>

                  <div className='space-y-2'>
                    <DateInput
                      id='date_of_birth'
                      label='Date of Birth'
                      value={formData.date_of_birth}
                      onChange={value =>
                        handleInputChange('date_of_birth', value)
                      }
                      placeholder='DD/MM/YYYY'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='nationality'>Nationality</Label>
                    <Select
                      value={formData.nationality}
                      onValueChange={value =>
                        handleInputChange('nationality', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select nationality' />
                      </SelectTrigger>
                      <SelectContent>
                        {nationalities.map(nationality => (
                          <SelectItem key={nationality} value={nationality}>
                            {nationality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='gender'>Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={value =>
                        handleInputChange('gender', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select gender' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='male'>Male</SelectItem>
                        <SelectItem value='female'>Female</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='marital_status'>Marital Status</Label>
                    <Select
                      value={formData.marital_status}
                      onValueChange={value =>
                        handleInputChange('marital_status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select marital status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='single'>Single</SelectItem>
                        <SelectItem value='married'>Married</SelectItem>
                        <SelectItem value='divorced'>Divorced</SelectItem>
                        <SelectItem value='widowed'>Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Information Tab */}
          <TabsContent value='contact' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Mail className='h-5 w-5' />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Address and emergency contact details
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Address field removed - column doesn't exist in database schema */}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='city'>City</Label>
                    <Input
                      id='city'
                      value={formData.city}
                      onChange={e => handleInputChange('city', e.target.value)}
                      placeholder='Enter city'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='state'>State/Province</Label>
                    <Input
                      id='state'
                      value={formData.state}
                      onChange={e => handleInputChange('state', e.target.value)}
                      placeholder='Enter state or province'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='country'>Country</Label>
                    <Input
                      id='country'
                      value={formData.country}
                      onChange={e =>
                        handleInputChange('country', e.target.value)
                      }
                      placeholder='Enter country'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='postal_code'>Postal Code</Label>
                    <Input
                      id='postal_code'
                      value={formData.postal_code}
                      onChange={e =>
                        handleInputChange('postal_code', e.target.value)
                      }
                      placeholder='Enter postal code'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='emergency_contact'>
                      Emergency Contact Name
                    </Label>
                    <Input
                      id='emergency_contact'
                      value={formData.emergency_contact}
                      onChange={e =>
                        handleInputChange('emergency_contact', e.target.value)
                      }
                      placeholder='Enter emergency contact name'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='emergency_phone'>
                      Emergency Contact Phone
                    </Label>
                    <Input
                      id='emergency_phone'
                      value={formData.emergency_phone}
                      onChange={e =>
                        handleInputChange('emergency_phone', e.target.value)
                      }
                      placeholder='Enter emergency contact phone'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value='documents' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Document Information
                </CardTitle>
                <CardDescription>
                  ID, passport, visa, and work permit details
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='id_number'>ID Number</Label>
                    <Input
                      id='id_number'
                      value={formData.id_number}
                      onChange={e =>
                        handleInputChange('id_number', e.target.value)
                      }
                      placeholder='Enter ID number'
                    />
                  </div>

                  <div className='space-y-2'>
                    <DateInput
                      id='id_expiry_date'
                      label='ID Expiry Date'
                      value={formData.id_expiry_date}
                      onChange={value =>
                        handleInputChange('id_expiry_date', value)
                      }
                      placeholder='DD/MM/YYYY'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='passport_number'>Passport Number</Label>
                    <Input
                      id='passport_number'
                      value={formData.passport_number}
                      onChange={e =>
                        handleInputChange('passport_number', e.target.value)
                      }
                      placeholder='Enter passport number'
                    />
                  </div>

                  <div className='space-y-2'>
                    <DateInput
                      id='passport_expiry_date'
                      label='Passport Expiry Date'
                      value={formData.passport_expiry_date}
                      onChange={value =>
                        handleInputChange('passport_expiry_date', value)
                      }
                      placeholder='DD/MM/YYYY'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='visa_number'>Visa Number</Label>
                    <Input
                      id='visa_number'
                      value={formData.visa_number}
                      onChange={e =>
                        handleInputChange('visa_number', e.target.value)
                      }
                      placeholder='Enter visa number'
                    />
                  </div>

                  <div className='space-y-2'>
                    <DateInput
                      id='visa_expiry_date'
                      label='Visa Expiry Date'
                      value={formData.visa_expiry_date}
                      onChange={value =>
                        handleInputChange('visa_expiry_date', value)
                      }
                      placeholder='DD/MM/YYYY'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='work_permit_number'>
                      Work Permit Number
                    </Label>
                    <Input
                      id='work_permit_number'
                      value={formData.work_permit_number}
                      onChange={e =>
                        handleInputChange('work_permit_number', e.target.value)
                      }
                      placeholder='Enter work permit number'
                    />
                  </div>

                  <div className='space-y-2'>
                    <DateInput
                      id='work_permit_expiry_date'
                      label='Work Permit Expiry Date'
                      value={formData.work_permit_expiry_date}
                      onChange={value =>
                        handleInputChange('work_permit_expiry_date', value)
                      }
                      placeholder='DD/MM/YYYY'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Upload className='h-5 w-5' />
                  Document Upload
                </CardTitle>
                <CardDescription>
                  Upload ID and passport documents for contract generation
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* ID Document Upload */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-base font-medium'>ID Document</Label>
                    <Badge
                      variant={
                        uploadedDocuments.id_document ? 'default' : 'secondary'
                      }
                    >
                      {uploadedDocuments.id_document
                        ? 'Uploaded'
                        : 'Not Uploaded'}
                    </Badge>
                  </div>

                  {!uploadedDocuments.id_document ? (
                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                      <Upload className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                      <div className='space-y-2'>
                        <p className='text-sm text-gray-600'>
                          Upload ID document (JPEG, PNG, or PDF)
                        </p>
                        <p className='text-xs text-gray-500'>
                          Maximum file size: 5MB
                        </p>
                        <input
                          type='file'
                          accept='.jpg,.jpeg,.png,.pdf'
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(file, 'id_document');
                          }}
                          className='hidden'
                          id='id-document-upload'
                          disabled={uploading}
                          aria-label='Upload ID document'
                          title='Upload ID document'
                        />
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() =>
                            document
                              .getElementById('id-document-upload')
                              ?.click()
                          }
                          disabled={uploading}
                          className='mt-2'
                        >
                          {uploading ? (
                            <>
                              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2' />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className='mr-2 h-4 w-4' />
                              Choose File
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className='border rounded-lg p-4 bg-gray-50'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          <FileText className='h-8 w-8 text-blue-500' />
                          <div>
                            <p className='font-medium text-sm'>
                              {uploadedDocuments.id_document.name}
                            </p>
                            <p className='text-xs text-gray-500'>
                              {(
                                uploadedDocuments.id_document.size /
                                1024 /
                                1024
                              ).toFixed(2)}{' '}
                              MB
                            </p>
                          </div>
                        </div>
                        <div className='flex space-x-2'>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              window.open(
                                uploadedDocuments.id_document.url,
                                '_blank'
                              )
                            }
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => handleDocumentRemove('id_document')}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Passport Document Upload */}
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-base font-medium'>
                      Passport Document
                    </Label>
                    <Badge
                      variant={
                        uploadedDocuments.passport_document
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {uploadedDocuments.passport_document
                        ? 'Uploaded'
                        : 'Not Uploaded'}
                    </Badge>
                  </div>

                  {!uploadedDocuments.passport_document ? (
                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                      <Upload className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                      <div className='space-y-2'>
                        <p className='text-sm text-gray-600'>
                          Upload passport document (JPEG, PNG, or PDF)
                        </p>
                        <p className='text-xs text-gray-500'>
                          Maximum file size: 5MB
                        </p>
                        <input
                          type='file'
                          accept='.jpg,.jpeg,.png,.pdf'
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file)
                              handleDocumentUpload(file, 'passport_document');
                          }}
                          className='hidden'
                          id='passport-document-upload'
                          disabled={uploading}
                          aria-label='Upload passport document'
                          title='Upload passport document'
                        />
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() =>
                            document
                              .getElementById('passport-document-upload')
                              ?.click()
                          }
                          disabled={uploading}
                          className='mt-2'
                        >
                          {uploading ? (
                            <>
                              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2' />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className='mr-2 h-4 w-4' />
                              Choose File
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className='border rounded-lg p-4 bg-gray-50'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                          <FileText className='h-8 w-8 text-blue-500' />
                          <div>
                            <p className='font-medium text-sm'>
                              {uploadedDocuments.passport_document.name}
                            </p>
                            <p className='text-xs text-gray-500'>
                              {(
                                uploadedDocuments.passport_document.size /
                                1024 /
                                1024
                              ).toFixed(2)}{' '}
                              MB
                            </p>
                          </div>
                        </div>
                        <div className='flex space-x-2'>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              window.open(
                                uploadedDocuments.passport_document.url,
                                '_blank'
                              )
                            }
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              handleDocumentRemove('passport_document')
                            }
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Instructions */}
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                  <h4 className='font-medium text-blue-900 mb-2'>
                    Upload Requirements
                  </h4>
                  <ul className='text-sm text-blue-800 space-y-1'>
                    <li>• Supported formats: JPEG, PNG, PDF</li>
                    <li>• Maximum file size: 5MB per document</li>
                    <li>• Documents are required for contract generation</li>
                    <li>
                      • Upload clear, high-quality images of your documents
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Information Tab */}
          <TabsContent value='professional' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Briefcase className='h-5 w-5' />
                  Professional Information
                </CardTitle>
                <CardDescription>
                  Work experience, education, and professional details
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='company'>Company</Label>
                    <Select
                      value={formData.company}
                      onValueChange={value =>
                        handleInputChange('company', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingCompanies
                              ? 'Loading companies...'
                              : 'Select company'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company} value={company}>
                            {company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='job_title'>Job Title</Label>
                    <Select
                      value={formData.job_title}
                      onValueChange={value =>
                        handleInputChange('job_title', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select job title' />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTitles.map(title => (
                          <SelectItem key={title} value={title}>
                            {title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='department'>Department</Label>
                    <Select
                      value={formData.department}
                      onValueChange={value =>
                        handleInputChange('department', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select department' />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='specialization'>Specialization</Label>
                    <Input
                      id='specialization'
                      value={formData.specialization}
                      onChange={e =>
                        handleInputChange('specialization', e.target.value)
                      }
                      placeholder='Enter specialization'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='experience_years'>
                      Years of Experience
                    </Label>
                    <Input
                      id='experience_years'
                      type='number'
                      value={formData.experience_years}
                      onChange={e =>
                        handleInputChange('experience_years', e.target.value)
                      }
                      placeholder='Enter years of experience'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='education_level'>Education Level</Label>
                    <Select
                      value={formData.education_level}
                      onValueChange={value =>
                        handleInputChange('education_level', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select education level' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='high_school'>High School</SelectItem>
                        <SelectItem value='bachelor'>
                          Bachelor's Degree
                        </SelectItem>
                        <SelectItem value='master'>Master's Degree</SelectItem>
                        <SelectItem value='phd'>PhD</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='university'>University</Label>
                    <Input
                      id='university'
                      value={formData.university}
                      onChange={e =>
                        handleInputChange('university', e.target.value)
                      }
                      placeholder='Enter university name'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='graduation_year'>
                      Graduation Year (YYYY)
                    </Label>
                    <Input
                      id='graduation_year'
                      type='number'
                      value={formData.graduation_year}
                      onChange={e =>
                        handleInputChange('graduation_year', e.target.value)
                      }
                      placeholder='YYYY'
                      min='1900'
                      max={new Date().getFullYear() + 10}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='skills'>Skills</Label>
                  <Textarea
                    id='skills'
                    value={formData.skills}
                    onChange={e => handleInputChange('skills', e.target.value)}
                    placeholder='Enter skills (comma separated)'
                    rows={3}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='certifications'>Certifications</Label>
                  <Textarea
                    id='certifications'
                    value={formData.certifications}
                    onChange={e =>
                      handleInputChange('certifications', e.target.value)
                    }
                    placeholder='Enter certifications'
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Information Tab */}
          <TabsContent value='financial' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <CreditCard className='h-5 w-5' />
                  Financial Information
                </CardTitle>
                <CardDescription>Banking and financial details</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='bank_name'>Bank Name</Label>
                    <Input
                      id='bank_name'
                      value={formData.bank_name}
                      onChange={e =>
                        handleInputChange('bank_name', e.target.value)
                      }
                      placeholder='Enter bank name'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='account_number'>Account Number</Label>
                    <Input
                      id='account_number'
                      value={formData.account_number}
                      onChange={e =>
                        handleInputChange('account_number', e.target.value)
                      }
                      placeholder='Enter account number'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='iban'>IBAN</Label>
                    <Input
                      id='iban'
                      value={formData.iban}
                      onChange={e => handleInputChange('iban', e.target.value)}
                      placeholder='Enter IBAN'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='swift_code'>SWIFT Code</Label>
                    <Input
                      id='swift_code'
                      value={formData.swift_code}
                      onChange={e =>
                        handleInputChange('swift_code', e.target.value)
                      }
                      placeholder='Enter SWIFT code'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='tax_id'>Tax ID</Label>
                    <Input
                      id='tax_id'
                      value={formData.tax_id}
                      onChange={e =>
                        handleInputChange('tax_id', e.target.value)
                      }
                      placeholder='Enter tax ID'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional Information Tab */}
          <TabsContent value='additional' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Plus className='h-5 w-5' />
                  Additional Information
                </CardTitle>
                <CardDescription>
                  Status, preferences, and additional notes
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='status'>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={value =>
                        handleInputChange('status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='inactive'>Inactive</SelectItem>
                        <SelectItem value='pending'>Pending</SelectItem>
                        <SelectItem value='suspended'>Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='rating'>Rating</Label>
                    <Select
                      value={String(formData.rating || 0)}
                      onValueChange={value =>
                        handleInputChange('rating', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select rating' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='0'>No Rating</SelectItem>
                        <SelectItem value='1'>1 Star</SelectItem>
                        <SelectItem value='2'>2 Stars</SelectItem>
                        <SelectItem value='3'>3 Stars</SelectItem>
                        <SelectItem value='4'>4 Stars</SelectItem>
                        <SelectItem value='5'>5 Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='availability'>Availability</Label>
                    <Select
                      value={formData.availability}
                      onValueChange={value =>
                        handleInputChange('availability', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select availability' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='available'>Available</SelectItem>
                        <SelectItem value='busy'>Busy</SelectItem>
                        <SelectItem value='unavailable'>Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='preferred_language'>
                      Preferred Language
                    </Label>
                    <Select
                      value={formData.preferred_language}
                      onValueChange={value =>
                        handleInputChange('preferred_language', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select language' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='en'>English</SelectItem>
                        <SelectItem value='ar'>Arabic</SelectItem>
                        <SelectItem value='fr'>French</SelectItem>
                        <SelectItem value='es'>Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='timezone'>Timezone</Label>
                    <Input
                      id='timezone'
                      value={formData.timezone}
                      onChange={e =>
                        handleInputChange('timezone', e.target.value)
                      }
                      placeholder='Enter timezone'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='notes'>Notes</Label>
                  <Textarea
                    id='notes'
                    value={formData.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    placeholder='Enter any additional notes'
                    rows={4}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='special_requirements'>
                    Special Requirements
                  </Label>
                  <Textarea
                    id='special_requirements'
                    value={formData.special_requirements}
                    onChange={e =>
                      handleInputChange('special_requirements', e.target.value)
                    }
                    placeholder='Enter any special requirements or accommodations'
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className='flex gap-3 pt-6'>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isLoading}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Cancel
          </Button>

          <Button type='submit' disabled={isLoading} className='flex-1'>
            <Save className='mr-2 h-4 w-4' />
            {isLoading
              ? 'Saving...'
              : isEditMode
                ? 'Update Promoter'
                : 'Add Promoter'}
          </Button>
        </div>
      </form>
    </div>
  );
}
