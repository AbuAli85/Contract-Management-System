import * as z from 'zod';

// Phone number validation regex (supports international formats)
const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

// Email validation
const emailSchema = z.string().email('Please enter a valid email address');

// Phone validation
const phoneSchema = z.string().regex(phoneRegex, 'Please enter a valid phone number');

export const contractFormSchema = z.object({
  // Party selections
  promoter_id: z.string().min(1, 'Please select a promoter'),
  first_party_id: z.string().min(1, 'Please select the first party (client)'),
  second_party_id: z.string().min(1, 'Please select the second party (employer)'),
  
  // Contract details
  contract_type: z.string().min(1, 'Please select a contract type'),
  job_title: z.string().min(2, 'Job title must be at least 2 characters').max(100, 'Job title must be less than 100 characters'),
  department: z.string().min(2, 'Department must be at least 2 characters').max(100, 'Department must be less than 100 characters'),
  work_location: z.string().min(2, 'Work location must be at least 2 characters').max(200, 'Work location must be less than 200 characters'),
  
  // Financial details
  basic_salary: z.number().positive('Basic salary must be greater than 0').max(1000000, 'Please enter a valid salary amount'),
  housing_allowance: z.number().min(0, 'Allowance cannot be negative').optional(),
  transport_allowance: z.number().min(0, 'Allowance cannot be negative').optional(),
  
  // Dates
  contract_start_date: z.string().min(1, 'Please select a start date'),
  contract_end_date: z.string().min(1, 'Please select an end date'),
  
  // Work terms
  probation_period: z.string().min(1, 'Please select a probation period'),
  notice_period: z.string().min(1, 'Please select a notice period'),
  working_hours: z.string().min(1, 'Please select working hours'),
  
  // Optional fields
  special_terms: z.string().optional(),
}).refine((data) => {
  // Ensure end date is after start date
  if (data.contract_start_date && data.contract_end_date) {
    const startDate = new Date(data.contract_start_date);
    const endDate = new Date(data.contract_end_date);
    return endDate > startDate;
  }
  return true;
}, {
  message: 'Contract end date must be after start date',
  path: ['contract_end_date'],
});

export type ContractFormData = z.infer<typeof contractFormSchema>;

// Default values for the form
export const contractFormDefaults: Partial<ContractFormData> = {
  promoter_id: '',
  first_party_id: '',
  second_party_id: '',
  contract_type: 'full-time-permanent',
  job_title: '',
  department: '',
  work_location: '',
  basic_salary: 0,
  contract_start_date: '',
  contract_end_date: '',
  special_terms: '',
  probation_period: '3_months',
  notice_period: '30_days',
  working_hours: '40_hours',
  housing_allowance: 0,
  transport_allowance: 0,
};

