'use client';

import React, { useState } from 'react';
import { useBookings, useBookingOperations } from '@/hooks/useBookings';
import { BookingActions } from '@/components/booking/BookingActions';
import { CreateBookingForm } from '@/components/booking/CreateBookingForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Plus, 
  Eye, 
  Edit,
  Loader2
} from 'lucide-react';
import { Label } from '@/components/ui/label';

// Mock data for demonstration
const mockBookings = [
  {
    id: '1',
    booking_number: 'BK001',
    service_name: 'Consultation Session',
    client_name: 'John Doe',
    provider_name: 'Dr. Smith',
    status: 'pending' as const,
    scheduled_at: '2025-01-20T10:00:00Z',
    duration_minutes: 60,
    participant_count: 1,
    total_price: 150,
    currency: 'USD'
  },
  {
    id: '2',
    booking_number: 'BK002',
    service_name: 'Group Training',
    client_name: 'Jane Smith',
    provider_name: 'Fitness Pro',
    status: 'confirmed' as const,
    scheduled_at: '2025-01-21T14:00:00Z',
    duration_minutes: 90,
    participant_count: 5,
    total_price: 200,
    currency: 'USD'
  },
  {
    id: '3',
    booking_number: 'BK003',
    service_name: 'Home Cleaning',
    client_name: 'Bob Johnson',
    provider_name: 'CleanCo',
    status: 'in_progress' as const,
    scheduled_at: '2025-01-19T09:00:00Z',
    duration_minutes: 120,
    participant_count: 2,
    total_price: 80,
    currency: 'USD'
  }
];

export default function BookingDemoPage() {
  const [selectedBooking, setSelectedBooking] = useState(mockBookings[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock user context - in real app, get from auth
  const mockUser = {
    id: 'user-123',
    role: 'client' as const,
    isOwner: (booking: any) => booking.client_name === 'John Doe'
  };
  
  const handleStatusChange = (bookingId: string, newStatus: string) => {
    // In real app, this would trigger a refresh of the bookings list
    console.log(`Booking ${bookingId} status changed to ${newStatus}`);
  };
  
  const handleCreateSuccess = (bookingId: string) => {
    console.log(`New booking created with ID: ${bookingId}`);
    setShowCreateForm(false);
    // In real app, refresh the bookings list
  };
  
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Booking System Demo</h1>
        <p className="text-xl text-muted-foreground">
          Comprehensive demonstration of the booking management system
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockBookings.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across all services
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockBookings.filter(b => b.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require confirmation
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Today</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {mockBookings.filter(b => b.status === 'in_progress').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently in progress
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest booking updates and status changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">{booking.service_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.client_name} → {booking.provider_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDateTime(booking.scheduled_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">All Bookings</h2>
            <Button onClick={() => setActiveTab('create')}>
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          </div>
          
          <div className="grid gap-4">
            {mockBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">{booking.service_name}</h3>
                        <Badge variant="outline">{booking.booking_number}</Badge>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatDateTime(booking.scheduled_at)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>{booking.participant_count} participants</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{booking.total_price} {booking.currency}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>Duration: {booking.duration_minutes}m</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setActiveTab('actions');
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Create Tab */}
        <TabsContent value="create" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Create New Booking</h2>
            <Button variant="outline" onClick={() => setActiveTab('bookings')}>
              Back to Bookings
            </Button>
          </div>
          
          {showCreateForm ? (
            <CreateBookingForm
              serviceId="service-123"
              clientId={mockUser.id}
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Ready to create a booking?</h3>
                <p className="text-muted-foreground mb-4">
                  Fill out the form to schedule your service
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Start Creating
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Booking Actions</h2>
            <Button variant="outline" onClick={() => setActiveTab('bookings')}>
              Back to Bookings
            </Button>
          </div>
          
          {selectedBooking && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Booking Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                  <CardDescription>
                    Information about the selected booking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Service</Label>
                      <p className="text-sm text-muted-foreground">{selectedBooking.service_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Booking #</Label>
                      <p className="text-sm text-muted-foreground">{selectedBooking.booking_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Client</Label>
                      <p className="text-sm text-muted-foreground">{selectedBooking.client_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Provider</Label>
                      <p className="text-sm text-muted-foreground">{selectedBooking.provider_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Scheduled</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(selectedBooking.scheduled_at)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Duration</Label>
                      <p className="text-sm text-muted-foreground">{selectedBooking.duration_minutes} minutes</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Price</span>
                    <span className="text-lg font-bold">
                      {selectedBooking.total_price} {selectedBooking.currency}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Actions Panel */}
              <BookingActions
                bookingId={selectedBooking.id}
                currentStatus={selectedBooking.status}
                onStatusChange={handleStatusChange}
                userRole={mockUser.role}
                isOwner={mockUser.isOwner(selectedBooking)}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 