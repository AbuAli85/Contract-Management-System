import { z } from 'zod';

export const NotificationCreateSchema = z.object({
  user_id: z.string().uuid(),
  type: z.string(),
  message: z.string(),
  is_read: z.boolean().default(false),
});

export const NotificationResponseSchema = NotificationCreateSchema.extend({
  id: z.string().uuid(),
  created_at: z.string(),
});