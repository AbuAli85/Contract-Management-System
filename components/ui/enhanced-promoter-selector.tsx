'use client';

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Badge } from './badge';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Input } from './input';
import {
  Search,
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { useParties } from '@/hooks/use-parties';
import { usePromoters } from '@/hooks/use-promoters';

interface EnhancedPromoterSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function EnhancedPromoterSelector({
  value,
  onValueChange,
  placeholder = 'Select Promoter',
  disabled = false,
  className = '',
}: EnhancedPromoterSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPromoter, setSelectedPromoter] = useState<any>(null);

  const { data: promoters, isLoading: isLoadingPromoters } = usePromoters();
  const { data: parties, isLoading: isLoadingParties } = useParties();

  // Find selected promoter details
  useEffect(() => {
    if (value && promoters) {
      const promoter = promoters.find(p => p.id === value);
      setSelectedPromoter(promoter);
    } else {
      setSelectedPromoter(null);
    }
  }, [value, promoters]);

  // Filter promoters based on search term
  const filteredPromoters =
    promoters?.filter(promoter => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        promoter.name_en?.toLowerCase().includes(searchLower) ||
        promoter.name_ar?.toLowerCase().includes(searchLower) ||
        promoter.id_card_number?.toLowerCase().includes(searchLower) ||
        promoter.mobile_number?.toLowerCase().includes(searchLower)
      );
    }) || [];

  // Get employer information for a promoter
  const getEmployerInfo = (promoter: any) => {
    if (!parties || !promoter.employer_id) return null;

    const employer = parties.find(party => party.id === promoter.employer_id);
    if (!employer) return null;

    return {
      name: employer.name_en,
      nameAr: employer.name_ar,
      type: employer.type,
      contact: employer.contact_email || employer.contact_phone,
    };
  };

  // Get employer for current contract context (from form or selected employer)
  const getCurrentEmployer = () => {
    // This would need to be passed as a prop or context
    // For now, we'll look for the most recent employer assignment
    if (!parties) return null;

    const employers = parties.filter(party => party.type === 'Employer');
    return employers.length > 0 ? employers[0] : null;
  };

  const formatPromoterDisplay = (promoter: any) => {
    const employer = getEmployerInfo(promoter);
    const currentEmployer = getCurrentEmployer();

    return (
      <div className='flex flex-col space-y-1'>
        <div className='flex items-center gap-2'>
          <span className='font-medium'>{promoter.name_en}</span>
          <span className='rounded bg-gray-100 px-2 py-1 text-xs'>
            {promoter.status || 'Active'}
          </span>
        </div>
        <div className='text-sm text-muted-foreground'>
          {promoter.name_ar} • ID: {promoter.id_card_number}
        </div>
        {employer ? (
          <div className='flex items-center gap-1 text-xs text-blue-600'>
            <Building2 className='h-3 w-3' />
            {employer.name} ({employer.type})
          </div>
        ) : currentEmployer ? (
          <div className='flex items-center gap-1 text-xs text-orange-600'>
            <Building2 className='h-3 w-3' />
            Will be assigned to: {currentEmployer.name_en}
          </div>
        ) : (
          <div className='flex items-center gap-1 text-xs text-gray-500'>
            <Building2 className='h-3 w-3' />
            No employer assigned
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='space-y-2'>
      <Select onValueChange={onValueChange} value={value || ''}>
        <SelectTrigger
          disabled={disabled || isLoadingPromoters}
          className={className}
        >
          <SelectValue
            placeholder={
              isLoadingPromoters ? 'Loading promoters...' : placeholder
            }
          />
        </SelectTrigger>
        <SelectContent className='max-h-[300px] w-[400px]'>
          {/* Search Input */}
          <div className='border-b p-2'>
            <div className='relative'>
              <Search className='absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
              <Input
                placeholder='Search promoters...'
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                className='pl-8'
              />
            </div>
          </div>

          {/* Promoter List */}
          <div className='max-h-[200px] overflow-y-auto'>
            {filteredPromoters.length === 0 ? (
              <div className='p-4 text-center text-muted-foreground'>
                {searchTerm ? 'No promoters found' : 'No promoters available'}
              </div>
            ) : (
              filteredPromoters.map(promoter => (
                <SelectItem
                  key={promoter.id}
                  value={promoter.id}
                  className='p-2'
                >
                  {formatPromoterDisplay(promoter)}
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>

      {/* Selected Promoter Details */}
      {selectedPromoter && (
        <Card className='mt-2 border-green-200 bg-green-50/50'>
          <CardContent className='p-3'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='mb-1 flex items-center gap-2'>
                  <User className='h-4 w-4 text-green-600' />
                  <span className='text-sm font-medium'>
                    {selectedPromoter.name_en}
                  </span>
                  <span className='rounded bg-gray-200 px-2 py-1 text-xs'>
                    {selectedPromoter.status || 'Active'}
                  </span>
                </div>
                <div className='space-y-1 text-xs text-muted-foreground'>
                  <div>{selectedPromoter.name_ar}</div>
                  <div className='flex items-center gap-1'>
                    <Phone className='h-3 w-3' />
                    {selectedPromoter.mobile_number}
                  </div>
                  {selectedPromoter.id_card_expiry_date && (
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      ID Expires:{' '}
                      {new Date(
                        selectedPromoter.id_card_expiry_date
                      ).toLocaleDateString('en-GB')}
                    </div>
                  )}
                  {getEmployerInfo(selectedPromoter) && (
                    <div className='mt-2 flex items-center gap-1 border-t border-green-200 pt-2'>
                      <Building2 className='h-3 w-3 text-blue-600' />
                      <span className='font-medium text-blue-600'>
                        {getEmployerInfo(selectedPromoter)?.name}
                      </span>
                      <span className='text-gray-500'>
                        ({getEmployerInfo(selectedPromoter)?.type})
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={() => onValueChange('')}
                className='h-6 w-6 border-none bg-transparent p-0 text-gray-400 hover:text-gray-600'
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
