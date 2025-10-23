/**
 * PDF Download Utility
 * Handles contract PDF downloads from Make.com webhook URLs
 */

import { toast } from 'sonner';

export interface ContractPDFData {
  contract_id: string;
  contract_number: string;
  pdf_url?: string | undefined;
  google_drive_url?: string | undefined;
  status?: string | undefined;
}

/**
 * Download PDF from Supabase storage or Google Drive
 */
export async function downloadContractPDF(
  contract: ContractPDFData,
  fileName?: string
): Promise<boolean> {
  try {
    // Determine which URL to use (prefer pdf_url from Supabase)
    const downloadUrl = contract.pdf_url || contract.google_drive_url;

    if (!downloadUrl) {
      toast.error('No PDF URL Available', {
        description: 'This contract does not have a PDF file yet.',
      });
      return false;
    }

    // Show loading toast
    const loadingToast = toast.loading('Downloading PDF...', {
      description: `Preparing ${contract.contract_number || 'contract'} for download`,
    });

    // If it's a Google Drive URL, convert to direct download link
    let finalUrl = downloadUrl;
    if (downloadUrl.includes('docs.google.com')) {
      // Extract document ID from Google Drive URL
      const docIdMatch = downloadUrl.match(/\/d\/([^\/]+)/);
      if (docIdMatch) {
        const docId = docIdMatch[1];
        // Convert to export URL for PDF download
        finalUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;
      }
    }

    // Fetch the PDF
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Create blob from response
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `${contract.contract_number || contract.contract_id}-contract.pdf`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Dismiss loading toast and show success
    toast.dismiss(loadingToast);
    toast.success('✅ Download Successful', {
      description: `${contract.contract_number || 'Contract'} PDF downloaded successfully`,
    });

    return true;
  } catch (error) {
    console.error('PDF download error:', error);
    toast.error('❌ Download Failed', {
      description: error instanceof Error ? error.message : 'Failed to download contract PDF',
    });
    return false;
  }
}

/**
 * Open PDF in new tab for preview
 */
export function previewContractPDF(contract: ContractPDFData): void {
  const viewUrl = contract.pdf_url || contract.google_drive_url;

  if (!viewUrl) {
    toast.error('No PDF Available', {
      description: 'This contract does not have a PDF file yet.',
    });
    return;
  }

  // Open in new tab
  window.open(viewUrl, '_blank', 'noopener,noreferrer');

  toast.success('Opening PDF Preview', {
    description: 'PDF is opening in a new tab',
  });
}

/**
 * Check if contract has PDF available
 */
export function hasPDFAvailable(contract: ContractPDFData): boolean {
  return !!(contract.pdf_url || contract.google_drive_url);
}

/**
 * Get PDF status icon and color
 */
export function getPDFStatus(contract: ContractPDFData): {
  available: boolean;
  color: string;
  label: string;
} {
  if (contract.pdf_url) {
    return {
      available: true,
      color: 'text-green-600',
      label: 'PDF Ready (Supabase)',
    };
  }

  if (contract.google_drive_url) {
    return {
      available: true,
      color: 'text-blue-600',
      label: 'PDF Ready (Google Drive)',
    };
  }

  if (contract.status === 'processing' || contract.status === 'pending') {
    return {
      available: false,
      color: 'text-yellow-600',
      label: 'Generating...',
    };
  }

  return {
    available: false,
    color: 'text-gray-400',
    label: 'No PDF',
  };
}

/**
 * Download multiple contracts as ZIP
 */
export async function downloadMultipleContracts(
  contracts: ContractPDFData[]
): Promise<void> {
  toast.loading('Preparing bulk download...', {
    description: `Downloading ${contracts.length} contracts`,
  });

  // Download contracts one by one
  for (const contract of contracts) {
    if (hasPDFAvailable(contract)) {
      await downloadContractPDF(contract);
      // Add small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  toast.success('Bulk Download Complete', {
    description: `Downloaded ${contracts.length} contract(s)`,
  });
}

