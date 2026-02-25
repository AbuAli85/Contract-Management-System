/**
 * Contract Notification Service
 *
 * Unified service that ties together:
 *   1. Native PDF generation via jsPDF (lib/pdf-generator.ts)
 *   2. Supabase Storage upload
 *   3. Email delivery via Resend (lib/services/email.service.ts)
 *
 * Usage:
 *   const service = new ContractNotificationService(supabaseClient);
 *   await service.sendContractReady({ contractId, recipientEmail, recipientName });
 */

import { generateContractPDF } from '@/lib/pdf-generator';
import { sendEmail } from '@/lib/services/email.service';
import { contractReadyEmail } from '@/lib/email-templates/contract-ready';
import { contractApprovalEmail } from '@/lib/email-templates/contract-approval';
import { contractStatusChangeEmail } from '@/lib/email-templates/contract-status-change';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ContractReadyNotificationInput {
  /** Supabase contract ID */
  contractId: string;
  /** Recipient email address */
  recipientEmail: string;
  /** Recipient display name */
  recipientName: string;
  /** Optional: pre-fetched contract data (avoids an extra DB round-trip) */
  contractData?: ContractRow;
  /** Optional: base URL for the portal (defaults to NEXT_PUBLIC_SITE_URL) */
  portalBaseUrl?: string;
}

export interface ContractApprovalNotificationInput {
  contractId: string;
  contractNumber: string;
  contractType: string;
  partyName: string;
  amount?: string;
  startDate?: string;
  approverEmail: string;
  approverName: string;
  portalBaseUrl?: string;
}

export interface ContractStatusNotificationInput {
  contractId: string;
  contractNumber: string;
  contractType: string;
  newStatus: string;
  recipientEmail: string;
  recipientName: string;
  changedBy?: string;
  notes?: string;
  portalBaseUrl?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  pdfUrl?: string;
  error?: string;
}

