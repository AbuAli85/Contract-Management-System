'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  Save,
  User,
  Phone,
  FileText,
  Settings,
  Star,
  X,
  CheckCircle,
  Shield,
  Edit3,
  Plus,
  Building,
  Upload,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { formatDateForDatabase } from '@/lib/date-utils';
import { PROMOTER_NOTIFICATION_DAYS } from '@/constants/notification-days';
import DocumentUpload from '@/components/document-upload';
import DocumentUploadEnhanced from '@/components/document-upload-enhanced';
import {
  validatePhoneNumber,
  validateMobileNumber,
  formatPhoneNumber,
  getPhoneNumberExample,
} from '@/lib/validation/phone-validator';
import { DatePickerWithManualInput } from '@/components/date-picker-with-manual-input';

// Simple Label component to avoid the import issue
const Label = ({ children, className, ...props }: any) => (
  <label
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}
    {...props}
  >
    {children}
  </label>
);

// DateInput wrapper component using DatePickerWithManualInput
const DateInput = ({
  value,
  onChange,
  placeholder,
  label,
  id,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  [key: string]: any;
}) => {
  // Convert string value to Date or undefined
  const dateValue = value ? new Date(value) : undefined;

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Format as YYYY-MM-DD for database storage
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className='space-y-2'>
      {label && <Label htmlFor={id}>{label}</Label>}
      <DatePickerWithManualInput
        date={dateValue}
        onDateChange={handleDateChange}
        placeholder={placeholder || 'DD/MM/YYYY'}
        dateFormat='dd/MM/yyyy'
        {...props}
      />
    </div>
  );
};

interface PromoterFormProfessionalProps {
  promoterToEdit?: any | null;
  onFormSubmit: () => void;
  onCancel?: () => void;
}

