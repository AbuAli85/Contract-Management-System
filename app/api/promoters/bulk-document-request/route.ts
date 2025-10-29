/**
 * API Route: Bulk Document Request
 * POST /api/promoters/bulk-document-request
 * 
 * Sends document requests to multiple promoters at once
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendDocumentRequest, sendBulkNotifications } from '@/lib/services/promoter-notification.service';
import type { BulkNotificationConfig } from '@/lib/services/promoter-notification.service';

const requestSchema = {
  promoterIds: 'string[]', // required
  documentType: ['id_card', 'passport', 'both'], // required
  priority: ['low', 'medium', 'high', 'urgent'], // optional, default: 'medium'
  reason: 'string', // optional
  deadline: 'string', // optional, ISO date string
  sendEmail: 'boolean', // optional, default: true
  sendSms: 'boolean', // optional, default: false
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.promoterIds || !Array.isArray(body.promoterIds) || body.promoterIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'promoterIds array is required' },
        { status: 400 }
      );
    }

    if (!body.documentType || !['id_card', 'passport', 'both'].includes(body.documentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid documentType. Must be: id_card, passport, or both' },
        { status: 400 }
      );
    }

    const {
      promoterIds,
      documentType,
      priority = 'medium',
      reason,
      deadline,
      sendEmail = true,
      sendSms = false
    } = body;

    // Validate at least one notification channel is selected
    if (!sendEmail && !sendSms) {
      return NextResponse.json(
        { success: false, error: 'At least one notification channel (email or SMS) must be selected' },
        { status: 400 }
      );
    }

    console.log(`📤 Processing bulk document request for ${promoterIds.length} promoters...`);

    // Get promoter information
    const supabase = await createClient();
    const { data: promoters, error: fetchError } = await supabase
      .from('promoters')
      .select('id, full_name, email, phone_number')
      .in('id', promoterIds);

    if (fetchError) {
      console.error('Error fetching promoters:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch promoter information' },
        { status: 500 }
      );
    }

    if (!promoters || promoters.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No promoters found with the provided IDs' },
        { status: 404 }
      );
    }

    const results = {
      totalCount: promoters.length,
      successCount: 0,
      failureCount: 0,
      emailsSent: 0,
      smsSent: 0,
      errors: [] as string[],
      details: [] as Array<{
        promoterId: string;
        promoterName: string;
        success: boolean;
        error?: string;
        channels: {
          email: boolean;
          sms: boolean;
        };
      }>
    };

    // Determine which documents to request
    const documentsToRequest: Array<'id_card' | 'passport'> = 
      documentType === 'both' ? ['id_card', 'passport'] : [documentType];

    // Send requests to each promoter
    for (const promoter of promoters) {
        const promoterResult = {
          promoterId: promoter.id,
          promoterName: promoter.full_name,
          success: true,
          error: undefined as string | undefined,
          channels: {
            email: false,
            sms: false
          }
        };
        
      try {
        // Send request for each document type
        for (const docType of documentsToRequest) {
          const requestResult = await sendDocumentRequest({
            promoterId: promoter.id,
            documentType: docType,
            reason,
            deadline,
            priority: priority as 'low' | 'medium' | 'high' | 'urgent'
          });

          if (requestResult.success) {
            // Track which channels were successful
            if (requestResult.sent?.email) {
              promoterResult.channels.email = true;
              results.emailsSent++;
            }
            if (requestResult.sent?.sms) {
              promoterResult.channels.sms = true;
              results.smsSent++;
            }
          } else {
            promoterResult.success = false;
            const errorMsg = `Failed for ${promoter.full_name}: ${requestResult.error}`;
            results.errors.push(errorMsg);
            console.error(errorMsg);
          }
        }

        if (promoterResult.success) {
          results.successCount++;
        } else {
          results.failureCount++;
        }

      } catch (error) {
        promoterResult.success = false;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        promoterResult.error = errorMsg;
        results.errors.push(`Error for ${promoter.full_name}: ${errorMsg}`);
        results.failureCount++;
        console.error(`Error sending request to ${promoter.full_name}:`, error);
      }

      results.details.push(promoterResult as any);
    }

    // Log summary
    console.log(`✅ Bulk document request completed:`, {
      totalCount: results.totalCount,
      successCount: results.successCount,
      failureCount: results.failureCount,
      emailsSent: results.emailsSent,
      smsSent: results.smsSent
    });

    return NextResponse.json({
      success: true,
      message: `Document requests sent to ${results.successCount} of ${results.totalCount} promoters`,
      results: {
        totalCount: results.totalCount,
        successCount: results.successCount,
        failureCount: results.failureCount,
        emailsSent: results.emailsSent,
        smsSent: results.smsSent,
        details: results.details
      },
      errors: results.errors.length > 0 ? results.errors : undefined
    });

  } catch (error) {
    console.error('Error in bulk document request:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/promoters/bulk-document-request
 * Returns information about bulk document request capabilities
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/promoters/bulk-document-request',
    method: 'POST',
    description: 'Send document requests to multiple promoters at once',
    schema: requestSchema,
    example: {
      promoterIds: ['uuid-1', 'uuid-2', 'uuid-3'],
      documentType: 'id_card',
      priority: 'high',
      reason: 'Document renewal required for contract assignment',
      deadline: '2025-11-15',
      sendEmail: true,
      sendSms: false
    }
  });
}

