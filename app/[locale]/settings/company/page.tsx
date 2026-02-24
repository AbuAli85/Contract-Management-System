'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Palette,
  Clock,
  Calendar,
  DollarSign,
  Users,
  Save,
  Loader2,
  Upload,
  Globe,
  Phone,
  Mail,
  MapPin,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompanyData {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: Record<string, any> | null;
  business_type: string | null;
  registration_number: string | null;
  vat_number: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  brand_colors: Record<string, string> | null;
  settings: Record<string, any> | null;
}

interface Policies {
  leave: {
    annual_leave_days: number;
    sick_leave_days: number;
    carry_over_days: number;
    notice_days_required: number;
    approval_required: boolean;
  };
  attendance: {
    work_start_time: string;
    work_end_time: string;
    grace_period_minutes: number;
    overtime_multiplier: number;
    weekend_days: string[];
  };
  expenses: {
    daily_limit: number;
    monthly_limit: number;
    currency: string;
    requires_receipt_above: number;
    auto_approve_below: number;
  };
  performance: {
    review_frequency: string;
    rating_scale: number;
    self_assessment: boolean;
    goal_tracking: boolean;
  };
}

interface TeamMember {
  id: string;
  name: string;
  name_en: string | null;
  name_ar: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  avatar_url: string | null;
  type: 'promoter' | 'employee' | 'member';
  role: string | null;
  job_title?: string | null;
  department?: string | null;
  hire_date?: string | null;
  created_at: string | null;
}

