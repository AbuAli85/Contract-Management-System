import { z } from 'zod';

export const ContractCreateSchema = z.object({
  client_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  service_id: z.string().uuid(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']),
  contract_date: z.string().datetime(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  total_amount: z.number(),
  currency: z.string(),
});

export const ContractUpdateSchema = ContractCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const ContractResponseSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  service_id: z.string().uuid(),
  status: z.string(),
  contract_date: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  total_amount: z.number(),
  currency: z.string(),
  created_at: z.string(),
});