// Minimal contract row shape returned by Supabase
interface ContractRow {
  id: string;
  contract_number: string;
  contract_type?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  basic_salary?: number | null;
  currency?: string | null;
  pdf_url?: string | null;
  first_party?: { name_en: string } | null;
  second_party?: { name_en: string } | null;
  promoter?: { name_en: string; email?: string | null } | null;
  // allow arbitrary additional fields
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

export class ContractNotificationService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly supabase: any) {}

  // ── Private helpers ────────────────────────────────────────────────────────

  private portalUrl(base?: string): string {
    return (
      base ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://portal.thesmartpro.io'
    );
  }

  /**
   * Fetch a contract row with all relations needed for PDF generation and email.
   */
  private async fetchContract(contractId: string): Promise<ContractRow | null> {
    const { data, error } = await this.supabase
      .from('contracts')
      .select(
        `
        id,
        contract_number,
        contract_type,
        contract_start_date,
        contract_end_date,
        basic_salary,
        currency,
        pdf_url,
        first_party:first_party_id (
          name_en, crn, address_en, contact_person, contact_email, contact_phone
        ),
        second_party:second_party_id (
          name_en, contact_person, contact_email, contact_phone
        ),
        promoter:promoter_id (
          name_en, mobile_number, email
        )
      `
      )
      .eq('id', contractId)
      .single();

    if (error) {
      return null;
    }
    return data as ContractRow;
  }

  /**
   * Generate a PDF for the contract and upload it to Supabase Storage.
   * Returns the public URL of the uploaded PDF.
   */
  private async generateAndUploadPdf(
    contract: ContractRow
  ): Promise<string | null> {
    try {
      // Generate PDF buffer
      const pdfBuffer = await generateContractPDF(
        contract as Parameters<typeof generateContractPDF>[0]
      );

      // Upload to Supabase Storage
      const fileName = `contracts/${contract.id}/contract-${contract.contract_number}-${Date.now()}.pdf`;
      const { error: uploadError } = await this.supabase.storage
        .from('contract-pdfs')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = this.supabase.storage.from('contract-pdfs').getPublicUrl(fileName);

      // Persist the URL back to the contracts table
      await this.supabase
        .from('contracts')
        .update({ pdf_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', contract.id);

      return publicUrl;
    } catch (err) {
      return null;
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Generate a PDF for the contract and send a "Contract Ready" email.
   */
  async sendContractReady(
    input: ContractReadyNotificationInput
  ): Promise<NotificationResult> {
    try {
      // 1. Resolve contract data
      const contract =
        input.contractData || (await this.fetchContract(input.contractId));
      if (!contract) {
        return { success: false, error: 'Contract not found' };
      }

      // 2. Generate PDF (or reuse existing URL)
      let pdfUrl = contract.pdf_url as string | null;
      if (!pdfUrl) {
        pdfUrl = await this.generateAndUploadPdf(contract);
      }
      if (!pdfUrl) {
        return { success: false, error: 'PDF generation failed' };
      }

      // 3. Build email
      const emailContent = contractReadyEmail({
        recipientName: input.recipientName,
        contractNumber: contract.contract_number,
        contractType: contract.contract_type || 'Employment Contract',
        firstPartyName: (contract.first_party as { name_en: string } | null)
          ?.name_en,
        secondPartyName: (contract.second_party as { name_en: string } | null)
          ?.name_en,
        promoterName: (contract.promoter as { name_en: string } | null)
          ?.name_en,
        startDate: contract.contract_start_date as string | undefined,
        endDate: contract.contract_end_date as string | undefined,
        basicSalary: contract.basic_salary as number | undefined,
        currency: contract.currency as string | undefined,
        pdfUrl,
        portalUrl: `${this.portalUrl(input.portalBaseUrl)}/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en'}/dashboard`,
      });

      // 4. Send email
      const result = await sendEmail({
        to: input.recipientEmail,
        ...emailContent,
      });

      if (!result.success) {
        return { success: false, pdfUrl, error: result.error };
      }

      return { success: true, messageId: result.messageId, pdfUrl };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  /**
   * Send a "Contract Approval Required" email to an approver.
   */
  async sendApprovalRequest(
    input: ContractApprovalNotificationInput
  ): Promise<NotificationResult> {
    try {
      const actionUrl = `${this.portalUrl(input.portalBaseUrl)}/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en'}/dashboard/approvals?contract=${input.contractId}`;

      const emailContent = contractApprovalEmail({
        recipientName: input.approverName,
        contractId: input.contractNumber,
        contractType: input.contractType,
        partyName: input.partyName,
        amount: input.amount,
        startDate: input.startDate,
        actionUrl,
      });

      const result = await sendEmail({
        to: input.approverEmail,
        ...emailContent,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, messageId: result.messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }

  /**
   * Send a "Contract Status Changed" notification email.
   */
  async sendStatusChange(
    input: ContractStatusNotificationInput
  ): Promise<NotificationResult> {
    try {
      const actionUrl = `${this.portalUrl(input.portalBaseUrl)}/${process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en'}/dashboard/contracts/${input.contractId}`;

      const emailContent = contractStatusChangeEmail({
        recipientName: input.recipientName,
        contractNumber: input.contractNumber,
        contractTitle: input.contractType,
        oldStatus: 'pending',
        newStatus: input.newStatus,
        changedBy: input.changedBy || 'System',
        reason: input.notes,
        contractUrl: actionUrl,
      });

      const result = await sendEmail({
        to: input.recipientEmail,
        ...emailContent,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, messageId: result.messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a ContractNotificationService from a Supabase server client.
 *
 * @example
 * ```ts
 * import { createClient } from '@/lib/supabase/server';
 * import { createContractNotificationService } from '@/lib/services/contract-notification.service';
 *
 * const supabase = await createClient();
 * const notifier = createContractNotificationService(supabase);
 * await notifier.sendContractReady({ contractId, recipientEmail, recipientName });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createContractNotificationService(
  supabase: any
): ContractNotificationService {
  return new ContractNotificationService(supabase);
}
