import { z } from 'zod';

export const ServiceCreatedSchema = z.object({
  serviceId: z.string().uuid(),
  name: z.string().min(1),
  providerId: z.string().uuid(),
  createdAt: z.string().datetime(),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
});

export const BookingCreatedSchema = z.object({
  bookingId: z.string().uuid(),
  serviceId: z.string().uuid(),
  userId: z.string().uuid(),
  bookingDate: z.string().datetime(),
  status: z.string().min(1),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().optional(),
});

export const TrackingUpdatedSchema = z.object({
  trackingId: z.string().uuid(),
  status: z.string().min(1),
  location: z.string().optional(),
  updatedAt: z.string().datetime(),
  bookingId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const PaymentSucceededSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  userId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  paymentDate: z.string().datetime(),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
});

export const WebhookTypeSchema = z.enum([
  'serviceCreation',
  'bookingCreated',
  'trackingUpdated',
  'paymentSucceeded',
]);

export const WebhookPayloadSchema = z.union([
  ServiceCreatedSchema,
  BookingCreatedSchema,
  TrackingUpdatedSchema,
  PaymentSucceededSchema,
]);
