import { z } from 'zod';

export const BookingCreateSchema = z.object({
  client_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  service_id: z.string().uuid(),
  scheduled_start: z.string().datetime(),
  scheduled_end: z.string().datetime(),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  total_price: z.number(),
  currency: z.string(),
  client_notes: z.string().optional(),
});

export const BookingUpdateSchema = BookingCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const BookingResponseSchema = z.object({
  id: z.string().uuid(),
  booking_number: z.string(),
  client_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  service_id: z.string().uuid(),
  status: z.string(),
  scheduled_start: z.string(),
  scheduled_end: z.string(),
  total_price: z.number(),
  currency: z.string(),
  created_at: z.string(),
});