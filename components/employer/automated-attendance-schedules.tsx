'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Bell,
  Users,
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Play,
  Pause,
  Mail,
  Smartphone,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GoogleLocationPicker } from './google-location-picker';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeScheduleSelector } from './employee-schedule-selector';

interface AttendanceSchedule {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  office_location_id?: string;
  target_latitude?: number;
  target_longitude?: number;
  allowed_radius_meters: number;
  check_in_time: string;
  check_out_time?: string;
  link_valid_duration_hours: number;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  send_check_in_link: boolean;
  send_check_out_link: boolean;
  notification_method: string[];
  send_before_minutes: number;
  send_to_all_employees: boolean;
  specific_employee_ids?: string[];
  max_uses_per_link?: number;
  require_photo: boolean;
  require_location_verification: boolean;
  last_generated_at?: string;
  last_sent_at?: string;
  next_generation_date?: string;
  total_links_generated: number;
  total_notifications_sent: number;
  created_at: string;
  office_location?: {
    id: string;
    name: string;
    address: string;
  };
}

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export function AutomatedAttendanceSchedules() {
  const [schedules, setSchedules] = useState<AttendanceSchedule[]>([]);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AttendanceSchedule | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    office_location_id: '',
    target_latitude: '',
    target_longitude: '',
    allowed_radius_meters: '50',
    check_in_time: '09:00',
    check_out_time: '',
    link_valid_duration_hours: '2',
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    send_check_in_link: true,
    send_check_out_link: false,
    notification_method: ['email'] as string[],
      send_before_minutes: '15',
      send_to_all_employees: true,
      specific_employee_ids: [],
      employee_group_ids: [],
      assignment_type: 'all',
      max_uses_per_link: '',
    require_photo: true,
    require_location_verification: true,
  });

  const [googleLocation, setGoogleLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [locationSource, setLocationSource] = useState<'office' | 'google' | 'custom'>('office');

  useEffect(() => {
    fetchSchedules();
    fetchOfficeLocations();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employer/attendance-schedules');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch schedules');
      }

      setSchedules(data.schedules || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficeLocations = async () => {
    try {
      const response = await fetch('/api/employer/office-locations');
      const data = await response.json();

      if (response.ok && data.locations) {
        setOfficeLocations(data.locations);
      }
    } catch (error) {
      console.error('Error fetching office locations:', error);
    }
  };

  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
    name?: string;
  }) => {
    setGoogleLocation(location);
    setFormData(prev => ({
      ...prev,
      target_latitude: location.latitude.toString(),
      target_longitude: location.longitude.toString(),
    }));
    if (location.name) {
      setFormData(prev => ({ ...prev, name: location.name || prev.name }));
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      [day]: !prev[day as keyof typeof prev],
    }));
  };

  const handleNotificationMethodToggle = (method: string) => {
    setFormData(prev => {
      const methods = prev.notification_method || [];
      if (methods.includes(method)) {
        return {
          ...prev,
          notification_method: methods.filter(m => m !== method),
        };
      } else {
        return {
          ...prev,
          notification_method: [...methods, method],
        };
      }
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Schedule name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.check_in_time) {
      toast({
        title: 'Validation Error',
        description: 'Check-in time is required',
        variant: 'destructive',
      });
      return;
    }

    // Location validation
    if (locationSource === 'office' && !formData.office_location_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select an office location',
        variant: 'destructive',
      });
      return;
    }

    if ((locationSource === 'google' || locationSource === 'custom') && 
        (!formData.target_latitude || !formData.target_longitude)) {
      toast({
        title: 'Validation Error',
        description: 'Please select or enter a location',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        ...formData,
        office_location_id: locationSource === 'office' ? formData.office_location_id : null,
        target_latitude: locationSource !== 'office' ? parseFloat(formData.target_latitude) : null,
        target_longitude: locationSource !== 'office' ? parseFloat(formData.target_longitude) : null,
        allowed_radius_meters: parseInt(formData.allowed_radius_meters),
        link_valid_duration_hours: parseInt(formData.link_valid_duration_hours),
        send_before_minutes: parseInt(formData.send_before_minutes),
        max_uses_per_link: formData.max_uses_per_link ? parseInt(formData.max_uses_per_link) : null,
        specific_employee_ids: formData.assignment_type === 'selected' ? formData.specific_employee_ids : [],
        employee_group_ids: formData.assignment_type === 'groups' || formData.assignment_type === 'location_based' ? formData.employee_group_ids : [],
        assignment_type: formData.assignment_type,
        send_to_all_employees: formData.assignment_type === 'all',
      };

      const url = editingSchedule
        ? `/api/employer/attendance-schedules/${editingSchedule.id}`
        : '/api/employer/attendance-schedules';
      
      const method = editingSchedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save schedule');
      }

      toast({
        title: 'Success',
        description: editingSchedule 
          ? 'Schedule updated successfully' 
          : 'Schedule created successfully',
      });

      setShowCreateDialog(false);
      setEditingSchedule(null);
      resetForm();
      fetchSchedules();
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

  const handleEdit = (schedule: AttendanceSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      office_location_id: schedule.office_location_id || '',
      target_latitude: schedule.target_latitude?.toString() || '',
      target_longitude: schedule.target_longitude?.toString() || '',
      allowed_radius_meters: schedule.allowed_radius_meters.toString(),
      check_in_time: schedule.check_in_time,
      check_out_time: schedule.check_out_time || '',
      link_valid_duration_hours: schedule.link_valid_duration_hours.toString(),
      monday: schedule.monday,
      tuesday: schedule.tuesday,
      wednesday: schedule.wednesday,
      thursday: schedule.thursday,
      friday: schedule.friday,
      saturday: schedule.saturday,
      sunday: schedule.sunday,
      send_check_in_link: schedule.send_check_in_link,
      send_check_out_link: schedule.send_check_out_link,
      notification_method: schedule.notification_method || ['email'],
      send_before_minutes: schedule.send_before_minutes.toString(),
      send_to_all_employees: schedule.send_to_all_employees,
      max_uses_per_link: schedule.max_uses_per_link?.toString() || '',
      require_photo: schedule.require_photo,
      require_location_verification: schedule.require_location_verification,
    });

    if (schedule.office_location_id) {
      setLocationSource('office');
    } else if (schedule.target_latitude && schedule.target_longitude) {
      setLocationSource('google');
      setGoogleLocation({
        latitude: schedule.target_latitude,
        longitude: schedule.target_longitude,
        address: '',
      });
    }

    setShowCreateDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/employer/attendance-schedules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
      });

      fetchSchedules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (schedule: AttendanceSchedule) => {
    try {
      const response = await fetch(`/api/employer/attendance-schedules/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !schedule.is_active }),
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }

      toast({
        title: 'Success',
        description: schedule.is_active 
          ? 'Schedule deactivated' 
          : 'Schedule activated',
      });

      fetchSchedules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleManualTrigger = async (scheduleId: string) => {
    try {
      const response = await fetch('/api/cron/generate-attendance-links');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger generation');
      }

      toast({
        title: 'Success',
        description: 'Links generated successfully. Check notifications.',
      });

      fetchSchedules();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      office_location_id: '',
      target_latitude: '',
      target_longitude: '',
      allowed_radius_meters: '50',
      check_in_time: '09:00',
      check_out_time: '',
      link_valid_duration_hours: '2',
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
      send_check_in_link: true,
      send_check_out_link: false,
      notification_method: ['email'],
      send_before_minutes: '15',
      send_to_all_employees: true,
      specific_employee_ids: [] as string[],
      employee_group_ids: [] as string[],
      assignment_type: 'all' as 'all' | 'selected' | 'groups' | 'location_based',
      max_uses_per_link: '',
      require_photo: true,
      require_location_verification: true,
    });
    setGoogleLocation(null);
    setLocationSource('office');
  };

  const getDaysActive = (schedule: AttendanceSchedule) => {
    const days = [];
    if (schedule.monday) days.push('Mon');
    if (schedule.tuesday) days.push('Tue');
    if (schedule.wednesday) days.push('Wed');
    if (schedule.thursday) days.push('Thu');
    if (schedule.friday) days.push('Fri');
    if (schedule.saturday) days.push('Sat');
    if (schedule.sunday) days.push('Sun');
    return days.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automated Attendance Schedules</h2>
          <p className="text-muted-foreground">
            Configure automated daily attendance link generation and distribution
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            setEditingSchedule(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
              </DialogTitle>
              <DialogDescription>
                Configure automated daily attendance link generation with location and time settings
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="name">Schedule Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Daily Office Check-In"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkInTime">Check-In Time *</Label>
                    <Input
                      id="checkInTime"
                      type="time"
                      value={formData.check_in_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_in_time: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="checkOutTime">Check-Out Time (Optional)</Label>
                    <Input
                      id="checkOutTime"
                      type="time"
                      value={formData.check_out_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_out_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkDuration">Link Valid Duration (Hours)</Label>
                    <Input
                      id="linkDuration"
                      type="number"
                      value={formData.link_valid_duration_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_valid_duration_hours: e.target.value }))}
                      min="1"
                      max="24"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxUses">Max Uses Per Link (Optional)</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      value={formData.max_uses_per_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_uses_per_link: e.target.value }))}
                      placeholder="Unlimited if empty"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                <div>
                  <Label>Location Source</Label>
                  <Select
                    value={locationSource}
                    onValueChange={(value: 'office' | 'google' | 'custom') => setLocationSource(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office">Office Location</SelectItem>
                      <SelectItem value="google">Google Maps Search</SelectItem>
                      <SelectItem value="custom">Custom Coordinates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {locationSource === 'office' && (
                  <div>
                    <Label htmlFor="officeLocation">Office Location *</Label>
                    <Select
                      value={formData.office_location_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, office_location_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select office location" />
                      </SelectTrigger>
                      <SelectContent>
                        {officeLocations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name} - {loc.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {locationSource === 'google' && (
                  <div>
                    <Label>Search Location</Label>
                    <GoogleLocationPicker
                      onLocationSelect={handleLocationSelect}
                      initialAddress={googleLocation?.address}
                    />
                    {googleLocation && (
                      <Alert className="mt-2">
                        <AlertDescription>
                          Selected: {googleLocation.address}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {locationSource === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude *</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.target_latitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_latitude: e.target.value }))}
                        placeholder="23.6145"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude *</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.target_longitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, target_longitude: e.target.value }))}
                        placeholder="58.5458"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="radius">Allowed Radius (meters)</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={formData.allowed_radius_meters}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowed_radius_meters: e.target.value }))}
                    min="10"
                    max="1000"
                  />
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div>
                  <Label>Active Days</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className="flex items-center space-x-2"
                        >
                          {formData[day as keyof typeof formData] ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                          <span className="text-sm capitalize">{day.substring(0, 3)}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Send Check-In Link</Label>
                    <Switch
                      checked={formData.send_check_in_link}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, send_check_in_link: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Send Check-Out Link</Label>
                    <Switch
                      checked={formData.send_check_out_link}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, send_check_out_link: checked }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <div>
                  <Label>Notification Methods</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleNotificationMethodToggle('email')}
                        className="flex items-center space-x-2"
                      >
                        {formData.notification_method.includes('email') ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                        <Mail className="h-4 w-4 mr-2" />
                        <span>Email</span>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleNotificationMethodToggle('sms')}
                        className="flex items-center space-x-2"
                      >
                        {formData.notification_method.includes('sms') ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                        <Smartphone className="h-4 w-4 mr-2" />
                        <span>SMS</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sendBefore">Send Before (Minutes)</Label>
                  <Input
                    id="sendBefore"
                    type="number"
                    value={formData.send_before_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, send_before_minutes: e.target.value }))}
                    min="0"
                    max="120"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Send notification this many minutes before check-in time
                  </p>
                </div>

                <div className="space-y-4">
                  <Label>Employee Assignment</Label>
                  <EmployeeScheduleSelector
                    selectedEmployeeIds={formData.specific_employee_ids || []}
                    selectedGroupIds={formData.employee_group_ids || []}
                    assignmentType={formData.assignment_type || 'all'}
                    onSelectionChange={(data) => {
                      setFormData(prev => ({
                        ...prev,
                        specific_employee_ids: data.employeeIds,
                        employee_group_ids: data.groupIds,
                        assignment_type: data.assignmentType,
                        send_to_all_employees: data.assignmentType === 'all',
                      }));
                    }}
                    showLocationBased={!!formData.office_location_id}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Schedules Created</p>
            <p className="text-sm text-muted-foreground">
              Create your first automated schedule to start sending daily attendance links
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className={!schedule.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {schedule.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {schedule.description || 'Automated daily attendance schedule'}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {schedule.is_active ? (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check-In Time</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {schedule.check_in_time}
                    </p>
                  </div>
                  {schedule.check_out_time && (
                    <div>
                      <p className="text-sm text-muted-foreground">Check-Out Time</p>
                      <p className="font-medium flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {schedule.check_out_time}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {schedule.office_location?.name || 'Custom'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Days</p>
                    <p className="font-medium text-sm">{getDaysActive(schedule)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {schedule.send_check_in_link && (
                    <Badge variant="outline">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Check-In
                    </Badge>
                  )}
                  {schedule.send_check_out_link && (
                    <Badge variant="outline">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Check-Out
                    </Badge>
                  )}
                  {schedule.notification_method?.includes('email') && (
                    <Badge variant="outline">
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Badge>
                  )}
                  {schedule.notification_method?.includes('sms') && (
                    <Badge variant="outline">
                      <Smartphone className="h-3 w-3 mr-1" />
                      SMS
                    </Badge>
                  )}
                </div>

                <div className="text-sm text-muted-foreground mb-4">
                  <p>Links Generated: {schedule.total_links_generated}</p>
                  <p>Notifications Sent: {schedule.total_notifications_sent}</p>
                  {schedule.last_generated_at && (
                    <p>Last Generated: {format(parseISO(schedule.last_generated_at), 'PPp')}</p>
                  )}
                  {schedule.next_generation_date && (
                    <p>Next Generation: {format(parseISO(schedule.next_generation_date), 'PP')}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(schedule)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(schedule)}
                  >
                    {schedule.is_active ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualTrigger(schedule.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Generate Now
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

