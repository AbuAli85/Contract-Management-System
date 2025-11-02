'use client';

import React, { useState } from 'react';
import { Trash2, Edit, Download, Eye, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  PromoterDocumentsService,
  PromoterDocument,
} from '@/lib/services/promoter-documents.service';
import { formatDistanceToNow } from 'date-fns';

interface PromoterDocumentManagerProps {
  promoterId: string;
  documents: PromoterDocument[];
  onDocumentsChange?: () => void;
}

export function PromoterDocumentManager({
  promoterId,
  documents: initialDocuments,
  onDocumentsChange,
}: PromoterDocumentManagerProps) {
  const [documents, setDocuments] = useState<PromoterDocument[]>(initialDocuments);
  const [editingDocument, setEditingDocument] = useState<PromoterDocument | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<PromoterDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    document_type: '',
    file_name: '',
    notes: '',
  });
  const { toast } = useToast();

  // Handle edit dialog open
  const handleEditClick = (document: PromoterDocument) => {
    setEditingDocument(document);
    setEditFormData({
      document_type: document.document_type,
      file_name: document.file_name,
      notes: document.notes || '',
    });
  };

  // Handle edit form submission
  const handleUpdateDocument = async () => {
    if (!editingDocument) return;

    setIsLoading(true);
    try {
      const updatedDocument = await PromoterDocumentsService.updateDocument(
        promoterId,
        {
          documentId: editingDocument.id,
          ...editFormData,
        }
      );

      // Update local state
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === updatedDocument.id ? updatedDocument : doc))
      );

      toast({
        title: 'Success',
        description: 'Document updated successfully',
      });

      setEditingDocument(null);
      onDocumentsChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update document',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (document: PromoterDocument) => {
    setDeletingDocument(document);
  };

  // Handle delete action
  const handleDeleteDocument = async () => {
    if (!deletingDocument) return;

    setIsLoading(true);
    try {
      await PromoterDocumentsService.deleteDocument(promoterId, deletingDocument.id);

      // Update local state
      setDocuments((prev) => prev.filter((doc) => doc.id !== deletingDocument.id));

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      setDeletingDocument(null);
      onDocumentsChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle download
  const handleDownload = (document: PromoterDocument) => {
    window.open(document.file_path, '_blank');
  };

  // Handle view
  const handleView = (document: PromoterDocument) => {
    window.open(document.file_path, '_blank');
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      id_card: 'ID Card',
      passport: 'Passport',
      visa: 'Visa',
      work_permit: 'Work Permit',
      certificate: 'Certificate',
      contract: 'Contract',
      insurance: 'Insurance',
      medical: 'Medical',
      other: 'Other',
    };
    return labels[type] || type;
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documents uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((document) => (
          <Card key={document.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">
                    {getDocumentTypeLabel(document.document_type)}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {document.file_name}
                  </CardDescription>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {document.notes && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {document.notes}
                </p>
              )}
              <div className="text-xs text-muted-foreground mb-4">
                Uploaded{' '}
                {formatDistanceToNow(new Date(document.created_at), {
                  addSuffix: true,
                })}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleView(document)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(document)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditClick(document)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteClick(document)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="document_type">Document Type</Label>
              <Input
                id="document_type"
                value={editFormData.document_type}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    document_type: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="file_name">File Name</Label>
              <Input
                id="file_name"
                value={editFormData.file_name}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    file_name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingDocument(null)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateDocument} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingDocument}
        onOpenChange={() => setDeletingDocument(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document &quot;
              {deletingDocument?.file_name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

