'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PromoterFormComprehensive } from '@/components/promoter-form-comprehensive';
import { PromotersTable } from '@/components/promoters-table';
import type { PromoterFormData } from '@/lib/schemas/promoter-form-schema';

export default function ComprehensivePromotersPage() {
  const router = useRouter();
  const [promoters, setPromoters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromoterId, setEditingPromoterId] = useState<string | null>(null);
  const [editingPromoter, setEditingPromoter] = useState<any>(null);

  // Fetch promoters
  const fetchPromoters = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/promoters');
      const data = await response.json();

      if (data.success) {
        setPromoters(data.promoters || []);
      } else {
        toast.error('Failed to fetch promoters');
      }
    } catch (error) {
      console.error('Error fetching promoters:', error);
      toast.error('An error occurred while fetching promoters');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoters();
  }, []);

  // Handle form submission (create)
  const handleCreate = async (data: PromoterFormData) => {
    try {
      // Convert dates to ISO strings for API
      const apiData = {
        ...data,
        id_card_expiry_date: data.id_card_expiry_date?.toISOString(),
        passport_expiry_date: data.passport_expiry_date?.toISOString(),
        visa_expiry_date: data.visa_expiry_date?.toISOString(),
        work_permit_expiry_date: data.work_permit_expiry_date?.toISOString(),
        date_of_birth: data.date_of_birth?.toISOString(),
      };

      const response = await fetch('/api/promoters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create promoter');
      }

      setIsFormOpen(false);
      await fetchPromoters();
      toast.success('Promoter created successfully');
    } catch (error) {
      console.error('Error creating promoter:', error);
      throw error;
    }
  };

  // Handle form submission (update)
  const handleUpdate = async (data: PromoterFormData) => {
    if (!editingPromoterId) return;

    try {
      // Convert dates to ISO strings for API
      const apiData = {
        ...data,
        id_card_expiry_date: data.id_card_expiry_date?.toISOString(),
        passport_expiry_date: data.passport_expiry_date?.toISOString(),
        visa_expiry_date: data.visa_expiry_date?.toISOString(),
        work_permit_expiry_date: data.work_permit_expiry_date?.toISOString(),
        date_of_birth: data.date_of_birth?.toISOString(),
      };

      const response = await fetch(`/api/promoters/${editingPromoterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update promoter');
      }

      setIsFormOpen(false);
      setEditingPromoterId(null);
      setEditingPromoter(null);
      await fetchPromoters();
      toast.success('Promoter updated successfully');
    } catch (error) {
      console.error('Error updating promoter:', error);
      throw error;
    }
  };

  // Handle edit
  const handleEdit = async (promoterId: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}`);
      const data = await response.json();

      if (data.promoter) {
        // Convert ISO strings back to Date objects
        const promoter = data.promoter;
        const formData = {
          ...promoter,
          id_card_expiry_date: promoter.id_card_expiry_date
            ? new Date(promoter.id_card_expiry_date)
            : undefined,
          passport_expiry_date: promoter.passport_expiry_date
            ? new Date(promoter.passport_expiry_date)
            : undefined,
          visa_expiry_date: promoter.visa_expiry_date
            ? new Date(promoter.visa_expiry_date)
            : undefined,
          work_permit_expiry_date: promoter.work_permit_expiry_date
            ? new Date(promoter.work_permit_expiry_date)
            : undefined,
          date_of_birth: promoter.date_of_birth
            ? new Date(promoter.date_of_birth)
            : undefined,
        };

        setEditingPromoter(formData);
        setEditingPromoterId(promoterId);
        setIsFormOpen(true);
      } else {
        toast.error('Failed to fetch promoter details');
      }
    } catch (error) {
      console.error('Error fetching promoter:', error);
      toast.error('An error occurred while fetching promoter details');
    }
  };

  // Handle delete
  const handleDelete = async (promoterId: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete promoter');
      }

      await fetchPromoters();
      toast.success('Promoter deleted successfully');
    } catch (error) {
      console.error('Error deleting promoter:', error);
      toast.error('Failed to delete promoter');
      throw error;
    }
  };

  // Handle view
  const handleView = (promoterId: string) => {
    router.push(`/manage-promoters/${promoterId}`);
  };

  // Handle opening create form
  const handleOpenCreateForm = () => {
    setEditingPromoterId(null);
    setEditingPromoter(null);
    setIsFormOpen(true);
  };

  // Handle closing form
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPromoterId(null);
    setEditingPromoter(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comprehensive Promoters Management</h1>
        <p className="text-muted-foreground mt-2">
          A complete example of promoter management with form and table components
        </p>
      </div>

      {/* Table */}
      <PromotersTable
        promoters={promoters}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onRefresh={fetchPromoters}
        isLoading={isLoading}
      />

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromoterId ? 'Edit Promoter' : 'Add New Promoter'}
            </DialogTitle>
            <DialogDescription>
              {editingPromoterId
                ? 'Update the promoter information below.'
                : 'Fill in the details to create a new promoter.'}
            </DialogDescription>
          </DialogHeader>
          <PromoterFormComprehensive
            initialData={editingPromoter}
            {...(editingPromoterId && { promoterId: editingPromoterId })}
            onSubmit={editingPromoterId ? handleUpdate : handleCreate}
            onCancel={handleCloseForm}
            mode={editingPromoterId ? 'edit' : 'create'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