export default function PromoterFormProfessional(
  props: PromoterFormProfessionalProps
): JSX.Element {
  const { promoterToEdit, onFormSubmit, onCancel } = props;
  const { toast } = useToast();
  const isEditMode = Boolean(promoterToEdit);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formProgress, setFormProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isClient, setIsClient] = useState(false);
  const [employers, setEmployers] = useState<
    { id: string; name_en: string; name_ar: string }[]
  >([]);
  const [employersLoading, setEmployersLoading] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showCustomNationality, setShowCustomNationality] = useState(false);
  const [customNationality, setCustomNationality] = useState('');

  // Safe initialization with fallbacks
  const safeGetValue = (obj: any, key: string, defaultValue: string = '') => {
    try {
      if (!obj || typeof obj !== 'object') return defaultValue;
      const value = obj[key];
      if (value == null || value === undefined) return defaultValue;
      return String(value || '');
    } catch {
      return defaultValue;
    }
  };

  const safeGetNumber = (
    obj: any,
    key: string,
    defaultValue: number = PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY as number
  ) => {
    try {
      if (!obj || typeof obj !== 'object') return defaultValue;
      const value = obj[key];
      if (value == null || value === undefined) return defaultValue;
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    } catch {
      return defaultValue;
    }
  };

  const [formData, setFormData] = useState({
    // Personal Information
    full_name: '',
    name_ar: '',
    email: '',
    phone: '',
    mobile_number: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    nationality: '',

    // Address Information
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    emergency_contact: '',
    emergency_phone: '',

    // Document Information
    id_number: '',
    passport_number: '',
    id_expiry_date: '',
    passport_expiry_date: '',
    visa_number: '',
    visa_expiry_date: '',
    work_permit_number: '',
    work_permit_expiry_date: '',

    // Professional Information
    job_title: '',
    company: '',
    department: '',
    specialization: '',
    experience_years: '',
    education_level: '',
    university: '',
    graduation_year: '',
    skills: '',
    certifications: '',

    // Financial Information
    bank_name: '',
    account_number: '',
    iban: '',
    swift_code: '',
    tax_id: '',

    // Status and Preferences
    status: 'active',
    rating: '',
    availability: '',
    preferred_language: '',
    timezone: '',
    special_requirements: '',

    // Additional Information
    notes: '',
    profile_picture_url: '',

    // Document URLs
    id_card_url: '',
    passport_url: '',

    // Notification settings
    notify_days_before_id_expiry:
      PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY as number,
    notify_days_before_passport_expiry:
      PROMOTER_NOTIFICATION_DAYS.PASSPORT_EXPIRY as number,

    // Employer assignment
    employer_id: '',
  });

  // Fetch employers for dropdown
  const fetchEmployers = useCallback(async () => {
    setEmployersLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Failed to create Supabase client');
      }

      const { data, error } = await supabase
        .from('parties')
        .select('id, name_en, name_ar')
        .eq('type', 'Employer')
        .order('name_en');

      if (error) {
        throw error;
      }

      setEmployers(data || []);
    } catch (error) {
      // Error fetching employers - handled by toast notification
      toast({
        title: 'Error',
        description: 'Failed to load employers',
        variant: 'destructive',
      });
    } finally {
      setEmployersLoading(false);
    }
  }, [toast]);

  // Initialize form data after client-side hydration
  useEffect(() => {
    setIsClient(true);
    fetchEmployers();

    if (promoterToEdit) {
      // Check if nationality is custom (not in predefined list)
      const predefinedNationalities = [
        'afghan',
        'albanian',
        'algerian',
        'american',
        'andorran',
        'angolan',
        'argentinian',
        'armenian',
        'australian',
        'austrian',
        'azerbaijani',
        'bahamian',
        'bahraini',
        'bangladeshi',
        'barbadian',
        'belarusian',
        'belgian',
        'belizean',
        'beninese',
        'bhutanese',
        'bolivian',
        'bosnian',
        'botswanan',
        'brazilian',
        'british',
        'bruneian',
        'bulgarian',
        'burkinabe',
        'burmese',
        'burundian',
        'cambodian',
        'cameroonian',
        'canadian',
        'cape_verdean',
        'central_african',
        'chadian',
        'chilean',
        'chinese',
        'colombian',
        'comoran',
        'congolese',
        'costa_rican',
        'croatian',
        'cuban',
        'cypriot',
        'czech',
        'danish',
        'djiboutian',
        'dominican',
        'dutch',
        'ecuadorian',
        'egyptian',
        'emirati',
        'equatorial_guinean',
        'eritrean',
        'estonian',
        'ethiopian',
        'fijian',
        'filipino',
        'finnish',
        'french',
        'gabonese',
        'gambian',
        'georgian',
        'german',
        'ghanaian',
        'greek',
        'grenadian',
        'guatemalan',
        'guinean',
        'guyanese',
        'haitian',
        'honduran',
        'hungarian',
        'icelandic',
        'indian',
        'indonesian',
        'iranian',
        'iraqi',
        'irish',
        'israeli',
        'italian',
        'ivorian',
        'jamaican',
        'japanese',
        'jordanian',
        'kazakh',
        'kenyan',
        'kuwaiti',
        'kyrgyz',
        'laotian',
        'latvian',
        'lebanese',
        'liberian',
        'libyan',
        'lithuanian',
        'luxembourgish',
        'macedonian',
        'malagasy',
        'malawian',
        'malaysian',
        'maldivian',
        'malian',
        'maltese',
        'mauritarian',
        'mauritian',
        'mexican',
        'moldovan',
        'monacan',
        'mongolian',
        'moroccan',
        'mozambican',
        'namibian',
        'nepalese',
        'new_zealander',
        'nicaraguan',
        'nigerian',
        'nigerien',
        'north_korean',
        'norwegian',
        'omani',
        'pakistani',
        'palestinian',
        'panamanian',
        'papua_new_guinean',
        'paraguayan',
        'peruvian',
        'polish',
        'portuguese',
        'qatari',
        'romanian',
        'russian',
        'rwandan',
        'saudi',
        'senegalese',
        'serbian',
        'singaporean',
        'slovak',
        'slovenian',
        'somali',
        'south_african',
        'south_korean',
        'spanish',
        'sri_lankan',
        'sudanese',
        'swedish',
        'swiss',
        'syrian',
        'taiwanese',
        'tajik',
        'tanzanian',
        'thai',
        'togolese',
        'tunisian',
        'turkish',
        'turkmen',
        'ugandan',
        'ukrainian',
        'uruguayan',
        'uzbek',
        'venezuelan',
        'vietnamese',
        'yemeni',
        'zambian',
        'zimbabwean',
        'other',
      ];

      const existingNationality = safeGetValue(promoterToEdit, 'nationality');
      const isCustomNationality =
        existingNationality &&
        !predefinedNationalities.includes(existingNationality.toLowerCase());

      if (isCustomNationality) {
        setShowCustomNationality(true);
        setCustomNationality(existingNationality);
      }

      setFormData({
        full_name: safeGetValue(promoterToEdit, 'name_en'),
        name_ar: safeGetValue(promoterToEdit, 'name_ar'),
        email: safeGetValue(promoterToEdit, 'email'),
        phone: safeGetValue(promoterToEdit, 'phone'),
        mobile_number: safeGetValue(promoterToEdit, 'mobile_number'),
        date_of_birth: safeGetValue(promoterToEdit, 'date_of_birth'),
        gender: safeGetValue(promoterToEdit, 'gender'),
        marital_status: safeGetValue(promoterToEdit, 'marital_status'),
        nationality: safeGetValue(promoterToEdit, 'nationality'),
        address: safeGetValue(promoterToEdit, 'address'),
        city: safeGetValue(promoterToEdit, 'city'),
        state: safeGetValue(promoterToEdit, 'state'),
        country: safeGetValue(promoterToEdit, 'country'),
        postal_code: safeGetValue(promoterToEdit, 'postal_code'),
        emergency_contact: safeGetValue(promoterToEdit, 'emergency_contact'),
        emergency_phone: safeGetValue(promoterToEdit, 'emergency_phone'),
        id_number: safeGetValue(promoterToEdit, 'id_card_number'),
        passport_number: safeGetValue(promoterToEdit, 'passport_number'),
        id_expiry_date: safeGetValue(promoterToEdit, 'id_card_expiry_date'),
        passport_expiry_date: safeGetValue(
          promoterToEdit,
          'passport_expiry_date'
        ),
        visa_number: safeGetValue(promoterToEdit, 'visa_number'),
        visa_expiry_date: safeGetValue(promoterToEdit, 'visa_expiry_date'),
        work_permit_number: safeGetValue(promoterToEdit, 'work_permit_number'),
        work_permit_expiry_date: safeGetValue(
          promoterToEdit,
          'work_permit_expiry_date'
        ),
        job_title: safeGetValue(promoterToEdit, 'job_title'),
        company: safeGetValue(promoterToEdit, 'company'),
        department: safeGetValue(promoterToEdit, 'department'),
        specialization: safeGetValue(promoterToEdit, 'specialization'),
        experience_years: safeGetValue(promoterToEdit, 'experience_years'),
        education_level: safeGetValue(promoterToEdit, 'education_level'),
        university: safeGetValue(promoterToEdit, 'university'),
        graduation_year: safeGetValue(promoterToEdit, 'graduation_year'),
        skills: safeGetValue(promoterToEdit, 'skills'),
        certifications: safeGetValue(promoterToEdit, 'certifications'),
        bank_name: safeGetValue(promoterToEdit, 'bank_name'),
        account_number: safeGetValue(promoterToEdit, 'account_number'),
        iban: safeGetValue(promoterToEdit, 'iban'),
        swift_code: safeGetValue(promoterToEdit, 'swift_code'),
        tax_id: safeGetValue(promoterToEdit, 'tax_id'),
        status: safeGetValue(promoterToEdit, 'status', 'active'),
        rating: safeGetValue(promoterToEdit, 'rating'),
        availability: safeGetValue(promoterToEdit, 'availability'),
        preferred_language: safeGetValue(promoterToEdit, 'preferred_language'),
        timezone: safeGetValue(promoterToEdit, 'timezone'),
        special_requirements: safeGetValue(
          promoterToEdit,
          'special_requirements'
        ),
        notes: safeGetValue(promoterToEdit, 'notes'),
        profile_picture_url: safeGetValue(
          promoterToEdit,
          'profile_picture_url'
        ),
        id_card_url: safeGetValue(promoterToEdit, 'id_card_url'),
        passport_url: safeGetValue(promoterToEdit, 'passport_url'),
        notify_days_before_id_expiry: safeGetNumber(
          promoterToEdit,
          'notify_days_before_id_expiry',
          100
        ),
        notify_days_before_passport_expiry: safeGetNumber(
          promoterToEdit,
          'notify_days_before_passport_expiry',
          210
        ),
        employer_id: safeGetValue(promoterToEdit, 'employer_id') || '',
      });
    }
  }, [promoterToEdit, fetchEmployers]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Real-time validation for critical fields
    if (field === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setValidationErrors(prev => ({
          ...prev,
          email: 'Please enter a valid email address',
        }));
      }
    }

    if (field === 'mobile_number' && value) {
      const mobileValidation = validateMobileNumber(value, true);
      if (!mobileValidation.isValid) {
        setValidationErrors(prev => ({
          ...prev,
          mobile_number: mobileValidation.error || 'Please enter a valid mobile number',
        }));
      }
    }

    if (field === 'id_number' && value) {
      if (value.trim().length < 5) {
        setValidationErrors(prev => ({
          ...prev,
          id_number: 'ID number must be at least 5 characters',
        }));
      }
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.full_name?.trim()) {
      errors.full_name = 'Full name is required';
    }

    if (!formData.name_ar?.trim()) {
      errors.name_ar = 'Arabic name is required';
    }

    if (!formData.id_number?.trim()) {
      errors.id_number = 'ID number is required';
    }

    // Email validation - REQUIRED
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation - NOW REQUIRED for better communication
    if (!formData.mobile_number || !formData.mobile_number.trim()) {
      errors.mobile_number =
        'Mobile number is required for document alerts and notifications';
    } else {
      const mobileValidation = validateMobileNumber(
        formData.mobile_number,
        true
      );
      if (!mobileValidation.isValid) {
        errors.mobile_number =
          mobileValidation.error || 'Please enter a valid mobile number';
      }
    }

    // Landline phone validation - using comprehensive validator (optional)
    const phoneValidation = validatePhoneNumber(formData.phone, {
      required: false, // Landline is optional
      minDigits: 10,
    });
    if (!phoneValidation.isValid && formData.phone) {
      errors.phone =
        phoneValidation.error || 'Please enter a valid phone number';
    }

    // ID Card Image validation - REQUIRED for contract generation
    if (!formData.id_card_url || !formData.id_card_url.trim()) {
      errors.id_card_url = 'ID card image is required for contract generation';
    }

    // Passport validation - STRONGLY ENCOURAGED
    if (!formData.passport_number || !formData.passport_number.trim()) {
      // Add warning instead of error to allow submission but encourage passport
      if (!errors.passport_number) {
      // Passport number missing - warning shown to user via validation message
      }
    }

    // Passport Image validation - REQUIRED for contract generation
    if (!formData.passport_url || !formData.passport_url.trim()) {
      errors.passport_url =
        'Passport image is required for contract generation';
    }

    // Passport expiry validation - ENCOURAGE with warning
    if (formData.passport_number && !formData.passport_expiry_date) {
      errors.passport_expiry_date =
        'Passport expiry date is required when passport number is provided';
    }

    // Date validation
    if (formData.id_expiry_date) {
      const idDate = new Date(formData.id_expiry_date);
      if (isNaN(idDate.getTime())) {
        errors.id_expiry_date = 'Please enter a valid ID expiry date';
      }
    }

    if (formData.passport_expiry_date) {
      const passportDate = new Date(formData.passport_expiry_date);
      if (isNaN(passportDate.getTime())) {
        errors.passport_expiry_date =
          'Please enter a valid passport expiry date';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) {
      toast({
        title: 'Error',
        description: 'Form data is not initialized',
        variant: 'destructive',
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Failed to create Supabase client');
      }

      // Map form data to database schema - include only existing fields
      const promoterData: any = {
        name_en: formData.full_name?.trim() || '',
        name_ar: formData.name_ar?.trim() || '',
        id_card_number: formData.id_number?.trim() || '',
        mobile_number: formData.mobile_number?.trim() || '',
        id_card_expiry_date: formData.id_expiry_date
          ? formatDateForDatabase(formData.id_expiry_date)
          : null,
        passport_expiry_date: formData.passport_expiry_date
          ? formatDateForDatabase(formData.passport_expiry_date)
          : null,
        email: formData.email?.trim() || '',
        phone: formData.phone?.trim() || '',
        status: formData.status || 'active',
        notes: formData.notes?.trim() || '',
        id_card_url: formData.id_card_url?.trim() || null,
        passport_url: formData.passport_url?.trim() || null,
        passport_number: formData.passport_number?.trim() || null,
        profile_picture_url: formData.profile_picture_url?.trim() || null,
        notify_days_before_id_expiry: parseInt(
          String(formData.notify_days_before_id_expiry || 90)
        ),
        notify_days_before_passport_expiry: parseInt(
          String(formData.notify_days_before_passport_expiry || 210)
        ),

        // Personal Information
        date_of_birth: formData.date_of_birth
          ? formatDateForDatabase(formData.date_of_birth)
          : null,
        gender: formData.gender?.trim() || null,
        marital_status: formData.marital_status?.trim() || null,
        nationality: formData.nationality?.trim() || null,

        // Address Information
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        country: formData.country?.trim() || null,
        postal_code: formData.postal_code?.trim() || null,
        emergency_contact: formData.emergency_contact?.trim() || null,
        emergency_phone: formData.emergency_phone?.trim() || null,

        // Document Information
        visa_number: formData.visa_number?.trim() || null,
        visa_expiry_date: formData.visa_expiry_date
          ? formatDateForDatabase(formData.visa_expiry_date)
          : null,
        work_permit_number: formData.work_permit_number?.trim() || null,
        work_permit_expiry_date: formData.work_permit_expiry_date
          ? formatDateForDatabase(formData.work_permit_expiry_date)
          : null,

        // Professional Information
        job_title: formData.job_title?.trim() || null,
        employer_id:
          formData.employer_id && formData.employer_id.trim() !== ''
            ? formData.employer_id
            : null,
        company: formData.company?.trim() || null,
        department: formData.department?.trim() || null,
        specialization: formData.specialization?.trim() || null,
        experience_years: formData.experience_years
          ? parseInt(String(formData.experience_years))
          : null,
        education_level: formData.education_level?.trim() || null,
        university: formData.university?.trim() || null,
        graduation_year: formData.graduation_year
          ? parseInt(String(formData.graduation_year))
          : null,
        skills: formData.skills?.trim() || null,
        certifications: formData.certifications?.trim() || null,

        // Financial Information
        bank_name: formData.bank_name?.trim() || null,
        account_number: formData.account_number?.trim() || null,
        iban: formData.iban?.trim() || null,
        swift_code: formData.swift_code?.trim() || null,
        tax_id: formData.tax_id?.trim() || null,

        // Preferences and Ratings
        rating: formData.rating ? parseFloat(String(formData.rating)) : null,
        availability: formData.availability?.trim() || null,
        preferred_language: formData.preferred_language?.trim() || null,
        timezone: formData.timezone?.trim() || null,
        special_requirements: formData.special_requirements?.trim() || null,
      };

      // Add employer_id if selected (but not "none")
      if (formData.employer_id && formData.employer_id !== 'none') {
        promoterData.employer_id = formData.employer_id;
      } else {
        // Set to null if "none" is selected or no employer is selected
        promoterData.employer_id = null;
      }

      let result;
      if (isEditMode && promoterToEdit) {
        const idCardNumberChanged =
          formData.id_number !== safeGetValue(promoterToEdit, 'id_card_number');

        if (idCardNumberChanged && formData.id_number) {
          const { data: existingPromoter, error: checkError } = await supabase
            .from('promoters')
            .select('id')
            .eq('id_card_number', formData.id_number)
            .neq('id', promoterToEdit.id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            throw new Error(checkError.message);
          }

          if (existingPromoter) {
            throw new Error(
              `ID card number ${formData.id_number} already exists for another promoter`
            );
          }
        }

        result = await supabase
          .from('promoters')
          .update(promoterData)
          .eq('id', promoterToEdit.id);
      } else {
        // For new promoters, check if ID card number already exists
        if (formData.id_number) {
          const { data: existingPromoter, error: checkError } = await supabase
            .from('promoters')
            .select('id')
            .eq('id_card_number', formData.id_number)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            throw new Error(checkError.message);
          }

          if (existingPromoter) {
            throw new Error(
              `ID card number ${formData.id_number} already exists for another promoter`
            );
          }
        }

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

      onFormSubmit();
    } catch (error) {
      // Error saving promoter - error message shown to user via toast

      let errorMessage = 'Failed to save promoter';
      if (error instanceof Error) {
        if (
          error.message.includes('column') &&
          error.message.includes('does not exist')
        ) {
          errorMessage =
            'Database schema is not up to date. Please contact administrator to apply database migrations.';
        } else if (
          error.message.includes('permission') ||
          error.message.includes('unauthorized')
        ) {
          errorMessage = 'Permission denied. Please check your access rights.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state during SSR or when formData is not initialized
  if (!isClient || !formData) {
    return (
      <div className='space-y-6'>
        <div className='text-center'>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Progress Bar */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between text-sm'>
          <span>Form Completion</span>
          <span>{formProgress}%</span>
        </div>
        <Progress value={formProgress} className='h-2' />
      </div>

      {/* Form */}
      <form 
        onSubmit={handleSubmit} 
        className='space-y-6' 
        role='form' 
        aria-label={isEditMode ? 'Edit promoter form' : 'Add new promoter form'}
        noValidate
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full' aria-label='Promoter form sections'>
          <TabsList className='grid w-full grid-cols-6' role='tablist'>
            <TabsTrigger value='personal' aria-label='Personal information tab'>Personal</TabsTrigger>
            <TabsTrigger value='documents' aria-label='Documents tab'>Documents</TabsTrigger>
            <TabsTrigger value='contact' aria-label='Contact information tab'>Contact</TabsTrigger>
            <TabsTrigger value='professional' aria-label='Professional information tab'>Professional</TabsTrigger>
            <TabsTrigger value='financial' aria-label='Financial information tab'>Financial</TabsTrigger>
            <TabsTrigger value='settings' aria-label='Settings tab'>Settings</TabsTrigger>
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
                      className={
                        validationErrors.full_name ? 'border-red-500' : ''
                      }
                      aria-label='Full name in English'
                      aria-required='true'
                      aria-invalid={!!validationErrors.full_name}
                      aria-describedby={validationErrors.full_name ? 'full_name-error' : undefined}
                    />
                    {validationErrors.full_name && (
                      <p id='full_name-error' className='text-sm text-red-500' role='alert' aria-live='polite'>
                        {validationErrors.full_name}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='name_ar'>Full Name (Arabic) *</Label>
                    <Input
                      id='name_ar'
                      value={formData.name_ar}
                      onChange={e =>
                        handleInputChange('name_ar', e.target.value)
                      }
                      placeholder='Enter full name in Arabic'
                      className={
                        validationErrors.name_ar ? 'border-red-500' : ''
                      }
                      aria-label='Full name in Arabic'
                      aria-required='true'
                      aria-invalid={!!validationErrors.name_ar}
                      aria-describedby={validationErrors.name_ar ? 'name_ar-error' : undefined}
                      dir='rtl'
                    />
                    {validationErrors.name_ar && (
                      <p id='name_ar-error' className='text-sm text-red-500' role='alert' aria-live='polite'>
                        {validationErrors.name_ar}
                      </p>
                    )}
                  </div>

                  <DateInput
                    id='date_of_birth'
                    label='Date of Birth'
                    value={formData.date_of_birth}
                    onChange={value =>
                      handleInputChange('date_of_birth', value)
                    }
                    placeholder='DD/MM/YYYY'
                  />

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

                  <div className='space-y-2'>
                    <Label htmlFor='nationality'>Nationality</Label>
                    <Select
                      value={
                        showCustomNationality ? 'custom' : formData.nationality
                      }
                      onValueChange={value => {
                        if (value === 'custom') {
                          setShowCustomNationality(true);
                          setCustomNationality('');
                        } else {
                          setShowCustomNationality(false);
                          handleInputChange('nationality', value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select nationality' />
                      </SelectTrigger>
                      <SelectContent className='max-h-[300px] overflow-y-auto'>
                        <SelectItem
                          value='custom'
                          className='font-semibold text-blue-600'
                        >
                          ➕ Add Custom Nationality
                        </SelectItem>
                        <SelectItem value='afghan'>Afghan</SelectItem>
                        <SelectItem value='albanian'>Albanian</SelectItem>
                        <SelectItem value='algerian'>Algerian</SelectItem>
                        <SelectItem value='american'>American</SelectItem>
                        <SelectItem value='andorran'>Andorran</SelectItem>
                        <SelectItem value='angolan'>Angolan</SelectItem>
                        <SelectItem value='argentinian'>Argentinian</SelectItem>
                        <SelectItem value='armenian'>Armenian</SelectItem>
                        <SelectItem value='australian'>Australian</SelectItem>
                        <SelectItem value='austrian'>Austrian</SelectItem>
                        <SelectItem value='azerbaijani'>Azerbaijani</SelectItem>
                        <SelectItem value='bahamian'>Bahamian</SelectItem>
                        <SelectItem value='bahraini'>Bahraini</SelectItem>
                        <SelectItem value='bangladeshi'>Bangladeshi</SelectItem>
                        <SelectItem value='barbadian'>Barbadian</SelectItem>
                        <SelectItem value='belarusian'>Belarusian</SelectItem>
                        <SelectItem value='belgian'>Belgian</SelectItem>
                        <SelectItem value='belizean'>Belizean</SelectItem>
                        <SelectItem value='beninese'>Beninese</SelectItem>
                        <SelectItem value='bhutanese'>Bhutanese</SelectItem>
                        <SelectItem value='bolivian'>Bolivian</SelectItem>
                        <SelectItem value='bosnian'>Bosnian</SelectItem>
                        <SelectItem value='botswanan'>Botswanan</SelectItem>
                        <SelectItem value='brazilian'>Brazilian</SelectItem>
                        <SelectItem value='british'>British</SelectItem>
                        <SelectItem value='bruneian'>Bruneian</SelectItem>
                        <SelectItem value='bulgarian'>Bulgarian</SelectItem>
                        <SelectItem value='burkinabe'>Burkinabe</SelectItem>
                        <SelectItem value='burmese'>Burmese</SelectItem>
                        <SelectItem value='burundian'>Burundian</SelectItem>
                        <SelectItem value='cambodian'>Cambodian</SelectItem>
                        <SelectItem value='cameroonian'>Cameroonian</SelectItem>
                        <SelectItem value='canadian'>Canadian</SelectItem>
                        <SelectItem value='cape_verdean'>
                          Cape Verdean
                        </SelectItem>
                        <SelectItem value='central_african'>
                          Central African
                        </SelectItem>
                        <SelectItem value='chadian'>Chadian</SelectItem>
                        <SelectItem value='chilean'>Chilean</SelectItem>
                        <SelectItem value='chinese'>Chinese</SelectItem>
                        <SelectItem value='colombian'>Colombian</SelectItem>
                        <SelectItem value='comoran'>Comoran</SelectItem>
                        <SelectItem value='congolese'>Congolese</SelectItem>
                        <SelectItem value='costa_rican'>Costa Rican</SelectItem>
                        <SelectItem value='croatian'>Croatian</SelectItem>
                        <SelectItem value='cuban'>Cuban</SelectItem>
                        <SelectItem value='cypriot'>Cypriot</SelectItem>
                        <SelectItem value='czech'>Czech</SelectItem>
                        <SelectItem value='danish'>Danish</SelectItem>
                        <SelectItem value='djiboutian'>Djiboutian</SelectItem>
                        <SelectItem value='dominican'>Dominican</SelectItem>
                        <SelectItem value='dutch'>Dutch</SelectItem>
                        <SelectItem value='ecuadorian'>Ecuadorian</SelectItem>
                        <SelectItem value='egyptian'>Egyptian</SelectItem>
                        <SelectItem value='emirati'>Emirati (UAE)</SelectItem>
                        <SelectItem value='equatorial_guinean'>
                          Equatorial Guinean
                        </SelectItem>
                        <SelectItem value='eritrean'>Eritrean</SelectItem>
                        <SelectItem value='estonian'>Estonian</SelectItem>
                        <SelectItem value='ethiopian'>Ethiopian</SelectItem>
                        <SelectItem value='fijian'>Fijian</SelectItem>
                        <SelectItem value='filipino'>Filipino</SelectItem>
                        <SelectItem value='finnish'>Finnish</SelectItem>
                        <SelectItem value='french'>French</SelectItem>
                        <SelectItem value='gabonese'>Gabonese</SelectItem>
                        <SelectItem value='gambian'>Gambian</SelectItem>
                        <SelectItem value='georgian'>Georgian</SelectItem>
                        <SelectItem value='german'>German</SelectItem>
                        <SelectItem value='ghanaian'>Ghanaian</SelectItem>
                        <SelectItem value='greek'>Greek</SelectItem>
                        <SelectItem value='grenadian'>Grenadian</SelectItem>
                        <SelectItem value='guatemalan'>Guatemalan</SelectItem>
                        <SelectItem value='guinean'>Guinean</SelectItem>
                        <SelectItem value='guyanese'>Guyanese</SelectItem>
                        <SelectItem value='haitian'>Haitian</SelectItem>
                        <SelectItem value='honduran'>Honduran</SelectItem>
                        <SelectItem value='hungarian'>Hungarian</SelectItem>
                        <SelectItem value='icelandic'>Icelandic</SelectItem>
                        <SelectItem value='indian'>Indian</SelectItem>
                        <SelectItem value='indonesian'>Indonesian</SelectItem>
                        <SelectItem value='iranian'>Iranian</SelectItem>
                        <SelectItem value='iraqi'>Iraqi</SelectItem>
                        <SelectItem value='irish'>Irish</SelectItem>
                        <SelectItem value='israeli'>Israeli</SelectItem>
                        <SelectItem value='italian'>Italian</SelectItem>
                        <SelectItem value='ivorian'>Ivorian</SelectItem>
                        <SelectItem value='jamaican'>Jamaican</SelectItem>
                        <SelectItem value='japanese'>Japanese</SelectItem>
                        <SelectItem value='jordanian'>Jordanian</SelectItem>
                        <SelectItem value='kazakh'>Kazakh</SelectItem>
                        <SelectItem value='kenyan'>Kenyan</SelectItem>
                        <SelectItem value='kuwaiti'>Kuwaiti</SelectItem>
                        <SelectItem value='kyrgyz'>Kyrgyz</SelectItem>
                        <SelectItem value='laotian'>Laotian</SelectItem>
                        <SelectItem value='latvian'>Latvian</SelectItem>
                        <SelectItem value='lebanese'>Lebanese</SelectItem>
                        <SelectItem value='liberian'>Liberian</SelectItem>
                        <SelectItem value='libyan'>Libyan</SelectItem>
                        <SelectItem value='lithuanian'>Lithuanian</SelectItem>
                        <SelectItem value='luxembourgish'>
                          Luxembourgish
                        </SelectItem>
                        <SelectItem value='macedonian'>Macedonian</SelectItem>
                        <SelectItem value='malagasy'>Malagasy</SelectItem>
                        <SelectItem value='malawian'>Malawian</SelectItem>
                        <SelectItem value='malaysian'>Malaysian</SelectItem>
                        <SelectItem value='maldivian'>Maldivian</SelectItem>
                        <SelectItem value='malian'>Malian</SelectItem>
                        <SelectItem value='maltese'>Maltese</SelectItem>
                        <SelectItem value='mauritarian'>Mauritarian</SelectItem>
                        <SelectItem value='mauritian'>Mauritian</SelectItem>
                        <SelectItem value='mexican'>Mexican</SelectItem>
                        <SelectItem value='moldovan'>Moldovan</SelectItem>
                        <SelectItem value='monacan'>Monacan</SelectItem>
                        <SelectItem value='mongolian'>Mongolian</SelectItem>
                        <SelectItem value='moroccan'>Moroccan</SelectItem>
                        <SelectItem value='mozambican'>Mozambican</SelectItem>
                        <SelectItem value='namibian'>Namibian</SelectItem>
                        <SelectItem value='nepalese'>Nepalese</SelectItem>
                        <SelectItem value='new_zealander'>
                          New Zealander
                        </SelectItem>
                        <SelectItem value='nicaraguan'>Nicaraguan</SelectItem>
                        <SelectItem value='nigerian'>Nigerian</SelectItem>
                        <SelectItem value='nigerien'>Nigerien</SelectItem>
                        <SelectItem value='north_korean'>
                          North Korean
                        </SelectItem>
                        <SelectItem value='norwegian'>Norwegian</SelectItem>
                        <SelectItem value='omani'>Omani</SelectItem>
                        <SelectItem value='pakistani'>Pakistani</SelectItem>
                        <SelectItem value='palestinian'>Palestinian</SelectItem>
                        <SelectItem value='panamanian'>Panamanian</SelectItem>
                        <SelectItem value='papua_new_guinean'>
                          Papua New Guinean
                        </SelectItem>
                        <SelectItem value='paraguayan'>Paraguayan</SelectItem>
                        <SelectItem value='peruvian'>Peruvian</SelectItem>
                        <SelectItem value='polish'>Polish</SelectItem>
                        <SelectItem value='portuguese'>Portuguese</SelectItem>
                        <SelectItem value='qatari'>Qatari</SelectItem>
                        <SelectItem value='romanian'>Romanian</SelectItem>
                        <SelectItem value='russian'>Russian</SelectItem>
                        <SelectItem value='rwandan'>Rwandan</SelectItem>
                        <SelectItem value='saudi'>Saudi</SelectItem>
                        <SelectItem value='senegalese'>Senegalese</SelectItem>
                        <SelectItem value='serbian'>Serbian</SelectItem>
                        <SelectItem value='singaporean'>Singaporean</SelectItem>
                        <SelectItem value='slovak'>Slovak</SelectItem>
                        <SelectItem value='slovenian'>Slovenian</SelectItem>
                        <SelectItem value='somali'>Somali</SelectItem>
                        <SelectItem value='south_african'>
                          South African
                        </SelectItem>
                        <SelectItem value='south_korean'>
                          South Korean
                        </SelectItem>
                        <SelectItem value='spanish'>Spanish</SelectItem>
                        <SelectItem value='sri_lankan'>Sri Lankan</SelectItem>
                        <SelectItem value='sudanese'>Sudanese</SelectItem>
                        <SelectItem value='swedish'>Swedish</SelectItem>
                        <SelectItem value='swiss'>Swiss</SelectItem>
                        <SelectItem value='syrian'>Syrian</SelectItem>
                        <SelectItem value='taiwanese'>Taiwanese</SelectItem>
                        <SelectItem value='tajik'>Tajik</SelectItem>
                        <SelectItem value='tanzanian'>Tanzanian</SelectItem>
                        <SelectItem value='thai'>Thai</SelectItem>
                        <SelectItem value='togolese'>Togolese</SelectItem>
                        <SelectItem value='tunisian'>Tunisian</SelectItem>
                        <SelectItem value='turkish'>Turkish</SelectItem>
                        <SelectItem value='turkmen'>Turkmen</SelectItem>
                        <SelectItem value='ugandan'>Ugandan</SelectItem>
                        <SelectItem value='ukrainian'>Ukrainian</SelectItem>
                        <SelectItem value='uruguayan'>Uruguayan</SelectItem>
                        <SelectItem value='uzbek'>Uzbek</SelectItem>
                        <SelectItem value='venezuelan'>Venezuelan</SelectItem>
                        <SelectItem value='vietnamese'>Vietnamese</SelectItem>
                        <SelectItem value='yemeni'>Yemeni</SelectItem>
                        <SelectItem value='zambian'>Zambian</SelectItem>
                        <SelectItem value='zimbabwean'>Zimbabwean</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Custom Nationality Input */}
                    {showCustomNationality && (
                      <div className='space-y-2 mt-2 p-3 border border-blue-200 rounded-lg bg-blue-50'>
                        <Label
                          htmlFor='custom_nationality'
                          className='text-blue-900'
                        >
                          Custom Nationality
                        </Label>
                        <div className='flex gap-2'>
                          <Input
                            id='custom_nationality'
                            value={customNationality}
                            onChange={e => setCustomNationality(e.target.value)}
                            placeholder='Enter nationality (e.g., Stateless, Dual Citizen)'
                            className='flex-1 bg-white'
                            autoFocus
                          />
                          <Button
                            type='button'
                            size='sm'
                            onClick={() => {
                              if (customNationality.trim()) {
                                handleInputChange(
                                  'nationality',
                                  customNationality.trim()
                                );
                                setShowCustomNationality(false);
                                setCustomNationality('');
                                toast({
                                  title: 'Custom Nationality Added',
                                  description: `"${customNationality.trim()}" has been set as the nationality.`,
                                });
                              }
                            }}
                            disabled={!customNationality.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            type='button'
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              setShowCustomNationality(false);
                              setCustomNationality('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                        <p className='text-xs text-blue-700'>
                          💡 Tip: Enter the nationality name and click Save to
                          add it
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value='documents' className='space-y-6'>
            <TooltipProvider>
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
                <CardContent className='space-y-6'>
                {/* ID Card Section */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 pb-2 border-b'>
                    <FileText className='h-5 w-5 text-primary' />
                    <h3 className='text-lg font-semibold'>ID Card Information</h3>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='id_number' className='flex items-center gap-2'>
                        ID Number <span className='text-red-500'>*</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>National ID or Civil ID number</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id='id_number'
                        value={formData.id_number}
                        onChange={e =>
                          handleInputChange('id_number', e.target.value)
                        }
                        placeholder='Enter ID number'
                        className={
                          validationErrors.id_number ? 'border-red-500' : ''
                        }
                        required
                        aria-label='ID card number'
                        aria-required='true'
                        aria-invalid={!!validationErrors.id_number}
                        aria-describedby={validationErrors.id_number ? 'id_number-error' : undefined}
                      />
                      {validationErrors.id_number && (
                        <p id='id_number-error' className='text-sm text-red-500 flex items-center gap-1' role='alert' aria-live='polite'>
                          <AlertCircle className='h-3 w-3' />
                          {validationErrors.id_number}
                        </p>
                      )}
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
                        className={
                          validationErrors.id_expiry_date ? 'border-red-500' : ''
                        }
                      />
                      {validationErrors.id_expiry_date && (
                        <p className='text-sm text-red-500 mt-1 flex items-center gap-1'>
                          <AlertCircle className='h-3 w-3' />
                          {validationErrors.id_expiry_date}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Passport Section */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 pb-2 border-b'>
                    <FileText className='h-5 w-5 text-blue-500' />
                    <h3 className='text-lg font-semibold'>Passport Information</h3>
                    <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
                      Highly Recommended
                    </Badge>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='passport_number' className='flex items-center gap-2'>
                        Passport Number
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Required for international assignments and compliance tracking</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id='passport_number'
                        value={formData.passport_number}
                        onChange={e =>
                          handleInputChange('passport_number', e.target.value)
                        }
                        placeholder='Enter passport number'
                        className={
                          !formData.passport_number
                            ? 'border-amber-300 bg-amber-50/50'
                            : ''
                        }
                      />
                      {!formData.passport_number && (
                        <p className='text-xs text-amber-600 flex items-center gap-1'>
                          <AlertTriangle className='h-3 w-3' />
                          Passport required for international assignments and compliance tracking
                        </p>
                      )}
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
                        className={
                          validationErrors.passport_expiry_date ? 'border-red-500' : ''
                        }
                      />
                      {validationErrors.passport_expiry_date && (
                        <p className='text-sm text-red-500 mt-1 flex items-center gap-1'>
                          <AlertCircle className='h-3 w-3' />
                          {validationErrors.passport_expiry_date}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visa Section */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 pb-2 border-b'>
                    <FileText className='h-5 w-5 text-green-500' />
                    <h3 className='text-lg font-semibold'>Visa Information</h3>
                    <Badge variant='outline' className='text-xs'>Optional</Badge>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='visa_number'>
                        Visa Number
                      </Label>
                      <Input
                        id='visa_number'
                        value={formData.visa_number}
                        onChange={e =>
                          handleInputChange('visa_number', e.target.value)
                        }
                        placeholder='Enter visa number (if applicable)'
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
                  </div>
                </div>

                {/* Work Permit Section */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-2 pb-2 border-b'>
                    <FileText className='h-5 w-5 text-purple-500' />
                    <h3 className='text-lg font-semibold'>Work Permit Information</h3>
                    <Badge variant='outline' className='text-xs'>Optional</Badge>
                  </div>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                        placeholder='Enter work permit number (if applicable)'
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
                </div>

                {/* Document Upload Section */}
                <div className='mt-6 space-y-4 pt-6 border-t'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <Upload className='h-5 w-5 text-primary' />
                      <div>
                        <h4 className='text-lg font-semibold'>Document Upload & Management</h4>
                        <p className='text-sm text-muted-foreground'>
                          Upload, view, edit, replace, or delete documents
                        </p>
                      </div>
                    </div>
                    <Button
                      type='button'
                      variant={showDocumentUpload ? 'secondary' : 'outline'}
                      size='sm'
                      onClick={() => setShowDocumentUpload(!showDocumentUpload)}
                      className='gap-2'
                    >
                      {showDocumentUpload ? (
                        <>
                          <EyeOff className='h-4 w-4' />
                          Hide Upload
                        </>
                      ) : (
                        <>
                          <Upload className='h-4 w-4' />
                          Show Upload
                        </>
                      )}
                    </Button>
                  </div>

                  {showDocumentUpload && (
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                      <DocumentUploadEnhanced
                        promoterId={isEditMode ? promoterToEdit?.id : 'new'}
                        promoterName={
                          formData.full_name ||
                          promoterToEdit?.name_en ||
                          'Unknown'
                        }
                        idCardNumber={formData.id_number}
                        passportNumber={formData.passport_number}
                        documentType='id_card'
                        currentUrl={formData.id_card_url}
                        onUploadComplete={url => {
                          setFormData(prev => ({ ...prev, id_card_url: url }));
                          toast({
                            title: 'Success',
                            description: 'ID card document uploaded successfully',
                          });
                        }}
                        onDelete={() => {
                          setFormData(prev => ({ ...prev, id_card_url: '' }));
                          toast({
                            title: 'Deleted',
                            description: 'ID card document has been removed',
                          });
                        }}
                        onReplace={(oldUrl, newUrl) => {
                          setFormData(prev => ({ ...prev, id_card_url: newUrl }));
                          toast({
                            title: 'Replaced',
                            description: 'ID card document has been replaced',
                          });
                        }}
                      />
                      <DocumentUploadEnhanced
                        promoterId={isEditMode ? promoterToEdit?.id : 'new'}
                        promoterName={
                          formData.full_name ||
                          promoterToEdit?.name_en ||
                          'Unknown'
                        }
                        idCardNumber={formData.id_number}
                        passportNumber={formData.passport_number}
                        documentType='passport'
                        currentUrl={formData.passport_url}
                        onUploadComplete={url => {
                          setFormData(prev => ({ ...prev, passport_url: url }));
                          toast({
                            title: 'Success',
                            description: 'Passport document uploaded successfully',
                          });
                        }}
                        onDelete={() => {
                          setFormData(prev => ({ ...prev, passport_url: '' }));
                          toast({
                            title: 'Deleted',
                            description: 'Passport document has been removed',
                          });
                        }}
                        onReplace={(oldUrl, newUrl) => {
                          setFormData(prev => ({ ...prev, passport_url: newUrl }));
                          toast({
                            title: 'Replaced',
                            description: 'Passport document has been replaced',
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </TooltipProvider>
          </TabsContent>

          {/* Contact Information Tab */}
          <TabsContent value='contact' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Phone className='h-5 w-5' />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Email, phone, and address contact details
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>
                      Email Address <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder='Enter email address (required)'
                      className={validationErrors.email ? 'border-red-500' : ''}
                      required
                      aria-label='Email address'
                      aria-required='true'
                      aria-invalid={!!validationErrors.email}
                      aria-describedby={validationErrors.email ? 'email-error' : undefined}
                    />
                    {validationErrors.email && (
                      <p id='email-error' className='text-sm text-red-500' role='alert' aria-live='polite'>
                        {validationErrors.email}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Phone Number</Label>
                    <Input
                      id='phone'
                      type='tel'
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      onBlur={e => {
                        // Auto-format on blur
                        const formatted = formatPhoneNumber(e.target.value);
                        if (formatted !== e.target.value) {
                          handleInputChange('phone', formatted);
                        }
                      }}
                      placeholder={getPhoneNumberExample('968')}
                      className={validationErrors.phone ? 'border-red-500' : ''}
                    />
                    <p className='text-xs text-muted-foreground'>
                      Include country code (e.g., +968 9123 4567)
                    </p>
                    {validationErrors.phone && (
                      <p className='text-sm text-red-500'>
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label
                      htmlFor='mobile_number'
                      className='flex items-center gap-2'
                    >
                      Mobile Number
                      <Badge
                        variant='destructive'
                        className='text-xs font-normal'
                      >
                        Required
                      </Badge>
                    </Label>
                    <Input
                      id='mobile_number'
                      type='tel'
                      value={formData.mobile_number}
                      onChange={e =>
                        handleInputChange('mobile_number', e.target.value)
                      }
                      onBlur={e => {
                        // Auto-format on blur
                        const formatted = formatPhoneNumber(e.target.value);
                        if (formatted !== e.target.value) {
                          handleInputChange('mobile_number', formatted);
                        }
                      }}
                      placeholder={getPhoneNumberExample('968')}
                      className={
                        validationErrors.mobile_number ? 'border-red-500' : ''
                      }
                      required
                      aria-label='Mobile number'
                      aria-required='true'
                      aria-invalid={!!validationErrors.mobile_number}
                      aria-describedby={validationErrors.mobile_number ? 'mobile_number-error' : 'mobile_number-hint'}
                    />
                    <p id='mobile_number-hint' className='text-xs text-muted-foreground'>
                      Include country code (e.g., +968 9123 4567)
                    </p>
                    {validationErrors.mobile_number && (
                      <p id='mobile_number-error' className='text-sm text-red-500' role='alert' aria-live='polite'>
                        {validationErrors.mobile_number}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='emergency_contact'>Emergency Contact</Label>
                    <Input
                      id='emergency_contact'
                      value={formData.emergency_contact}
                      onChange={e =>
                        handleInputChange('emergency_contact', e.target.value)
                      }
                      placeholder='Emergency contact person name'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='emergency_phone'>Emergency Phone</Label>
                    <Input
                      id='emergency_phone'
                      value={formData.emergency_phone}
                      onChange={e =>
                        handleInputChange('emergency_phone', e.target.value)
                      }
                      placeholder='Emergency contact phone number'
                    />
                  </div>
                </div>

                <div className='space-y-4'>
                  <h4 className='text-lg font-medium'>Address Information</h4>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='address'>Full Address</Label>
                      <Textarea
                        id='address'
                        value={formData.address}
                        onChange={e =>
                          handleInputChange('address', e.target.value)
                        }
                        placeholder='Enter full address'
                        rows={3}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='city'>City</Label>
                      <Input
                        id='city'
                        value={formData.city}
                        onChange={e =>
                          handleInputChange('city', e.target.value)
                        }
                        placeholder='Enter city'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='state'>State/Province</Label>
                      <Input
                        id='state'
                        value={formData.state}
                        onChange={e =>
                          handleInputChange('state', e.target.value)
                        }
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Information Tab */}
          <TabsContent value='professional' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building className='h-5 w-5' />
                  Professional Information
                </CardTitle>
                <CardDescription>
                  Job details, education, and professional background
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
                        <SelectItem value='accountant'>Accountant</SelectItem>
                        <SelectItem value='administrative_assistant'>
                          Administrative Assistant
                        </SelectItem>
                        <SelectItem value='analyst'>Analyst</SelectItem>
                        <SelectItem value='architect'>Architect</SelectItem>
                        <SelectItem value='assistant_manager'>
                          Assistant Manager
                        </SelectItem>
                        <SelectItem value='business_analyst'>
                          Business Analyst
                        </SelectItem>
                        <SelectItem value='cashier'>Cashier</SelectItem>
                        <SelectItem value='ceo'>CEO</SelectItem>
                        <SelectItem value='cfo'>CFO</SelectItem>
                        <SelectItem value='consultant'>Consultant</SelectItem>
                        <SelectItem value='coordinator'>Coordinator</SelectItem>
                        <SelectItem value='customer_service'>
                          Customer Service Representative
                        </SelectItem>
                        <SelectItem value='data_analyst'>
                          Data Analyst
                        </SelectItem>
                        <SelectItem value='designer'>Designer</SelectItem>
                        <SelectItem value='developer'>Developer</SelectItem>
                        <SelectItem value='director'>Director</SelectItem>
                        <SelectItem value='engineer'>Engineer</SelectItem>
                        <SelectItem value='executive'>Executive</SelectItem>
                        <SelectItem value='finance_manager'>
                          Finance Manager
                        </SelectItem>
                        <SelectItem value='graphic_designer'>
                          Graphic Designer
                        </SelectItem>
                        <SelectItem value='hr_manager'>HR Manager</SelectItem>
                        <SelectItem value='intern'>Intern</SelectItem>
                        <SelectItem value='it_manager'>IT Manager</SelectItem>
                        <SelectItem value='junior_developer'>
                          Junior Developer
                        </SelectItem>
                        <SelectItem value='lawyer'>Lawyer</SelectItem>
                        <SelectItem value='marketing_manager'>
                          Marketing Manager
                        </SelectItem>
                        <SelectItem value='nurse'>Nurse</SelectItem>
                        <SelectItem value='operations_manager'>
                          Operations Manager
                        </SelectItem>
                        <SelectItem value='project_manager'>
                          Project Manager
                        </SelectItem>
                        <SelectItem value='receptionist'>
                          Receptionist
                        </SelectItem>
                        <SelectItem value='researcher'>Researcher</SelectItem>
                        <SelectItem value='sales_manager'>
                          Sales Manager
                        </SelectItem>
                        <SelectItem value='sales_promoter'>
                          Sales promoter
                        </SelectItem>
                        <SelectItem value='sales_representative'>
                          Sales Representative
                        </SelectItem>
                        <SelectItem value='senior_developer'>
                          Senior Developer
                        </SelectItem>
                        <SelectItem value='software_engineer'>
                          Software Engineer
                        </SelectItem>
                        <SelectItem value='supervisor'>Supervisor</SelectItem>
                        <SelectItem value='teacher'>Teacher</SelectItem>
                        <SelectItem value='technician'>Technician</SelectItem>
                        <SelectItem value='trainee'>Trainee</SelectItem>
                        <SelectItem value='translator'>Translator</SelectItem>
                        <SelectItem value='web_developer'>
                          Web Developer
                        </SelectItem>
                        <SelectItem value='writer'>Writer</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='employer_id'>
                      Employer <span className='text-blue-600'>*</span>
                    </Label>
                    <Select
                      value={formData.employer_id || ''}
                      onValueChange={value =>
                        handleInputChange(
                          'employer_id',
                          value === 'clear' ? '' : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            employersLoading
                              ? 'Loading employers...'
                              : 'Select employer'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.employer_id && (
                          <SelectItem value='clear' className='text-red-600'>
                            Clear Selection
                          </SelectItem>
                        )}
                        {employers.length === 0 && !employersLoading ? (
                          <div className='px-2 py-6 text-center text-sm text-muted-foreground'>
                            No employers found - Add employers in Parties
                            section
                          </div>
                        ) : (
                          <>
                            {employers.map(employer => (
                              <SelectItem key={employer.id} value={employer.id}>
                                <div className='flex items-center gap-2'>
                                  <div className='flex flex-col'>
                                    <span className='font-medium'>
                                      {employer.name_en}
                                    </span>
                                    {employer.name_ar && (
                                      <span className='text-xs text-muted-foreground'>
                                        {employer.name_ar}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <p className='text-xs text-muted-foreground'>
                      Select the employer (company) this promoter works for.
                      This prevents assignment mismatches.
                    </p>
                    {validationErrors.employer_id && (
                      <p className='text-sm text-red-500'>
                        {validationErrors.employer_id}
                      </p>
                    )}
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
                        <SelectItem value='accounting'>Accounting</SelectItem>
                        <SelectItem value='administration'>
                          Administration
                        </SelectItem>
                        <SelectItem value='business_development'>
                          Business Development
                        </SelectItem>
                        <SelectItem value='customer_service'>
                          Customer Service
                        </SelectItem>
                        <SelectItem value='engineering'>Engineering</SelectItem>
                        <SelectItem value='finance'>Finance</SelectItem>
                        <SelectItem value='human_resources'>
                          Human Resources
                        </SelectItem>
                        <SelectItem value='information_technology'>
                          Information Technology
                        </SelectItem>
                        <SelectItem value='legal'>Legal</SelectItem>
                        <SelectItem value='marketing'>Marketing</SelectItem>
                        <SelectItem value='operations'>Operations</SelectItem>
                        <SelectItem value='product'>Product</SelectItem>
                        <SelectItem value='quality_assurance'>
                          Quality Assurance
                        </SelectItem>
                        <SelectItem value='research_and_development'>
                          Research & Development
                        </SelectItem>
                        <SelectItem value='sales'>Sales</SelectItem>
                        <SelectItem value='security'>Security</SelectItem>
                        <SelectItem value='supply_chain'>
                          Supply Chain
                        </SelectItem>
                        <SelectItem value='training'>Training</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='specialization'>Specialization</Label>
                    <Select
                      value={formData.specialization}
                      onValueChange={value =>
                        handleInputChange('specialization', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select specialization' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='accounting'>Accounting</SelectItem>
                        <SelectItem value='administration'>
                          Administration
                        </SelectItem>
                        <SelectItem value='advertising'>Advertising</SelectItem>
                        <SelectItem value='agriculture'>Agriculture</SelectItem>
                        <SelectItem value='architecture'>
                          Architecture
                        </SelectItem>
                        <SelectItem value='artificial_intelligence'>
                          Artificial Intelligence
                        </SelectItem>
                        <SelectItem value='banking'>Banking</SelectItem>
                        <SelectItem value='biotechnology'>
                          Biotechnology
                        </SelectItem>
                        <SelectItem value='business_analysis'>
                          Business Analysis
                        </SelectItem>
                        <SelectItem value='chemistry'>Chemistry</SelectItem>
                        <SelectItem value='civil_engineering'>
                          Civil Engineering
                        </SelectItem>
                        <SelectItem value='communications'>
                          Communications
                        </SelectItem>
                        <SelectItem value='computer_science'>
                          Computer Science
                        </SelectItem>
                        <SelectItem value='construction'>
                          Construction
                        </SelectItem>
                        <SelectItem value='consulting'>Consulting</SelectItem>
                        <SelectItem value='customer_service'>
                          Customer Service
                        </SelectItem>
                        <SelectItem value='data_science'>
                          Data Science
                        </SelectItem>
                        <SelectItem value='design'>Design</SelectItem>
                        <SelectItem value='economics'>Economics</SelectItem>
                        <SelectItem value='education'>Education</SelectItem>
                        <SelectItem value='electrical_engineering'>
                          Electrical Engineering
                        </SelectItem>
                        <SelectItem value='environmental_science'>
                          Environmental Science
                        </SelectItem>
                        <SelectItem value='finance'>Finance</SelectItem>
                        <SelectItem value='healthcare'>Healthcare</SelectItem>
                        <SelectItem value='human_resources'>
                          Human Resources
                        </SelectItem>
                        <SelectItem value='information_technology'>
                          Information Technology
                        </SelectItem>
                        <SelectItem value='journalism'>Journalism</SelectItem>
                        <SelectItem value='law'>Law</SelectItem>
                        <SelectItem value='logistics'>Logistics</SelectItem>
                        <SelectItem value='management'>Management</SelectItem>
                        <SelectItem value='marketing'>Marketing</SelectItem>
                        <SelectItem value='mathematics'>Mathematics</SelectItem>
                        <SelectItem value='mechanical_engineering'>
                          Mechanical Engineering
                        </SelectItem>
                        <SelectItem value='medicine'>Medicine</SelectItem>
                        <SelectItem value='nursing'>Nursing</SelectItem>
                        <SelectItem value='operations'>Operations</SelectItem>
                        <SelectItem value='pharmacy'>Pharmacy</SelectItem>
                        <SelectItem value='physics'>Physics</SelectItem>
                        <SelectItem value='psychology'>Psychology</SelectItem>
                        <SelectItem value='public_relations'>
                          Public Relations
                        </SelectItem>
                        <SelectItem value='real_estate'>Real Estate</SelectItem>
                        <SelectItem value='research'>Research</SelectItem>
                        <SelectItem value='sales'>Sales</SelectItem>
                        <SelectItem value='social_work'>Social Work</SelectItem>
                        <SelectItem value='software_development'>
                          Software Development
                        </SelectItem>
                        <SelectItem value='statistics'>Statistics</SelectItem>
                        <SelectItem value='supply_chain'>
                          Supply Chain
                        </SelectItem>
                        <SelectItem value='training'>Training</SelectItem>
                        <SelectItem value='tourism'>Tourism</SelectItem>
                        <SelectItem value='transportation'>
                          Transportation
                        </SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='experience_years'>
                      Years of Experience
                    </Label>
                    <Input
                      id='experience_years'
                      type='number'
                      min='0'
                      max='50'
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
                        <SelectItem value='diploma'>Diploma</SelectItem>
                        <SelectItem value='certificate'>Certificate</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='university'>University/Institution</Label>
                    <Input
                      id='university'
                      value={formData.university}
                      onChange={e =>
                        handleInputChange('university', e.target.value)
                      }
                      placeholder='Enter university or institution'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='graduation_year'>Graduation Year</Label>
                    <Input
                      id='graduation_year'
                      type='number'
                      min='1950'
                      max={new Date().getFullYear()}
                      value={formData.graduation_year}
                      onChange={e =>
                        handleInputChange('graduation_year', e.target.value)
                      }
                      placeholder='Enter graduation year'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='skills'>Skills</Label>
                    <Textarea
                      id='skills'
                      value={formData.skills}
                      onChange={e =>
                        handleInputChange('skills', e.target.value)
                      }
                      placeholder='Enter skills (comma-separated)'
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
                      placeholder='Enter certifications (comma-separated)'
                      rows={3}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='rating'>Performance Rating</Label>
                    <Input
                      id='rating'
                      type='number'
                      min='0'
                      max='5'
                      step='0.1'
                      value={formData.rating}
                      onChange={e =>
                        handleInputChange('rating', e.target.value)
                      }
                      placeholder='Enter rating (0-5)'
                    />
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
                        <SelectItem value='full_time'>Full Time</SelectItem>
                        <SelectItem value='part_time'>Part Time</SelectItem>
                        <SelectItem value='contract'>Contract</SelectItem>
                        <SelectItem value='freelance'>Freelance</SelectItem>
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
                        <SelectValue placeholder='Select preferred language' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='arabic'>Arabic</SelectItem>
                        <SelectItem value='english'>English</SelectItem>
                        <SelectItem value='french'>French</SelectItem>
                        <SelectItem value='spanish'>Spanish</SelectItem>
                        <SelectItem value='german'>German</SelectItem>
                        <SelectItem value='italian'>Italian</SelectItem>
                        <SelectItem value='portuguese'>Portuguese</SelectItem>
                        <SelectItem value='russian'>Russian</SelectItem>
                        <SelectItem value='chinese'>Chinese</SelectItem>
                        <SelectItem value='japanese'>Japanese</SelectItem>
                        <SelectItem value='korean'>Korean</SelectItem>
                        <SelectItem value='hindi'>Hindi</SelectItem>
                        <SelectItem value='urdu'>Urdu</SelectItem>
                        <SelectItem value='turkish'>Turkish</SelectItem>
                        <SelectItem value='persian'>Persian</SelectItem>
                        <SelectItem value='hebrew'>Hebrew</SelectItem>
                        <SelectItem value='thai'>Thai</SelectItem>
                        <SelectItem value='vietnamese'>Vietnamese</SelectItem>
                        <SelectItem value='indonesian'>Indonesian</SelectItem>
                        <SelectItem value='malay'>Malay</SelectItem>
                        <SelectItem value='filipino'>Filipino</SelectItem>
                        <SelectItem value='swahili'>Swahili</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='timezone'>Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={value =>
                        handleInputChange('timezone', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select timezone' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='UTC-12'>
                          UTC-12 (Baker Island)
                        </SelectItem>
                        <SelectItem value='UTC-11'>UTC-11 (Samoa)</SelectItem>
                        <SelectItem value='UTC-10'>UTC-10 (Hawaii)</SelectItem>
                        <SelectItem value='UTC-9'>UTC-9 (Alaska)</SelectItem>
                        <SelectItem value='UTC-8'>
                          UTC-8 (Pacific Time)
                        </SelectItem>
                        <SelectItem value='UTC-7'>
                          UTC-7 (Mountain Time)
                        </SelectItem>
                        <SelectItem value='UTC-6'>
                          UTC-6 (Central Time)
                        </SelectItem>
                        <SelectItem value='UTC-5'>
                          UTC-5 (Eastern Time)
                        </SelectItem>
                        <SelectItem value='UTC-4'>
                          UTC-4 (Atlantic Time)
                        </SelectItem>
                        <SelectItem value='UTC-3'>UTC-3 (Brazil)</SelectItem>
                        <SelectItem value='UTC-2'>
                          UTC-2 (South Georgia)
                        </SelectItem>
                        <SelectItem value='UTC-1'>UTC-1 (Azores)</SelectItem>
                        <SelectItem value='UTC+0'>UTC+0 (London)</SelectItem>
                        <SelectItem value='UTC+1'>
                          UTC+1 (Paris, Berlin)
                        </SelectItem>
                        <SelectItem value='UTC+2'>
                          UTC+2 (Cairo, Helsinki)
                        </SelectItem>
                        <SelectItem value='UTC+3'>
                          UTC+3 (Moscow, Riyadh)
                        </SelectItem>
                        <SelectItem value='UTC+4'>
                          UTC+4 (Dubai, Baku)
                        </SelectItem>
                        <SelectItem value='UTC+5'>
                          UTC+5 (Tashkent, Karachi)
                        </SelectItem>
                        <SelectItem value='UTC+5:30'>
                          UTC+5:30 (Mumbai, New Delhi)
                        </SelectItem>
                        <SelectItem value='UTC+6'>
                          UTC+6 (Dhaka, Almaty)
                        </SelectItem>
                        <SelectItem value='UTC+7'>
                          UTC+7 (Bangkok, Jakarta)
                        </SelectItem>
                        <SelectItem value='UTC+8'>
                          UTC+8 (Beijing, Singapore)
                        </SelectItem>
                        <SelectItem value='UTC+9'>
                          UTC+9 (Tokyo, Seoul)
                        </SelectItem>
                        <SelectItem value='UTC+10'>
                          UTC+10 (Sydney, Melbourne)
                        </SelectItem>
                        <SelectItem value='UTC+11'>
                          UTC+11 (Solomon Islands)
                        </SelectItem>
                        <SelectItem value='UTC+12'>
                          UTC+12 (New Zealand)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='special_requirements'>
                      Special Requirements
                    </Label>
                    <Textarea
                      id='special_requirements'
                      value={formData.special_requirements}
                      onChange={e =>
                        handleInputChange(
                          'special_requirements',
                          e.target.value
                        )
                      }
                      placeholder='Enter any special requirements or accommodations'
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Information Tab */}
          <TabsContent value='financial' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Star className='h-5 w-5' />
                  Financial Information
                </CardTitle>
                <CardDescription>
                  Banking and financial details for payments
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='bank_name'>Bank Name</Label>
                    <Select
                      value={formData.bank_name}
                      onValueChange={value =>
                        handleInputChange('bank_name', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select bank' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='al_ahli_bank'>
                          Al Ahli Bank
                        </SelectItem>
                        <SelectItem value='al_rajhi_bank'>
                          Al Rajhi Bank
                        </SelectItem>
                        <SelectItem value='arab_national_bank'>
                          Arab National Bank
                        </SelectItem>
                        <SelectItem value='bank_al_bilad'>
                          Bank Al Bilad
                        </SelectItem>
                        <SelectItem value='bank_aljazira'>
                          Bank Aljazira
                        </SelectItem>
                        <SelectItem value='bank_albilad'>
                          Bank Albilad
                        </SelectItem>
                        <SelectItem value='bank_muscat'>Bank Muscat</SelectItem>
                        <SelectItem value='banque_saudi_fransi'>
                          Banque Saudi Fransi
                        </SelectItem>
                        <SelectItem value='citibank'>Citibank</SelectItem>
                        <SelectItem value='emirates_nbd'>
                          Emirates NBD
                        </SelectItem>
                        <SelectItem value='first_abu_dhabi_bank'>
                          First Abu Dhabi Bank
                        </SelectItem>
                        <SelectItem value='gulf_bank'>Gulf Bank</SelectItem>
                        <SelectItem value='hsbc'>HSBC</SelectItem>
                        <SelectItem value='kuwait_finance_house'>
                          Kuwait Finance House
                        </SelectItem>
                        <SelectItem value='mashreq_bank'>
                          Mashreq Bank
                        </SelectItem>
                        <SelectItem value='national_bank_of_kuwait'>
                          National Bank of Kuwait
                        </SelectItem>
                        <SelectItem value='national_commercial_bank'>
                          National Commercial Bank
                        </SelectItem>
                        <SelectItem value='qatar_national_bank'>
                          Qatar National Bank
                        </SelectItem>
                        <SelectItem value='riyad_bank'>Riyad Bank</SelectItem>
                        <SelectItem value='samba_financial_group'>
                          Samba Financial Group
                        </SelectItem>
                        <SelectItem value='saudi_british_bank'>
                          Saudi British Bank
                        </SelectItem>
                        <SelectItem value='saudi_french_bank'>
                          Saudi French Bank
                        </SelectItem>
                        <SelectItem value='saudi_investment_bank'>
                          Saudi Investment Bank
                        </SelectItem>
                        <SelectItem value='saudi_national_bank'>
                          Saudi National Bank
                        </SelectItem>
                        <SelectItem value='standard_chartered'>
                          Standard Chartered
                        </SelectItem>
                        <SelectItem value='union_national_bank'>
                          Union National Bank
                        </SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                      placeholder='Enter SWIFT/BIC code'
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
                      placeholder='Enter tax identification number'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value='settings' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='h-5 w-5' />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure notification preferences for document expiry
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='notify_days_before_id_expiry'>
                      Days before ID expiry
                    </Label>
                    <Input
                      id='notify_days_before_id_expiry'
                      type='number'
                      min='1'
                      max='365'
                      value={formData.notify_days_before_id_expiry}
                      onChange={e =>
                        handleInputChange(
                          'notify_days_before_id_expiry',
                          e.target.value
                        )
                      }
                      placeholder='90'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='notify_days_before_passport_expiry'>
                      Days before passport expiry
                    </Label>
                    <Input
                      id='notify_days_before_passport_expiry'
                      type='number'
                      min='1'
                      max='365'
                      value={formData.notify_days_before_passport_expiry}
                      onChange={e =>
                        handleInputChange(
                          'notify_days_before_passport_expiry',
                          e.target.value
                        )
                      }
                      placeholder='210'
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
            Cancel
          </Button>

          <Button 
            type='submit' 
            disabled={isLoading || Object.keys(validationErrors).length > 0} 
            className='flex-1'
            aria-label={isEditMode ? 'Save promoter changes' : 'Create new promoter'}
            aria-busy={isLoading}
          >
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
