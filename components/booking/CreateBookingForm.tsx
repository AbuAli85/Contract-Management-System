'use client';

import React, { useState } from 'react';
import { useBookingOperations } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Calendar, Clock, Users, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateBookingFormProps {
  serviceId: string;
  clientId: string;
  onSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
}

interface ServiceDetails {
  id: string;
  name: string;
  duration_minutes: number;
  price_base: number;
  price_currency: string;
  requires_approval: boolean;
}

export function CreateBookingForm({ 
  serviceId, 
  clientId, 
  onSuccess, 
  onCancel 
}: CreateBookingFormProps) {
  const { create, loading, error, clearError } = useBookingOperations();
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    scheduledAt: '',
    scheduledTime: '',
    participantCount: 1,
    notes: '',
    clientNotes: ''
  });
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Mock service details - in real app, fetch from API
  const [serviceDetails] = useState<ServiceDetails>({
    id: serviceId,
    name: 'Sample Service',
    duration_minutes: 60,
    price_base: 100,
    price_currency: 'USD',
    requires_approval: false
  });
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.scheduledAt) {
      errors.scheduledAt = 'Date is required';
    }
    
    if (!formData.scheduledTime) {
      errors.scheduledTime = 'Time is required';
    }
    
    if (formData.participantCount < 1) {
      errors.participantCount = 'Must have at least 1 participant';
    }
    
    // Check if selected time is in the future
    const selectedDateTime = new Date(`${formData.scheduledAt}T${formData.scheduledTime}`);
    if (selectedDateTime <= new Date()) {
      errors.scheduledAt = 'Booking must be in the future';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const scheduledAt = new Date(`${formData.scheduledAt}T${formData.scheduledTime}`).toISOString();
      
      const bookingId = await create({
        serviceId,
        clientId,
        scheduledAt,
        durationMinutes: serviceDetails.duration_minutes,
        participantCount: formData.participantCount,
        totalPrice: serviceDetails.price_base,
        currency: serviceDetails.price_currency,
        notes: formData.notes || undefined,
        clientNotes: formData.clientNotes || undefined
      });
      
      toast({
        title: 'Booking Created Successfully',
        description: serviceDetails.requires_approval 
          ? 'Your booking request has been submitted and is pending approval.'
          : 'Your booking has been confirmed!',
        icon: <CheckCircle className="h-4 w-4" />
      });
      
      onSuccess?.(bookingId);
    } catch (err) {
      // Error is already handled by the hook
      console.error('Failed to create booking:', err);
    }
  };
  
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const getMinTime = () => {
    if (!formData.scheduledAt) return '';
    
    const today = new Date();
    const selectedDate = new Date(formData.scheduledAt);
    
    if (today.toDateString() === selectedDate.toDateString()) {
      // If today, set minimum time to current time + 1 hour
      const minTime = new Date(today.getTime() + 60 * 60 * 1000);
      return minTime.toTimeString().slice(0, 5);
    }
    
    return '';
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Create New Booking
        </CardTitle>
        <CardDescription>
          Book "{serviceDetails.name}" - {serviceDetails.duration_minutes} minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{serviceDetails.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{serviceDetails.price_base} {serviceDetails.price_currency}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Max: {serviceDetails.max_participants || 'Unlimited'}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {serviceDetails.requires_approval ? 'Approval Required' : 'Auto-confirmed'}
              </span>
            </div>
          </div>
          
          {/* Date and Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Date *</Label>
              <Input
                id="scheduledAt"
                type="date"
                value={formData.scheduledAt}
                onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                min={getMinDate()}
                className={validationErrors.scheduledAt ? 'border-red-500' : ''}
              />
              {validationErrors.scheduledAt && (
                <p className="text-sm text-red-500">{validationErrors.scheduledAt}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Time *</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                min={getMinTime()}
                className={validationErrors.scheduledTime ? 'border-red-500' : ''}
              />
              {validationErrors.scheduledTime && (
                <p className="text-sm text-red-500">{validationErrors.scheduledTime}</p>
              )}
            </div>
          </div>
          
          {/* Participant Count */}
          <div className="space-y-2">
            <Label htmlFor="participantCount">Number of Participants</Label>
            <Select
              value={formData.participantCount.toString()}
              onValueChange={(value) => handleInputChange('participantCount', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'person' : 'people'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.participantCount && (
              <p className="text-sm text-red-500">{validationErrors.participantCount}</p>
            )}
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">General Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or notes for the provider..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>
          
          {/* Client Notes */}
          <div className="space-y-2">
            <Label htmlFor="clientNotes">Private Notes (Optional)</Label>
            <Textarea
              id="clientNotes"
              placeholder="Private notes for your reference..."
              value={formData.clientNotes}
              onChange={(e) => handleInputChange('clientNotes', e.target.value)}
              rows={2}
            />
          </div>
          
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearError}
                  className="ml-2 h-auto p-1"
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Booking
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 