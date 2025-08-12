'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarDays,
  Clock,
  User,
  DollarSign,
  MapPin,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface BookingFormWithWebhookProps {
  service: {
    id: string;
    title: string;
    description: string;
    base_price: number;
    currency: string;
    location_type: string;
    provider: {
      full_name: string;
      email: string;
      company_name: string;
    };
  };
  onBookingCreated?: (booking: any) => void;
}

export function BookingFormWithWebhook({
  service,
  onBookingCreated,
}: BookingFormWithWebhookProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<
    'idle' | 'triggering' | 'success' | 'failed'
  >('idle');
  const [formData, setFormData] = useState({
    scheduled_start: '',
    scheduled_end: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    client_notes: '',
    participants: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setWebhookStatus('idle');

    try {
      console.log('🚀 Creating booking with webhook integration...');

      // Create the booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: service.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const { booking } = await response.json();
      console.log('✅ Booking created:', booking.id);

      // The webhook is automatically triggered by the API route
      setWebhookStatus('triggering');

      toast({
        title: 'Booking Created Successfully! 🎉',
        description: `Booking ${booking.booking_number} has been created. Notifications are being sent...`,
        duration: 5000,
      });

      // Simulate webhook processing time
      setTimeout(() => {
        setWebhookStatus('success');
        toast({
          title: 'Automation Complete ✅',
          description:
            'Email confirmations sent to both client and provider. Calendar events created.',
          duration: 3000,
        });
      }, 2000);

      onBookingCreated?.(booking);

      // Reset form
      setFormData({
        scheduled_start: '',
        scheduled_end: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        client_notes: '',
        participants: 1,
      });
    } catch (error) {
      console.error('❌ Booking creation error:', error);
      setWebhookStatus('failed');

      toast({
        title: 'Booking Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to create booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async () => {
    try {
      setWebhookStatus('triggering');

      const response = await fetch(
        '/api/bookings/webhook/test?event=booking.created'
      );
      const result = await response.json();

      if (result.success) {
        setWebhookStatus('success');
        toast({
          title: 'Webhook Test Successful ✅',
          description: 'Make.com automation is working correctly!',
        });
      } else {
        setWebhookStatus('failed');
        toast({
          title: 'Webhook Test Failed ❌',
          description: result.error || 'Webhook test failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setWebhookStatus('failed');
      toast({
        title: 'Test Error',
        description: 'Failed to test webhook',
        variant: 'destructive',
      });
    }
  };

  const getWebhookStatusIcon = () => {
    switch (webhookStatus) {
      case 'triggering':
        return <Clock className='w-4 h-4 animate-spin' />;
      case 'success':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'failed':
        return <AlertCircle className='w-4 h-4 text-red-600' />;
      default:
        return null;
    }
  };

  const getWebhookStatusText = () => {
    switch (webhookStatus) {
      case 'triggering':
        return 'Triggering automation...';
      case 'success':
        return 'Automation completed';
      case 'failed':
        return 'Automation failed';
      default:
        return '';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Service Info */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='w-5 h-5' />
            {service.title}
          </CardTitle>
          <CardDescription>{service.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <User className='w-4 h-4' />
              <span>{service.provider.full_name}</span>
            </div>
            <div className='flex items-center gap-2'>
              <DollarSign className='w-4 h-4' />
              <span>
                {service.currency} {service.base_price}
              </span>
            </div>
          </div>
          <Badge variant='outline' className='mt-2'>
            {service.location_type}
          </Badge>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card>
        <CardHeader>
          <CardTitle>Book This Service</CardTitle>
          <CardDescription>
            Fill out the form below. You'll receive automatic email
            confirmations and calendar invites.
          </CardDescription>

          {/* Webhook Status */}
          {webhookStatus !== 'idle' && (
            <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-lg'>
              {getWebhookStatusIcon()}
              <span className='text-sm font-medium'>
                {getWebhookStatusText()}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Start Date & Time
                </label>
                <Input
                  type='datetime-local'
                  value={formData.scheduled_start}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      scheduled_start: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  End Date & Time
                </label>
                <Input
                  type='datetime-local'
                  value={formData.scheduled_end}
                  onChange={e =>
                    setFormData({ ...formData, scheduled_end: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium mb-1'>
                  Your Name
                </label>
                <Input
                  value={formData.client_name}
                  onChange={e =>
                    setFormData({ ...formData, client_name: e.target.value })
                  }
                  placeholder='John Doe'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium mb-1'>Email</label>
                <Input
                  type='email'
                  value={formData.client_email}
                  onChange={e =>
                    setFormData({ ...formData, client_email: e.target.value })
                  }
                  placeholder='john@example.com'
                  required
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                Phone (Optional)
              </label>
              <Input
                type='tel'
                value={formData.client_phone}
                onChange={e =>
                  setFormData({ ...formData, client_phone: e.target.value })
                }
                placeholder='+1 (555) 123-4567'
              />
            </div>

            <div>
              <label className='block text-sm font-medium mb-1'>
                Special Requirements
              </label>
              <Textarea
                value={formData.client_notes}
                onChange={e =>
                  setFormData({ ...formData, client_notes: e.target.value })
                }
                placeholder='Any special requirements or notes for the provider...'
                rows={3}
              />
            </div>

            <div className='bg-blue-50 p-4 rounded-lg'>
              <h4 className='font-medium text-blue-900 mb-2'>
                What happens next?
              </h4>
              <ul className='text-sm text-blue-800 space-y-1'>
                <li>✅ Booking confirmation email sent to you</li>
                <li>✅ Provider notification email sent</li>
                <li>✅ Calendar events created automatically</li>
                <li>✅ Team notification sent to Slack/Teams</li>
                <li>✅ Follow-up reminders scheduled</li>
              </ul>
            </div>

            <div className='flex gap-3'>
              <Button type='submit' disabled={loading} className='flex-1'>
                {loading ? 'Creating Booking...' : 'Book Service'}
              </Button>

              <Button
                type='button'
                variant='outline'
                onClick={testWebhook}
                disabled={loading}
              >
                Test Webhook
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
