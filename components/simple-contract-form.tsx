'use client';

import React, { useState } from 'react';
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
import { FileText, Plus, Save, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SimpleContractForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contractType: '',
    firstParty: '',
    secondParty: '',
    promoter: '',
    jobTitle: '',
    workLocation: '',
    department: '',
    startDate: '',
    endDate: '',
    basicSalary: '',
    currency: 'OMR',
    email: '',
    specialTerms: '',
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate contract generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: '✅ Contract Generated Successfully',
        description: 'Your contract has been created and saved to the system.',
      });

      // Reset form
      setFormData({
        contractType: '',
        firstParty: '',
        secondParty: '',
        promoter: '',
        jobTitle: '',
        workLocation: '',
        department: '',
        startDate: '',
        endDate: '',
        basicSalary: '',
        currency: 'OMR',
        email: '',
        specialTerms: '',
      });
    } catch (error) {
      toast({
        title: '❌ Generation Failed',
        description:
          'There was an error generating the contract. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Generate New Contract
          </CardTitle>
          <CardDescription>
            Create a professional employment contract with all required details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Contract Type */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='contractType'>Contract Type *</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={value =>
                    handleInputChange('contractType', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select contract type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='full-time'>
                      Full-Time Permanent Employment
                    </SelectItem>
                    <SelectItem value='part-time'>
                      Part-Time Contract
                    </SelectItem>
                    <SelectItem value='fixed-term'>
                      Fixed-Term Contract
                    </SelectItem>
                    <SelectItem value='consulting'>
                      Consulting Agreement
                    </SelectItem>
                    <SelectItem value='freelance'>
                      Freelance Service Agreement
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='currency'>Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={value => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='OMR'>OMR (Omani Rial)</SelectItem>
                    <SelectItem value='USD'>USD (US Dollar)</SelectItem>
                    <SelectItem value='EUR'>EUR (Euro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Parties */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='firstParty'>First Party (Employer) *</Label>
                <Input
                  id='firstParty'
                  value={formData.firstParty}
                  onChange={e =>
                    handleInputChange('firstParty', e.target.value)
                  }
                  placeholder='Enter employer name'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='secondParty'>Second Party (Employee) *</Label>
                <Input
                  id='secondParty'
                  value={formData.secondParty}
                  onChange={e =>
                    handleInputChange('secondParty', e.target.value)
                  }
                  placeholder='Enter employee name'
                  required
                />
              </div>
            </div>

            {/* Promoter */}
            <div className='space-y-2'>
              <Label htmlFor='promoter'>Promoter/Manager</Label>
              <Input
                id='promoter'
                value={formData.promoter}
                onChange={e => handleInputChange('promoter', e.target.value)}
                placeholder='Enter promoter or manager name'
              />
            </div>

            {/* Job Details */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='jobTitle'>Job Title *</Label>
                <Input
                  id='jobTitle'
                  value={formData.jobTitle}
                  onChange={e => handleInputChange('jobTitle', e.target.value)}
                  placeholder='e.g., Software Engineer'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='workLocation'>Work Location</Label>
                <Input
                  id='workLocation'
                  value={formData.workLocation}
                  onChange={e =>
                    handleInputChange('workLocation', e.target.value)
                  }
                  placeholder='e.g., Muscat, Oman'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='department'>Department</Label>
                <Input
                  id='department'
                  value={formData.department}
                  onChange={e =>
                    handleInputChange('department', e.target.value)
                  }
                  placeholder='e.g., IT Department'
                />
              </div>
            </div>

            {/* Dates */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='startDate'>Start Date *</Label>
                <Input
                  id='startDate'
                  type='date'
                  value={formData.startDate}
                  onChange={e => handleInputChange('startDate', e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='endDate'>End Date</Label>
                <Input
                  id='endDate'
                  type='date'
                  value={formData.endDate}
                  onChange={e => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Salary */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='basicSalary'>Basic Salary *</Label>
                <Input
                  id='basicSalary'
                  type='number'
                  value={formData.basicSalary}
                  onChange={e =>
                    handleInputChange('basicSalary', e.target.value)
                  }
                  placeholder='Enter basic salary'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>Contact Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder='Enter contact email'
                />
              </div>
            </div>

            {/* Special Terms */}
            <div className='space-y-2'>
              <Label htmlFor='specialTerms'>Special Terms & Conditions</Label>
              <Textarea
                id='specialTerms'
                value={formData.specialTerms}
                onChange={e =>
                  handleInputChange('specialTerms', e.target.value)
                }
                placeholder='Enter any special terms, conditions, or additional clauses...'
                rows={4}
              />
            </div>

            {/* Submit Buttons */}
            <div className='flex justify-end gap-4 pt-6'>
              <Button type='button' variant='outline'>
                <Download className='h-4 w-4 mr-2' />
                Preview
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className='h-4 w-4 mr-2' />
                    Generate Contract
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
