import { z } from 'zod';

export const ClientCreateSchema = z.object({
  full_name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const ClientResponseSchema = ClientCreateSchema.extend({
  id: z.string().uuid(),
  created_at: z.string(),
});
