import { z } from 'zod';

export const ProviderCreateSchema = z.object({
  full_name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
});

export const ProviderResponseSchema = ProviderCreateSchema.extend({
  id: z.string().uuid(),
  created_at: z.string(),
});
