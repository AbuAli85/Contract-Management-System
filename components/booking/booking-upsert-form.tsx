"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarIcon, Clock, DollarSign, Save, RefreshCw } from 'lucide-react'
import { useBookingUpsert, useBookingUpsertAPI } from '@/hooks/use-booking-upsert'
import { generateBookingNumber, type BookingPayload } from '@/lib/booking-service'

const bookingSchema = z.object({
  service_id: z.string().min(1, 'Service ID is required'),
  provider_company_id: z.string().min(1, 'Provider Company ID is required'),
  client_id: z.string().min(1, 'Client ID is required'),
  scheduled_start: z.string().min(1, 'Start time is required'),
  scheduled_end: z.string().min(1, 'End time is required'),
  total_price: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('OMR'),
  booking_number: z.string().min(1, 'Booking number is required'),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded']).default('pending'),
  notes: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

interface BookingUpsertFormProps {
  initialData?: Partial<BookingFormData>
  onSuccess?: (data: any) => void
  useAPI?: boolean
}

export function BookingUpsertForm({ initialData, onSuccess, useAPI = false }: BookingUpsertFormProps) {
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false)
  
  // Choose between direct Supabase or API approach
  const mutation = useAPI ? useBookingUpsertAPI({ onSuccess }) : useBookingUpsert({ onSuccess })

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      service_id: '8ae3b266-bb64-4626-8388-44da16bc79d2',
      provider_company_id: '24e1bbc0-d47b-4157-bed2-39aaae5de93d',
      client_id: '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170',
      scheduled_start: new Date(Date.now() + 4*24*60*60*1000).toISOString().slice(0, 16),
      scheduled_end: new Date(Date.now() + 4*24*60*60*1000 + 2*60*60*1000).toISOString().slice(0, 16),
      total_price: 25.000,
      currency: 'OMR',
      booking_number: 'BK-TEST-0000000042',
      status: 'pending',
      notes: '',
      ...initialData
    }
  })

  const generateNewBookingNumber = async () => {
    setIsGeneratingNumber(true)
    try {
      const newNumber = generateBookingNumber()
      form.setValue('booking_number', newNumber)
    } finally {
      setIsGeneratingNumber(false)
    }
  }

  const onSubmit = async (data: BookingFormData) => {
    const payload: BookingPayload = {
      ...data,
      scheduled_start: new Date(data.scheduled_start).toISOString(),
      scheduled_end: new Date(data.scheduled_end).toISOString(),
      metadata: {
        form_version: '1.0',
        submitted_at: new Date().toISOString()
      }
    }

    mutation.mutate(payload)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Booking Upsert Form
        </CardTitle>
        <div className="flex gap-2">
          <Badge variant={useAPI ? "default" : "secondary"}>
            {useAPI ? "API Route" : "Direct Supabase"}
          </Badge>
          <Badge variant="outline">
            Conflict Target: booking_number
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <AlertDescription>
            This form demonstrates Supabase upsert with <code>booking_number</code> as the conflict target.
            If a booking with the same number exists, it will be updated; otherwise, a new one will be created.
          </AlertDescription>
        </Alert>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Booking Number */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-3">
              <Label htmlFor="booking_number">Booking Number</Label>
              <Input
                id="booking_number"
                {...form.register('booking_number')}
                placeholder="BK-YYYY-XXXXXXXX"
              />
              {form.formState.errors.booking_number && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.booking_number.message}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={generateNewBookingNumber}
              disabled={isGeneratingNumber}
            >
              {isGeneratingNumber ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Generate
            </Button>
          </div>

          {/* IDs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="service_id">Service ID</Label>
              <Input
                id="service_id"
                {...form.register('service_id')}
                placeholder="Service UUID"
              />
              {form.formState.errors.service_id && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.service_id.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="provider_company_id">Provider Company ID</Label>
              <Input
                id="provider_company_id"
                {...form.register('provider_company_id')}
                placeholder="Company UUID"
              />
              {form.formState.errors.provider_company_id && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.provider_company_id.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="client_id">Client ID</Label>
              <Input
                id="client_id"
                {...form.register('client_id')}
                placeholder="Client UUID"
              />
              {form.formState.errors.client_id && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.client_id.message}
                </p>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduled_start" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Scheduled Start
              </Label>
              <Input
                id="scheduled_start"
                type="datetime-local"
                {...form.register('scheduled_start')}
              />
              {form.formState.errors.scheduled_start && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.scheduled_start.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="scheduled_end" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Scheduled End
              </Label>
              <Input
                id="scheduled_end"
                type="datetime-local"
                {...form.register('scheduled_end')}
              />
              {form.formState.errors.scheduled_end && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.scheduled_end.message}
                </p>
              )}
            </div>
          </div>

          {/* Price and Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="total_price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Price
              </Label>
              <Input
                id="total_price"
                type="number"
                step="0.001"
                {...form.register('total_price', { valueAsNumber: true })}
              />
              {form.formState.errors.total_price && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.total_price.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.watch('currency')}
                onValueChange={(value) => form.setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OMR">OMR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...form.register('notes')}
              placeholder="Additional booking notes..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mutation.isPending ? 'Saving...' : 'Upsert Booking'}
          </Button>

          {/* Result Display */}
          {mutation.isSuccess && (
            <Alert>
              <AlertDescription className="text-green-600">
                ✅ Booking upserted successfully! 
                <br />
                <strong>Booking Number:</strong> {mutation.data?.booking_number}
                <br />
                <strong>Status:</strong> {mutation.data?.status}
              </AlertDescription>
            </Alert>
          )}

          {mutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                ❌ Failed to upsert booking: {mutation.error?.message}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}