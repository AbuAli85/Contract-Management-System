'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Contract {
  id: string;
  contract_number: string;
  pdf_url?: string | null;
  google_drive_url?: string | null;
  pdf_status?: 'pending' | 'generating' | 'generated' | 'error' | null;
  pdf_error_message?: string | null;
  pdf_generated_at?: string | null;
}

interface GenerateContractPDFButtonProps {
  contract: Contract;
  onSuccess?: () => void;
}

export function GenerateContractPDFButton({
  contract,
  onSuccess,
}: GenerateContractPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  const hasPDF = contract.pdf_url && contract.pdf_status === 'generated';
  const isGeneratingStatus = contract.pdf_status === 'generating';
  const hasError = contract.pdf_status === 'error';

  const handleGenerate = async () => {
    // If PDF exists, show confirmation dialog
    if (hasPDF) {
      setShowRegenerateDialog(true);
      return;
    }

    await generatePDF();
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    setShowRegenerateDialog(false);

    try {
      const response = await fetch(
        `/api/contracts/${contract.id}/generate-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        const errorMessage =
          error.details ||
          error.message ||
          error.error ||
          'Failed to generate PDF';
        console.error('PDF generation error response:', error);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      toast.success('PDF Generation Started', {
        description:
          "Your contract PDF is being generated. You'll be notified when it's ready.",
      });

      // Poll for status updates
      pollGenerationStatus();

      onSuccess?.();
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Generation Failed', {
        description:
          error instanceof Error ? error.message : 'Failed to generate PDF',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const pollGenerationStatus = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/contracts/${contract.id}`);
        const updated = await response.json();

        if (updated.pdf_status === 'generated') {
          clearInterval(interval);
          toast.success('PDF Ready!', {
            description: 'Your contract PDF has been generated successfully.',
            action: {
              label: 'Download',
              onClick: () => window.open(updated.pdf_url, '_blank'),
            },
          });
          onSuccess?.();
        } else if (updated.pdf_status === 'error') {
          clearInterval(interval);
          toast.error('Generation Failed', {
            description:
              updated.pdf_error_message ||
              'An error occurred during PDF generation.',
          });
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  };

  if (isGeneratingStatus) {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <RefreshCw className='h-4 w-4 animate-spin' />
        <span>Generating PDF...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          <RefreshCw className='mr-2 h-4 w-4' />
          Retry Generation
        </Button>
        <div className='flex items-center gap-1 text-sm text-destructive'>
          <AlertCircle className='h-4 w-4' />
          <span>Failed</span>
        </div>
      </div>
    );
  }

  const handleDownloadPDF = async (pdfUrl: string) => {
    if (!pdfUrl) {
      toast.error('No PDF Available', {
        description: 'PDF URL is not available',
      });
      return;
    }

    try {
      // Use the internal API endpoint that fetches from storage
      const apiUrl = `/api/contracts/${contract.id}/pdf/view`;
      console.log('📥 Downloading PDF via API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || errorData.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract.contract_number || contract.id}-contract.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('PDF Downloaded', {
        description: 'Contract PDF downloaded successfully',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download Failed', {
        description:
          error instanceof Error ? error.message : 'Failed to download PDF',
      });
    }
  };

  if (hasPDF) {
    return (
      <>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handleDownloadPDF(contract.pdf_url!)}
            disabled={isGenerating}
          >
            <Download className='mr-2 h-4 w-4' />
            Download PDF
          </Button>

          {contract.google_drive_url && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => window.open(contract.google_drive_url!, '_blank')}
            >
              <ExternalLink className='mr-2 h-4 w-4' />
              Open in Drive
            </Button>
          )}

          <Button
            variant='ghost'
            size='sm'
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            Regenerate
          </Button>
        </div>

        <Dialog
          open={showRegenerateDialog}
          onOpenChange={setShowRegenerateDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Regenerate Contract PDF?</DialogTitle>
              <DialogDescription>
                This will create a new PDF and overwrite the existing one. The
                current PDF will be replaced. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setShowRegenerateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={generatePDF} disabled={isGenerating}>
                {isGenerating && (
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                )}
                Yes, Regenerate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button
      variant='default'
      size='sm'
      onClick={handleGenerate}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
          Generating...
        </>
      ) : (
        <>
          <FileText className='mr-2 h-4 w-4' />
          Generate PDF
        </>
      )}
    </Button>
  );
}