export default function CompanySettingsPage() {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [policies, setPolicies] = useState<Policies | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('member');
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanyData();
    fetchPolicies();
  }, []);

  useEffect(() => {
    if (activeTab === 'team' && company) {
      fetchTeam();
    }
  }, [activeTab, company]);

  const fetchCompanyData = async () => {
    try {
      const response = await fetch('/api/company/settings', {
        cache: 'no-store',
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.company) {
          // Ensure all fields are properly initialized
          setCompany({
            ...data.company,
            description: data.company.description || null,
            website: data.company.website || null,
            email: data.company.email || null,
            phone: data.company.phone || null,
            location: data.company.location || null,
            registration_number: data.company.registration_number || null,
            vat_number: data.company.vat_number || null,
            industry: data.company.industry || null,
            brand_colors: data.company.brand_colors || null,
          });
        } else {
          setCompany(null);
        }
        setUserRole(data.user_role || 'member');
        setCanEdit(data.can_edit || false);

        if (data.message && !data.company) {
          toast({
            title: 'Info',
            description: data.message,
            variant: 'default',
          });
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load company settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      toast({
        title: 'Error',
        description: 'Failed to load company settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/company/policies');
      const data = await response.json();

      if (response.ok && data.success) {
        setPolicies(data.policies);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    }
  };

  const fetchTeam = async () => {
    setTeamLoading(true);
    try {
      const response = await fetch('/api/company/team');
      const data = await response.json();

      if (response.ok && data.success) {
        setTeam(data.team || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load team members',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
    } finally {
      setTeamLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    if (!company) return;
    setSaving(true);

    try {
      const response = await fetch('/api/company/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: company.name,
          description: company.description,
          website: company.website,
          email: company.email,
          phone: company.phone,
          industry: company.industry,
          size: company.size,
          location: company.location,
          registration_number: company.registration_number,
          vat_number: company.vat_number,
          brand_colors: company.brand_colors,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: '✅ Settings Saved',
        description: 'Company settings updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePolicies = async () => {
    if (!policies) return;
    setSaving(true);

    try {
      const response = await fetch('/api/company/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policies),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: '✅ Policies Saved',
        description: 'Company policies updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!company) {
    return (
      <Card className='max-w-lg mx-auto mt-12'>
        <CardContent className='py-12 text-center'>
          <Building2 className='h-12 w-12 mx-auto text-gray-400 mb-4' />
          <h2 className='text-xl font-semibold mb-2'>No Company Selected</h2>
          <p className='text-gray-500'>
            Please select a company from the header dropdown.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg'>
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt=''
                className='w-full h-full rounded-xl object-cover'
              />
            ) : (
              company.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className='text-2xl font-bold'>{company.name}</h1>
            <div className='flex items-center gap-2 text-gray-500'>
              <Badge variant='outline' className='capitalize'>
                {userRole}
              </Badge>
              {!canEdit && <span className='text-sm'>View only</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-6 lg:w-auto lg:inline-grid'>
          <TabsTrigger value='general' className='gap-2'>
            <Building2 className='h-4 w-4' />
            <span className='hidden sm:inline'>General</span>
          </TabsTrigger>
          <TabsTrigger value='team' className='gap-2'>
            <Users className='h-4 w-4' />
            <span className='hidden sm:inline'>Team</span>
          </TabsTrigger>
          <TabsTrigger value='branding' className='gap-2'>
            <Palette className='h-4 w-4' />
            <span className='hidden sm:inline'>Branding</span>
          </TabsTrigger>
          <TabsTrigger value='leave' className='gap-2'>
            <Calendar className='h-4 w-4' />
            <span className='hidden sm:inline'>Leave</span>
          </TabsTrigger>
          <TabsTrigger value='attendance' className='gap-2'>
            <Clock className='h-4 w-4' />
            <span className='hidden sm:inline'>Attendance</span>
          </TabsTrigger>
          <TabsTrigger value='expenses' className='gap-2'>
            <DollarSign className='h-4 w-4' />
            <span className='hidden sm:inline'>Expenses</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value='general' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Building2 className='h-5 w-5' />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic company details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Company Name *</Label>
                  <Input
                    id='name'
                    value={company.name || ''}
                    onChange={e =>
                      setCompany({ ...company, name: e.target.value })
                    }
                    disabled={!canEdit}
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='industry'>Industry</Label>
                  <Select
                    value={company.industry || ''}
                    onValueChange={v => setCompany({ ...company, industry: v })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select industry' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='technology'>Technology</SelectItem>
                      <SelectItem value='retail'>Retail</SelectItem>
                      <SelectItem value='marketing'>Marketing</SelectItem>
                      <SelectItem value='events'>Events</SelectItem>
                      <SelectItem value='hospitality'>Hospitality</SelectItem>
                      <SelectItem value='healthcare'>Healthcare</SelectItem>
                      <SelectItem value='education'>Education</SelectItem>
                      <SelectItem value='finance'>Finance</SelectItem>
                      <SelectItem value='other'>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2 md:col-span-2'>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    value={company.description || ''}
                    onChange={e =>
                      setCompany({ ...company, description: e.target.value })
                    }
                    disabled={!canEdit}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='email' className='flex items-center gap-2'>
                    <Mail className='h-4 w-4' /> Email
                  </Label>
                  <Input
                    id='email'
                    type='email'
                    value={company.email || ''}
                    onChange={e =>
                      setCompany({ ...company, email: e.target.value })
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='phone' className='flex items-center gap-2'>
                    <Phone className='h-4 w-4' /> Phone
                  </Label>
                  <Input
                    id='phone'
                    value={company.phone || ''}
                    onChange={e =>
                      setCompany({ ...company, phone: e.target.value })
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='website' className='flex items-center gap-2'>
                    <Globe className='h-4 w-4' /> Website
                  </Label>
                  <Input
                    id='website'
                    value={company.website || ''}
                    onChange={e =>
                      setCompany({ ...company, website: e.target.value })
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='location' className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4' /> Location
                  </Label>
                  <Input
                    id='location'
                    value={company.location || ''}
                    onChange={e =>
                      setCompany({ ...company, location: e.target.value })
                    }
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <Separator />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label
                    htmlFor='registration_number'
                    className='flex items-center gap-2'
                  >
                    <FileText className='h-4 w-4' /> CR Number
                  </Label>
                  <Input
                    id='registration_number'
                    value={company.registration_number || ''}
                    onChange={e =>
                      setCompany({
                        ...company,
                        registration_number: e.target.value,
                      })
                    }
                    disabled={!canEdit}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='vat_number'>VAT Number</Label>
                  <Input
                    id='vat_number'
                    value={company.vat_number || ''}
                    onChange={e =>
                      setCompany({ ...company, vat_number: e.target.value })
                    }
                    disabled={!canEdit}
                  />
                </div>
              </div>

              {canEdit && (
                <div className='flex justify-end'>
                  <Button onClick={handleSaveGeneral} disabled={saving}>
                    {saving && (
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    )}
                    <Save className='h-4 w-4 mr-2' />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value='branding' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Palette className='h-5 w-5' />
                Brand Colors
              </CardTitle>
              <CardDescription>
                Customize your company's visual identity
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='space-y-2'>
                  <Label>Primary Color</Label>
                  <div className='flex gap-2'>
                    <Input
                      type='color'
                      value={company.brand_colors?.primary || '#3b82f6'}
                      onChange={e =>
                        setCompany({
                          ...company,
                          brand_colors: {
                            ...company.brand_colors,
                            primary: e.target.value,
                          },
                        })
                      }
                      disabled={!canEdit}
                      className='w-12 h-10 p-1'
                    />
                    <Input
                      value={company.brand_colors?.primary || '#3b82f6'}
                      onChange={e =>
                        setCompany({
                          ...company,
                          brand_colors: {
                            ...company.brand_colors,
                            primary: e.target.value,
                          },
                        })
                      }
                      disabled={!canEdit}
                      className='flex-1'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>Secondary Color</Label>
                  <div className='flex gap-2'>
                    <Input
                      type='color'
                      value={company.brand_colors?.secondary || '#6366f1'}
                      onChange={e =>
                        setCompany({
                          ...company,
                          brand_colors: {
                            ...company.brand_colors,
                            secondary: e.target.value,
                          },
                        })
                      }
                      disabled={!canEdit}
                      className='w-12 h-10 p-1'
                    />
                    <Input
                      value={company.brand_colors?.secondary || '#6366f1'}
                      onChange={e =>
                        setCompany({
                          ...company,
                          brand_colors: {
                            ...company.brand_colors,
                            secondary: e.target.value,
                          },
                        })
                      }
                      disabled={!canEdit}
                      className='flex-1'
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                <Label>Company Logo</Label>
                <div className='flex items-center gap-4'>
                  <div className='h-24 w-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50'>
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt=''
                        className='w-full h-full rounded-xl object-cover'
                      />
                    ) : (
                      <Upload className='h-8 w-8 text-gray-400' />
                    )}
                  </div>
                  {canEdit && (
                    <div className='space-y-2'>
                      <Input
                        placeholder='Logo URL'
                        value={company.logo_url || ''}
                        onChange={e =>
                          setCompany({ ...company, logo_url: e.target.value })
                        }
                      />
                      <p className='text-xs text-gray-500'>
                        Enter a URL or upload to Supabase Storage
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className='flex justify-end'>
                  <Button onClick={handleSaveGeneral} disabled={saving}>
                    {saving && (
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    )}
                    <Save className='h-4 w-4 mr-2' />
                    Save Branding
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Members */}
        <TabsContent value='team' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Company Team
              </CardTitle>
              <CardDescription>
                View employees, promoters, and candidates associated with this
                company
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='h-8 w-8 animate-spin text-primary' />
                </div>
              ) : team.length === 0 ? (
                <div className='text-center py-12'>
                  <Users className='h-12 w-12 mx-auto text-gray-400 mb-4' />
                  <h3 className='text-lg font-semibold mb-2'>
                    No Team Members
                  </h3>
                  <p className='text-gray-500'>
                    No employees, promoters, or candidates are currently
                    associated with this company.
                  </p>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='text-sm text-gray-500'>
                      {team.length} {team.length === 1 ? 'member' : 'members'}{' '}
                      total
                    </div>
                  </div>
                  <div className='grid gap-4'>
                    {team.map((member: TeamMember) => (
                      <div
                        key={member.id}
                        className='flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors'
                      >
                        <div className='h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0'>
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className='h-full w-full rounded-full object-cover'
                            />
                          ) : (
                            member.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          )}
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center gap-2 mb-1'>
                            <h4 className='font-semibold text-lg'>
                              {member.name}
                            </h4>
                            <Badge
                              variant={
                                member.type === 'promoter'
                                  ? 'default'
                                  : member.type === 'employee'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className='text-xs'
                            >
                              {member.type === 'promoter'
                                ? 'Promoter'
                                : member.type === 'employee'
                                  ? 'Employee'
                                  : 'Member'}
                            </Badge>
                            {member.role && (
                              <Badge
                                variant='outline'
                                className='text-xs capitalize'
                              >
                                {member.role}
                              </Badge>
                            )}
                            <Badge
                              variant={
                                member.status === 'active'
                                  ? 'default'
                                  : member.status === 'terminated'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className='text-xs'
                            >
                              {member.status || 'active'}
                            </Badge>
                          </div>
                          <div className='flex flex-wrap items-center gap-4 text-sm text-gray-500'>
                            {member.email && (
                              <div className='flex items-center gap-1'>
                                <Mail className='h-3 w-3' />
                                <span className='truncate'>{member.email}</span>
                              </div>
                            )}
                            {member.phone && (
                              <div className='flex items-center gap-1'>
                                <Phone className='h-3 w-3' />
                                <span>{member.phone}</span>
                              </div>
                            )}
                            {member.job_title && (
                              <div className='flex items-center gap-1'>
                                <FileText className='h-3 w-3' />
                                <span>{member.job_title}</span>
                                {member.department && (
                                  <span> • {member.department}</span>
                                )}
                              </div>
                            )}
                            {member.hire_date && (
                              <div className='flex items-center gap-1'>
                                <Calendar className='h-3 w-3' />
                                <span>
                                  Hired:{' '}
                                  {new Date(
                                    member.hire_date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Policies */}
        <TabsContent value='leave' className='space-y-6'>
          {policies && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Calendar className='h-5 w-5' />
                  Leave Policies
                </CardTitle>
                <CardDescription>
                  Configure leave entitlements and rules
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  <div className='space-y-2'>
                    <Label>Annual Leave Days</Label>
                    <Input
                      type='number'
                      value={policies.leave.annual_leave_days}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          leave: {
                            ...policies.leave,
                            annual_leave_days: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Sick Leave Days</Label>
                    <Input
                      type='number'
                      value={policies.leave.sick_leave_days}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          leave: {
                            ...policies.leave,
                            sick_leave_days: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Carry-Over Days</Label>
                    <Input
                      type='number'
                      value={policies.leave.carry_over_days}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          leave: {
                            ...policies.leave,
                            carry_over_days: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Notice Days Required</Label>
                    <Input
                      type='number'
                      value={policies.leave.notice_days_required}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          leave: {
                            ...policies.leave,
                            notice_days_required: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className='flex items-center justify-between space-x-2 p-4 border rounded-lg'>
                    <Label>Require Approval</Label>
                    <Switch
                      checked={policies.leave.approval_required}
                      onCheckedChange={v =>
                        setPolicies({
                          ...policies,
                          leave: { ...policies.leave, approval_required: v },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className='flex justify-end'>
                    <Button onClick={handleSavePolicies} disabled={saving}>
                      {saving && (
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                      )}
                      <Save className='h-4 w-4 mr-2' />
                      Save Leave Policies
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance Policies */}
        <TabsContent value='attendance' className='space-y-6'>
          {policies && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5' />
                  Attendance Policies
                </CardTitle>
                <CardDescription>
                  Configure work hours and attendance rules
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label>Work Start Time</Label>
                    <Input
                      type='time'
                      value={policies.attendance.work_start_time}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          attendance: {
                            ...policies.attendance,
                            work_start_time: e.target.value,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Work End Time</Label>
                    <Input
                      type='time'
                      value={policies.attendance.work_end_time}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          attendance: {
                            ...policies.attendance,
                            work_end_time: e.target.value,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Grace Period (minutes)</Label>
                    <Input
                      type='number'
                      value={policies.attendance.grace_period_minutes}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          attendance: {
                            ...policies.attendance,
                            grace_period_minutes: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Overtime Multiplier</Label>
                    <Input
                      type='number'
                      step='0.1'
                      value={policies.attendance.overtime_multiplier}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          attendance: {
                            ...policies.attendance,
                            overtime_multiplier:
                              parseFloat(e.target.value) || 1,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className='flex justify-end'>
                    <Button onClick={handleSavePolicies} disabled={saving}>
                      {saving && (
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                      )}
                      <Save className='h-4 w-4 mr-2' />
                      Save Attendance Policies
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Expense Policies */}
        <TabsContent value='expenses' className='space-y-6'>
          {policies && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <DollarSign className='h-5 w-5' />
                  Expense Policies
                </CardTitle>
                <CardDescription>
                  Configure expense limits and approval rules
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label>Daily Limit</Label>
                    <Input
                      type='number'
                      value={policies.expenses.daily_limit}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          expenses: {
                            ...policies.expenses,
                            daily_limit: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Monthly Limit</Label>
                    <Input
                      type='number'
                      value={policies.expenses.monthly_limit}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          expenses: {
                            ...policies.expenses,
                            monthly_limit: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Currency</Label>
                    <Select
                      value={policies.expenses.currency}
                      onValueChange={v =>
                        setPolicies({
                          ...policies,
                          expenses: { ...policies.expenses, currency: v },
                        })
                      }
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='OMR'>OMR - Omani Rial</SelectItem>
                        <SelectItem value='USD'>USD - US Dollar</SelectItem>
                        <SelectItem value='AED'>AED - UAE Dirham</SelectItem>
                        <SelectItem value='SAR'>SAR - Saudi Riyal</SelectItem>
                        <SelectItem value='EUR'>EUR - Euro</SelectItem>
                        <SelectItem value='GBP'>GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Requires Receipt Above</Label>
                    <Input
                      type='number'
                      value={policies.expenses.requires_receipt_above}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          expenses: {
                            ...policies.expenses,
                            requires_receipt_above:
                              parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Auto-Approve Below</Label>
                    <Input
                      type='number'
                      value={policies.expenses.auto_approve_below}
                      onChange={e =>
                        setPolicies({
                          ...policies,
                          expenses: {
                            ...policies.expenses,
                            auto_approve_below: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>
                </div>

                {canEdit && (
                  <div className='flex justify-end'>
                    <Button onClick={handleSavePolicies} disabled={saving}>
                      {saving && (
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                      )}
                      <Save className='h-4 w-4 mr-2' />
                      Save Expense Policies
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
