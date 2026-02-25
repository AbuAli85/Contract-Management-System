'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Building2,
  Plus,
  Search,
  User,
  MapPin,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { DashboardPromoter } from './types';

interface Party {
  id: string;
  name_en: string;
  name_ar?: string | null;
  type: 'Employer' | 'Client' | 'Generic';
  status: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  address_en?: string | null;
  crn?: string | null;
}

interface PartyAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  promoter: DashboardPromoter | null;
  onAssignmentUpdate: (promoterId: string, partyId: string | null) => void;
}

export function PartyAssignmentDialog({
  isOpen,
  onClose,
  promoter,
  onAssignmentUpdate,
}: PartyAssignmentDialogProps) {
  const [parties, setParties] = useState<Party[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNewPartyForm, setShowNewPartyForm] = useState(false);
  const [newPartyData, setNewPartyData] = useState({
    name_en: '',
    name_ar: '',
    type: 'Employer' as 'Employer' | 'Client' | 'Generic',
    contact_email: '',
    contact_phone: '',
    address_en: '',
  });

  const { toast } = useToast();

  // Load parties when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadParties();
      setSelectedPartyId(promoter?.employer_id || null);
    }
  }, [isOpen, promoter]);

  const loadParties = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      const { data, error } = await supabase
        .from('parties')
        .select(
          'id, name_en, name_ar, type, status, contact_email, contact_phone, address_en, crn'
        )
        .in('type', ['Employer', 'Client'])
        .eq('status', 'Active')
        .order('name_en');

      if (error) throw error;
      setParties(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load parties. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter parties based on search term
  const filteredParties = parties.filter(party => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (party.name_en ?? '').toLowerCase().includes(searchLower) ||
      party.name_ar?.toLowerCase().includes(searchLower) ||
      party.crn?.toLowerCase().includes(searchLower)
    );
  });

  const handleAssignmentSave = async () => {
    if (!promoter) return;

    setIsUpdating(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      const { error } = await supabase
        .from('promoters')
        .update({
          employer_id: selectedPartyId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promoter.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: selectedPartyId
          ? 'Party assignment updated successfully'
          : 'Promoter unassigned from party',
      });

      onAssignmentUpdate(promoter.id, selectedPartyId);
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update party assignment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNewPartyCreate = async () => {
    if (!(newPartyData.name_en ?? '').trim()) {
      toast({
        title: 'Validation Error',
        description: 'Party name is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      const { data, error } = await supabase
        .from('parties')
        .insert([
          {
            ...newPartyData,
            status: 'Active',
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: `New party "${data.name_en}" created successfully.`,
      });

      // Add to parties list and select it
      setParties(prev => [...prev, data]);
      setSelectedPartyId(data.id);
      setShowNewPartyForm(false);
      setNewPartyData({
        name_en: '',
        name_ar: '',
        type: 'Employer',
        contact_email: '',
        contact_phone: '',
        address_en: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new party. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedParty = parties.find(p => p.id === selectedPartyId);
  const currentParty = parties.find(p => p.id === promoter?.employer_id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Building2 className='h-5 w-5' />
            Manage Party Assignment
          </DialogTitle>
          <DialogDescription>
            {promoter ? (
              <>
                Assign <strong>{promoter.displayName}</strong> to a company or
                organization
              </>
            ) : (
              'Select a party to assign the promoter to'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Current Assignment Status */}
          {promoter && (
            <div className='p-4 bg-slate-50 rounded-lg'>
              <h4 className='font-medium text-sm text-slate-700 mb-2'>
                Current Assignment
              </h4>
              {currentParty ? (
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center'>
                      <Building2 className='h-4 w-4 text-blue-600' />
                    </div>
                    <div>
                      <p className='font-medium text-sm'>
                        {currentParty.name_en}
                      </p>
                      {currentParty.name_ar && (
                        <p className='text-xs text-slate-500'>
                          {currentParty.name_ar}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant='secondary'>{currentParty.type}</Badge>
                </div>
              ) : (
                <div className='flex items-center gap-2 text-slate-500'>
                  <AlertCircle className='h-4 w-4' />
                  <span className='text-sm'>No party assigned</span>
                </div>
              )}
            </div>
          )}

          {!showNewPartyForm ? (
            <>
              {/* Search and Select Existing Party */}
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h4 className='font-medium'>Select Party</h4>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setShowNewPartyForm(true)}
                    className='flex items-center gap-2'
                  >
                    <Plus className='h-4 w-4' />
                    New Party
                  </Button>
                </div>

                {/* Search */}
                <div className='relative'>
                  <Search className='absolute left-3 top-3 h-4 w-4 text-slate-400' />
                  <Input
                    placeholder='Search parties by name or CRN...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>

                {/* Party List */}
                <div className='space-y-2 max-h-64 overflow-y-auto'>
                  {isLoading ? (
                    <div className='flex items-center justify-center py-8'>
                      <Loader2 className='h-6 w-6 animate-spin' />
                    </div>
                  ) : filteredParties.length === 0 ? (
                    <div className='text-center py-8 text-slate-500'>
                      <Building2 className='h-8 w-8 mx-auto mb-2 opacity-50' />
                      <p>No parties found</p>
                      {searchTerm && (
                        <p className='text-sm'>
                          Try adjusting your search terms
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Unassign Option */}
                      <div
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPartyId === null
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedPartyId(null)}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-3'>
                            <div className='h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center'>
                              <X className='h-4 w-4 text-slate-500' />
                            </div>
                            <div>
                              <p className='font-medium text-sm'>Unassigned</p>
                              <p className='text-xs text-slate-500'>
                                Remove party assignment
                              </p>
                            </div>
                          </div>
                          {selectedPartyId === null && (
                            <Check className='h-4 w-4 text-blue-600' />
                          )}
                        </div>
                      </div>

                      {/* Party Options */}
                      {filteredParties.map(party => (
                        <div
                          key={party.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedPartyId === party.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => setSelectedPartyId(party.id)}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <div className='h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center'>
                                <Building2 className='h-4 w-4 text-blue-600' />
                              </div>
                              <div className='min-w-0 flex-1'>
                                <p className='font-medium text-sm truncate'>
                                  {party.name_en}
                                </p>
                                {party.name_ar && (
                                  <p className='text-xs text-slate-500 truncate'>
                                    {party.name_ar}
                                  </p>
                                )}
                                <div className='flex items-center gap-2 mt-1'>
                                  <Badge variant='outline' className='text-xs'>
                                    {party.type}
                                  </Badge>
                                  {party.crn && (
                                    <span className='text-xs text-slate-400'>
                                      CRN: {party.crn}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {selectedPartyId === party.id && (
                              <Check className='h-4 w-4 text-blue-600 flex-shrink-0' />
                            )}
                          </div>

                          {/* Contact Info */}
                          {(party.contact_email || party.contact_phone) && (
                            <div className='mt-2 pl-11 text-xs text-slate-500 space-y-1'>
                              {party.contact_email && (
                                <div className='flex items-center gap-1'>
                                  <Mail className='h-3 w-3' />
                                  {party.contact_email}
                                </div>
                              )}
                              {party.contact_phone && (
                                <div className='flex items-center gap-1'>
                                  <Phone className='h-3 w-3' />
                                  {party.contact_phone}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* New Party Form */
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h4 className='font-medium'>Create New Party</h4>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setShowNewPartyForm(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='name_en'>Name (English) *</Label>
                  <Input
                    id='name_en'
                    value={newPartyData.name_en}
                    onChange={e =>
                      setNewPartyData(prev => ({
                        ...prev,
                        name_en: e.target.value,
                      }))
                    }
                    placeholder='Company name in English'
                  />
                </div>
                <div>
                  <Label htmlFor='name_ar'>Name (Arabic)</Label>
                  <Input
                    id='name_ar'
                    value={newPartyData.name_ar}
                    onChange={e =>
                      setNewPartyData(prev => ({
                        ...prev,
                        name_ar: e.target.value,
                      }))
                    }
                    placeholder='Company name in Arabic'
                  />
                </div>
                <div>
                  <Label htmlFor='type'>Type</Label>
                  <Select
                    value={newPartyData.type}
                    onValueChange={value =>
                      setNewPartyData(prev => ({
                        ...prev,
                        type: value as 'Employer' | 'Client' | 'Generic',
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Employer'>Employer</SelectItem>
                      <SelectItem value='Client'>Client</SelectItem>
                      <SelectItem value='Generic'>Generic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='contact_email'>Contact Email</Label>
                  <Input
                    id='contact_email'
                    type='email'
                    value={newPartyData.contact_email}
                    onChange={e =>
                      setNewPartyData(prev => ({
                        ...prev,
                        contact_email: e.target.value,
                      }))
                    }
                    placeholder='contact@company.com'
                  />
                </div>
                <div>
                  <Label htmlFor='contact_phone'>Contact Phone</Label>
                  <Input
                    id='contact_phone'
                    value={newPartyData.contact_phone}
                    onChange={e =>
                      setNewPartyData(prev => ({
                        ...prev,
                        contact_phone: e.target.value,
                      }))
                    }
                    placeholder='+968 1234 5678'
                  />
                </div>
                <div className='md:col-span-2'>
                  <Label htmlFor='address_en'>Address</Label>
                  <Textarea
                    id='address_en'
                    value={newPartyData.address_en}
                    onChange={e =>
                      setNewPartyData(prev => ({
                        ...prev,
                        address_en: e.target.value,
                      }))
                    }
                    placeholder='Company address'
                    rows={2}
                  />
                </div>
              </div>

              <div className='flex gap-2'>
                <Button
                  onClick={handleNewPartyCreate}
                  disabled={isUpdating || !(newPartyData.name_en ?? '').trim()}
                  className='flex-1'
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className='h-4 w-4 mr-2' />
                      Create Party
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isUpdating}>
            Cancel
          </Button>
          {!showNewPartyForm && (
            <Button onClick={handleAssignmentSave} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Updating...
                </>
              ) : (
                'Save Assignment'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
