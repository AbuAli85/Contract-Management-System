import { z } from 'zod';

export const ServiceCreateSchema = z.object({
  provider_id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  price_base: z.number(),
  duration_minutes: z.number(),
  description: z.string().optional(),
});

export const ServiceUpdateSchema = ServiceCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const ServiceResponseSchema = z.object({
  id: z.string().uuid(),
  provider_id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  price_base: z.number(),
  duration_minutes: z.number(),
  description: z.string().nullable(),
  created_at: z.string(),
});