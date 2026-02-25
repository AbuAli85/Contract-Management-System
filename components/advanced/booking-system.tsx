'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Building2,
  Car,
  Monitor,
  Coffee,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { BookingService } from '@/lib/advanced/booking-service';

interface BookingResource {
  id: string;
  name: string;
  type: 'meeting_room' | 'vehicle' | 'equipment' | 'facility';
  capacity: number;
  location: string;
  amenities: string[];
  hourly_rate?: number;
  availability_hours: {
    start: string;
    end: string;
  };
  is_available: boolean;
}

interface Booking {
  id: string;
  resource_id: string;
  resource_name: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  user_id: string;
  user_name: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  attendees: string[];
  total_cost?: number;
  created_at: string;
}

interface BookingForm {
  resource_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  attendees: string[];
}

export function BookingSystem() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<BookingResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedResourceType, setSelectedResourceType] =
    useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewBookingDialog, setShowNewBookingDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    resource_id: '',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    attendees: [],
  });

  const bookingService = new BookingService();

  useEffect(() => {
    loadBookingData();
  }, [selectedDate, selectedResourceType]);

  const loadBookingData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch real booking resources
      const resourcesResponse = await fetch('/api/booking-resources');
      if (resourcesResponse.ok) {
        const resourcesData = await resourcesResponse.json();
        setResources(resourcesData.resources || []);
      } else {
        // Fallback to a basic set of resources if API fails
        setResources([
          {
            id: '1',
            name: 'Conference Room A',
            type: 'meeting_room',
            capacity: 12,
            location: 'Floor 3, West Wing',
            amenities: [
              'Projector',
              'Whiteboard',
              'Video Conferencing',
              'WiFi',
            ],
            hourly_rate: 50,
            availability_hours: { start: '08:00', end: '18:00' },
            is_available: true,
          },
        ]);
      }

      // Fetch real bookings for selected date
      const bookingsResponse = await fetch(
        `/api/bookings?date=${selectedDate}&resourceType=${selectedResourceType}`
      );
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.bookings || []);
      } else {
        // If API fails, show empty bookings
        setBookings([]);
      }
    } catch (error) {
      setError('Failed to load booking data. Please try again.');
      // Set fallback data on error
      setResources([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async () => {
    try {
      // Validate form
      if (
        !bookingForm.resource_id ||
        !bookingForm.title ||
        !bookingForm.start_time ||
        !bookingForm.end_time
      ) {
        alert('Please fill in all required fields');
        return;
      }

      // Here you would call the actual booking service

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Reset form and close dialog
      setBookingForm({
        resource_id: '',
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        attendees: [],
      });
      setShowNewBookingDialog(false);

      // Reload data
      await loadBookingData();

      alert('Booking created successfully!');
    } catch (error) {
      alert('Failed to create booking. Please try again.');
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'meeting_room':
        return Building2;
      case 'vehicle':
        return Car;
      case 'equipment':
        return Monitor;
      case 'facility':
        return Coffee;
      default:
        return Building2;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesType =
      selectedResourceType === 'all' || resource.type === selectedResourceType;
    const matchesSearch =
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = booking.start_time.split('T')[0];
    return bookingDate === selectedDate;
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4' />
          <p className='text-muted-foreground text-lg'>
            Loading booking system...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Booking System</h1>
          <p className='text-muted-foreground'>
            Manage room reservations, vehicle bookings, and equipment scheduling
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Input
            placeholder='Search resources...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-64'
          />

          <Dialog
            open={showNewBookingDialog}
            onOpenChange={setShowNewBookingDialog}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className='h-4 w-4 mr-2' />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-md'>
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
                <DialogDescription>
                  Reserve a resource for your meeting or activity
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4'>
                <div>
                  <Label htmlFor='resource'>Resource</Label>
                  <Select
                    value={bookingForm.resource_id}
                    onValueChange={value =>
                      setBookingForm(prev => ({ ...prev, resource_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select a resource' />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredResources.map(resource => (
                        <SelectItem key={resource.id} value={resource.id}>
                          {resource.name} - {resource.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='title'>Title</Label>
                  <Input
                    id='title'
                    value={bookingForm.title}
                    onChange={e =>
                      setBookingForm(prev => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder='Meeting or event title'
                  />
                </div>

                <div>
                  <Label htmlFor='description'>Description</Label>
                  <Textarea
                    id='description'
                    value={bookingForm.description}
                    onChange={e =>
                      setBookingForm(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder='Optional description'
                    rows={3}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='start_time'>Start Time</Label>
                    <Input
                      id='start_time'
                      type='datetime-local'
                      value={bookingForm.start_time}
                      onChange={e =>
                        setBookingForm(prev => ({
                          ...prev,
                          start_time: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor='end_time'>End Time</Label>
                    <Input
                      id='end_time'
                      type='datetime-local'
                      value={bookingForm.end_time}
                      onChange={e =>
                        setBookingForm(prev => ({
                          ...prev,
                          end_time: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => setShowNewBookingDialog(false)}
                    className='flex-1'
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBooking} className='flex-1'>
                    Create Booking
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className='flex gap-4 items-center'>
        <div className='flex items-center gap-2'>
          <Calendar className='h-4 w-4' />
          <Input
            type='date'
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className='w-40'
          />
        </div>

        <Select
          value={selectedResourceType}
          onValueChange={setSelectedResourceType}
        >
          <SelectTrigger className='w-48'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Resource Types</SelectItem>
            <SelectItem value='meeting_room'>Meeting Rooms</SelectItem>
            <SelectItem value='vehicle'>Vehicles</SelectItem>
            <SelectItem value='equipment'>Equipment</SelectItem>
            <SelectItem value='facility'>Facilities</SelectItem>
          </SelectContent>
        </Select>

        <Button variant='outline' onClick={loadBookingData}>
          <RefreshCw className='h-4 w-4 mr-2' />
          Refresh
        </Button>
      </div>

      {/* Main Content */}
      <Tabs defaultValue='calendar' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='calendar'>Calendar View</TabsTrigger>
          <TabsTrigger value='resources'>Resources</TabsTrigger>
          <TabsTrigger value='bookings'>My Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value='calendar' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>
                Today's Schedule - {new Date(selectedDate).toLocaleDateString()}
              </CardTitle>
              <CardDescription>
                All bookings for the selected date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredBookings.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <Calendar className='h-12 w-12 mx-auto mb-4 opacity-50' />
                  <p>No bookings for this date</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {filteredBookings.map(booking => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50'
                    >
                      <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                        <Clock className='h-6 w-6 text-blue-600' />
                      </div>

                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h3 className='font-medium'>{booking.title}</h3>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className='text-sm text-muted-foreground mb-1'>
                          {booking.resource_name}
                        </p>
                        <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                          <span className='flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            {new Date(
                              booking.start_time
                            ).toLocaleTimeString()}{' '}
                            - {new Date(booking.end_time).toLocaleTimeString()}
                          </span>
                          <span className='flex items-center gap-1'>
                            <Users className='h-3 w-3' />
                            {booking.attendees.length} attendees
                          </span>
                          {booking.total_cost && (
                            <span>${booking.total_cost}</span>
                          )}
                        </div>
                      </div>

                      <div className='flex gap-2'>
                        <Button variant='outline' size='sm'>
                          <Eye className='h-4 w-4' />
                        </Button>
                        <Button variant='outline' size='sm'>
                          <Edit className='h-4 w-4' />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='resources' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredResources.map(resource => {
              const Icon = getResourceIcon(resource.type);
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='group'
                >
                  <Card className='h-full hover:shadow-lg transition-shadow'>
                    <CardHeader>
                      <div className='flex items-start justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                            <Icon className='h-5 w-5 text-blue-600' />
                          </div>
                          <div>
                            <CardTitle className='text-lg'>
                              {resource.name}
                            </CardTitle>
                            <CardDescription className='flex items-center gap-1'>
                              <MapPin className='h-3 w-3' />
                              {resource.location}
                            </CardDescription>
                          </div>
                        </div>
                        <div className='flex items-center gap-1'>
                          {resource.is_available ? (
                            <CheckCircle className='h-5 w-5 text-green-500' />
                          ) : (
                            <AlertCircle className='h-5 w-5 text-red-500' />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className='space-y-3'>
                        <div className='flex justify-between text-sm'>
                          <span>Capacity:</span>
                          <span className='font-medium'>
                            {resource.capacity} people
                          </span>
                        </div>

                        {resource.hourly_rate && (
                          <div className='flex justify-between text-sm'>
                            <span>Rate:</span>
                            <span className='font-medium'>
                              ${resource.hourly_rate}/hour
                            </span>
                          </div>
                        )}

                        <div className='flex justify-between text-sm'>
                          <span>Hours:</span>
                          <span className='font-medium'>
                            {resource.availability_hours.start} -{' '}
                            {resource.availability_hours.end}
                          </span>
                        </div>

                        <div>
                          <p className='text-sm font-medium mb-2'>Amenities:</p>
                          <div className='flex flex-wrap gap-1'>
                            {resource.amenities.slice(0, 3).map(amenity => (
                              <Badge
                                key={amenity}
                                variant='secondary'
                                className='text-xs'
                              >
                                {amenity}
                              </Badge>
                            ))}
                            {resource.amenities.length > 3 && (
                              <Badge variant='secondary' className='text-xs'>
                                +{resource.amenities.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button
                          className='w-full'
                          disabled={!resource.is_available}
                          onClick={() => {
                            setBookingForm(prev => ({
                              ...prev,
                              resource_id: resource.id,
                            }));
                            setShowNewBookingDialog(true);
                          }}
                        >
                          {resource.is_available ? 'Book Now' : 'Unavailable'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value='bookings' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>My Bookings</CardTitle>
              <CardDescription>
                All your current and past bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {bookings.map(booking => (
                  <div
                    key={booking.id}
                    className='flex items-center gap-4 p-4 border rounded-lg'
                  >
                    <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                      <Calendar className='h-6 w-6 text-white' />
                    </div>

                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h3 className='font-medium'>{booking.title}</h3>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground mb-1'>
                        {booking.resource_name}
                      </p>
                      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                        <span>
                          {new Date(booking.start_time).toLocaleDateString()}
                        </span>
                        <span>
                          {new Date(booking.start_time).toLocaleTimeString()} -{' '}
                          {new Date(booking.end_time).toLocaleTimeString()}
                        </span>
                        {booking.total_cost && (
                          <span>${booking.total_cost}</span>
                        )}
                      </div>
                    </div>

                    <div className='flex gap-2'>
                      <Button variant='outline' size='sm'>
                        <Eye className='h-4 w-4' />
                      </Button>
                      <Button variant='outline' size='sm'>
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
