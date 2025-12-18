'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Promoter } from '@/lib/types';

export async function getPromoters(): Promise<Promoter[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('promoters')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching promoters:', error);
    return [];
  }

  return data || [];
}

export async function getPromoterById(id: string): Promise<Promoter | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('promoters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching promoter:', error);
    return null;
  }

  return data;
}

export async function createPromoter(
  promoterData: Omit<Promoter, 'id' | 'created_at'>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('promoters')
    .insert(promoterData)
    .select()
    .single();

  if (error) {
    console.error('Error creating promoter:', error);
    throw new Error('Failed to create promoter');
  }

  // revalidatePath('/manage-promoters'); // Disabled to prevent auto-refresh
  return data;
}

export async function updatePromoter(
  id: string,
  promoterData: Partial<Promoter>
) {
  const supabase = await createClient();

  // Convert date strings to proper format for database
  const updateData: Record<string, any> = { ...promoterData };

  // Convert ISO date strings to date format for date fields
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
        const date = new Date(updateData[field]);
        if (!isNaN(date.getTime())) {
          updateData[field] = date.toISOString().split('T')[0];
        } else {
          delete updateData[field];
        }
      } else if (updateData[field] instanceof Date) {
        updateData[field] = updateData[field].toISOString().split('T')[0];
      }
    }
  }

  // Remove null/undefined values to avoid constraint issues
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === null || updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  const { data, error } = await supabase
    .from('promoters')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating promoter:', error);
    throw new Error('Failed to update promoter');
  }

  // revalidatePath('/manage-promoters'); // Disabled to prevent auto-refresh
  // revalidatePath(`/manage-promoters/${id}`); // Disabled to prevent auto-refresh
  return data;
}

export async function deletePromoter(
  id: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('promoters').delete().eq('id', id);

  if (error) {
    console.error('Error deleting promoter:', error);
    return { success: false, message: 'Failed to delete promoter' };
  }

  // revalidatePath('/manage-promoters'); // Disabled to prevent auto-refresh
  return { success: true, message: 'Promoter deleted successfully' };
}
