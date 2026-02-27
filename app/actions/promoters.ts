'use server';
import { createClient } from '@/lib/supabase/server';
import type { Promoter } from '@/lib/types';

// Helper: verify the caller is authenticated
async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized: You must be logged in to perform this action.');
  }
  return { supabase, user };
}

export async function getPromoters(): Promise<Promoter[]> {
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('promoters')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error(`Failed to fetch promoters: ${error.message}`);
  }
  return data || [];
}

export async function getPromoterById(id: string): Promise<Promoter | null> {
  if (!id) return null;
  const { supabase } = await requireAuth();
  const { data, error } = await supabase
    .from('promoters')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch promoter: ${error.message}`);
  }
  return data;
}

export async function createPromoter(
  promoterData: Omit<Promoter, 'id' | 'created_at'>
) {
  const { supabase, user } = await requireAuth();

  // Sanitize and normalize data
  const sanitized = { ...promoterData };
  if (sanitized.email) {
    sanitized.email = sanitized.email.toLowerCase().trim();
  }

  const { data, error } = await supabase
    .from('promoters')
    .insert({ ...sanitized, created_by: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('A promoter with this email or ID already exists.');
    }
    throw new Error(`Failed to create promoter: ${error.message}`);
  }
  return data;
}

export async function updatePromoter(
  id: string,
  promoterData: Partial<Promoter>
) {
  if (!id) throw new Error('Promoter ID is required');
  const { supabase, user } = await requireAuth();

  // Convert date strings to proper format for database
  const updateData: Record<string, unknown> = { ...promoterData };

  const dateFields = [
    'id_card_expiry_date',
    'passport_expiry_date',
    'visa_expiry_date',
    'work_permit_expiry_date',
    'date_of_birth',
  ];

  for (const field of dateFields) {
    if (updateData[field]) {
      if (typeof updateData[field] === 'string') {
        const date = new Date(updateData[field] as string);
        if (!isNaN(date.getTime())) {
          updateData[field] = date.toISOString().split('T')[0];
        } else {
          delete updateData[field];
        }
      } else if (updateData[field] instanceof Date) {
        updateData[field] = (updateData[field] as Date).toISOString().split('T')[0];
      }
    }
  }

  // Remove null/undefined values to avoid constraint issues
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === null || updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  // Normalize email if present
  if (typeof updateData.email === 'string') {
    updateData.email = updateData.email.toLowerCase().trim();
  }

  // Track who last updated
  updateData.updated_by = user.id;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('promoters')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Promoter not found.');
    }
    if (error.code === '23505') {
      throw new Error('A promoter with this email or ID already exists.');
    }
    throw new Error(`Failed to update promoter: ${error.message}`);
  }
  return data;
}

export async function deletePromoter(
  id: string
): Promise<{ success: boolean; message: string }> {
  if (!id) return { success: false, message: 'Promoter ID is required' };

  try {
    await requireAuth();
  } catch {
    return { success: false, message: 'Unauthorized: You must be logged in.' };
  }

  // Use the API route which handles cascade deletion and auth
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/promoters/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    return {
      success: false,
      message: errData.error || `Failed to delete promoter: ${response.statusText}`,
    };
  }

  return { success: true, message: 'Promoter deleted successfully' };
}
