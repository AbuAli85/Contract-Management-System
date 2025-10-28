import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ratelimit, getClientIdentifier } from '@/lib/rate-limit'; // Changed from ratelimitStrict (10/min) to ratelimit (60/min)
import { z } from 'zod';

// Helper function to generate default messages
function generateDefaultMessage(type: string, promoterName: string): string {
  switch (type) {
    case 'urgent':
      return `Urgent notification for ${promoterName}. Please check your documents and contracts.`;
    case 'reminder':
    case 'document_reminder':
      return `Reminder: Please review and update your documents.`;
    case 'standard':
    case 'info':
      return `This is a notification from SmartPro Contract Management System.`;
    case 'warning':
      return `Important: Please review your account and documents.`;
    default:
      return `Notification for ${promoterName}.`;
  }
}

// Fetch detailed promoter information for professional emails
async function fetchPromoterDetails(supabase: any, promoterId: string) {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    // Get promoter basic info
    const { data: promoter } = await supabase
      .from('promoters')
      .select('status, id_card_expiry_date, passport_expiry_date, employer_id')
      .eq('id', promoterId)
      .single();

    // Get current contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, contract_type, status, employer_id, start_date, basic_salary, currency')
      .eq('promoter_id', promoterId)
      .in('status', ['active', 'pending', 'pending_approval'])
      .order('created_at', { ascending: false })
      .limit(5);

    // Get employer info for contracts
    const { data: employers } = await supabase
      .from('parties')
      .select('id, name_en, name_ar')
      .in('id', contracts?.map((c: any) => c.employer_id).filter(Boolean) || []);

    // Calculate document status
    const idCardExpiry = promoter?.id_card_expiry_date ? new Date(promoter.id_card_expiry_date) : null;
    const passportExpiry = promoter?.passport_expiry_date ? new Date(promoter.passport_expiry_date) : null;

    const getDaysRemaining = (date: Date | null) => {
      if (!date) return null;
      return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const idCardDays = getDaysRemaining(idCardExpiry);
    const passportDays = getDaysRemaining(passportExpiry);

    // Build expiring documents list
    const expiringDocuments = [];
    if (idCardDays !== null && idCardDays < 90) {
      expiringDocuments.push({
        type: 'ID Card',
        expiryDate: idCardExpiry!.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        daysRemaining: idCardDays,
      });
    }
    if (passportDays !== null && passportDays < 90) {
      expiringDocuments.push({
        type: 'Passport',
        expiryDate: passportExpiry!.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        daysRemaining: passportDays,
      });
    }

    // Build pending contracts list
    const pendingContracts = contracts?.map((contract: any) => {
      const employer = employers?.find((e: any) => e.id === contract.employer_id);
      return {
        id: contract.id,
        type: contract.contract_type || 'Employment Contract',
        status: contract.status,
        employer: employer?.name_en || employer?.name_ar || 'Employer',
      };
    }) || [];

    // Build missing documents list
    const missingDocuments = [];
    if (!idCardExpiry) missingDocuments.push('ID Card (not uploaded or no expiry date)');
    if (!passportExpiry) missingDocuments.push('Passport (not uploaded or no expiry date)');

    // Build action items
    const actionItems = [];
    if (expiringDocuments.length > 0) {
      actionItems.push(`Upload renewed documents (${expiringDocuments.length} expiring soon)`);
    }
    if (pendingContracts.length > 0) {
      actionItems.push(`Review and sign pending contracts (${pendingContracts.length} waiting)`);
    }
    if (missingDocuments.length > 0) {
      actionItems.push(`Upload missing documents`);
    }
    if (actionItems.length === 0) {
      actionItems.push('Keep your profile and documents up to date');
    }

    // Get current contract details
    const currentContract = contracts?.[0] ? {
      type: contracts[0].contract_type || 'Employment Contract',
      employer: employers?.find((e: any) => e.id === contracts[0].employer_id)?.name_en || 'Employer',
      startDate: contracts[0].start_date ? new Date(contracts[0].start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : undefined,
      salary: contracts[0].basic_salary ? `${contracts[0].basic_salary} ${contracts[0].currency || 'OMR'}` : undefined,
    } : null;

    return {
      expiringDocuments: expiringDocuments.length > 0 ? expiringDocuments : undefined,
      pendingContracts: pendingContracts.length > 0 ? pendingContracts : undefined,
      missingDocuments: missingDocuments.length > 0 ? missingDocuments : undefined,
      actionItems: actionItems.length > 0 ? actionItems : undefined,
      currentContract,
      status: promoter?.status || 'Active',
      assignmentStatus: contracts && contracts.length > 0 ? 'Assigned' : 'Available',
      idCardStatus: idCardDays === null ? 'Not Uploaded' : idCardDays < 0 ? 'Expired' : idCardDays < 30 ? 'Expiring Soon' : 'Valid',
      passportStatus: passportDays === null ? 'Not Uploaded' : passportDays < 0 ? 'Expired' : passportDays < 30 ? 'Expiring Soon' : 'Valid',
      idCardExpiry: idCardExpiry?.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      passportExpiry: passportExpiry?.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    };
  } catch (error) {
    console.error('Error fetching promoter details:', error);
    return {
      status: 'Active',
      assignmentStatus: 'Unknown',
      idCardStatus: 'Unknown',
      passportStatus: 'Unknown',
    };
  }
}

const notifySchema = z.object({
  message: z.string().min(1).max(1000).optional(),
  type: z.enum(['urgent', 'info', 'warning', 'standard', 'reminder', 'document_reminder']).default('info'),
  sendEmail: z.boolean().default(true),
  sendSms: z.boolean().default(false),
  // Don't validate email/promoterName from client - we fetch from database
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting (60 requests/minute for admin notifications)
    const identifier = getClientIdentifier(request);
    const { success } = await ratelimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication and authorization
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions (simplified for now)
    // In a real implementation, you would check the user's role from the database
    // For now, we'll allow authenticated users to send notifications

    // Validate input
    const body = await request.json();
    const validatedData = notifySchema.parse(body);

    // Get promoter details - use admin client to bypass RLS
    const supabaseAdmin = getSupabaseAdmin();
    const { data: promoterData, error: promoterError } = await supabaseAdmin
      .from('promoters')
      .select('name_en, name_ar, email, phone, mobile_number')
      .eq('id', params.id)
      .single();

    if (promoterError || !promoterData) {
      console.error('Error fetching promoter:', promoterError);
      return NextResponse.json(
        { 
          error: 'Promoter not found',
          details: promoterError?.message,
          promoterId: params.id
        },
        { status: 404 }
      );
    }

    // Type-safe promoter object with name and contact info
    const promoter = {
      full_name: (promoterData as any).name_en || (promoterData as any).name_ar || 'Unknown',
      email: (promoterData as any).email as string | null,
      phone: (promoterData as any).phone || (promoterData as any).mobile_number,
    };

    // Generate appropriate message based on type if not provided
    const message = validatedData.message || generateDefaultMessage(validatedData.type, promoter.full_name);

    // Send detailed notification email
    if (validatedData.sendEmail && promoter.email) {
      try {
        const { sendEmail } = await import('@/lib/services/email.service');
        
        // Fetch detailed information about the promoter
        const promoterDetails = await fetchPromoterDetails(supabaseAdmin, params.id);
        
        let emailContent;
        
        // Send appropriate detailed email based on type
        if (validatedData.type === 'urgent') {
          const { urgentNotificationEmail } = await import('@/lib/email-templates/urgent-notification');
          emailContent = urgentNotificationEmail({
            promoterName: promoter.full_name,
            reason: 'Immediate action required for documents and contracts',
            details: {
              ...(promoterDetails.expiringDocuments && { expiringDocuments: promoterDetails.expiringDocuments }),
              ...(promoterDetails.pendingContracts && { pendingContracts: promoterDetails.pendingContracts }),
              ...(promoterDetails.missingDocuments && { missingDocuments: promoterDetails.missingDocuments }),
              ...(promoterDetails.actionItems && { actionItems: promoterDetails.actionItems }),
            },
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io'}/en/profile`,
          });
        } else if (validatedData.type === 'document_reminder' || validatedData.type === 'reminder') {
          const { documentExpiryEmail } = await import('@/lib/email-templates/document-expiry');
          
          // Find the most urgent expiring document
          const mostUrgentDoc = promoterDetails.expiringDocuments?.[0];
          
          if (mostUrgentDoc) {
            emailContent = documentExpiryEmail({
              promoterName: promoter.full_name,
              documentType: mostUrgentDoc.type as 'ID Card' | 'Passport',
              expiryDate: mostUrgentDoc.expiryDate,
              daysRemaining: mostUrgentDoc.daysRemaining,
              urgent: mostUrgentDoc.daysRemaining < 30,
            });
          }
        } else {
          // Standard or info notification with full details
          const { standardNotificationEmail } = await import('@/lib/email-templates/standard-notification');
          emailContent = standardNotificationEmail({
            promoterName: promoter.full_name,
            title: validatedData.type === 'warning' ? 'Important Update' : 'Notification',
            message: message,
            details: {
              ...(promoterDetails.currentContract && {
                contractInfo: {
                  type: promoterDetails.currentContract.type,
                  employer: promoterDetails.currentContract.employer,
                  ...(promoterDetails.currentContract.startDate && { startDate: promoterDetails.currentContract.startDate }),
                  ...(promoterDetails.currentContract.salary && { salary: promoterDetails.currentContract.salary }),
                }
              }),
              documentStatus: {
                idCardStatus: promoterDetails.idCardStatus,
                passportStatus: promoterDetails.passportStatus,
                ...(promoterDetails.idCardExpiry && { idCardExpiry: promoterDetails.idCardExpiry }),
                ...(promoterDetails.passportExpiry && { passportExpiry: promoterDetails.passportExpiry }),
              },
              accountInfo: {
                status: promoterDetails.status,
                assignmentStatus: promoterDetails.assignmentStatus,
              },
            },
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io'}/en/profile`,
            actionText: 'View Your Profile',
          });
        }

        // Send the email if content was generated
        if (emailContent) {
          await sendEmail({
            to: promoter.email,
            ...emailContent,
          });
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create notification record
    const notification = {
      id: notificationId,
      promoter_id: params.id,
      user_id: user.id,
      type: validatedData.type,
      message: message,
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        promoter_id: params.id,
        type: validatedData.type,
        message: message,
        status: 'sent',
        created_at: notification.created_at,
      },
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Error in notify promoter API:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
