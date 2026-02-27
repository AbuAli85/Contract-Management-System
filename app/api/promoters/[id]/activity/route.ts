import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface ActivityItem {
  id: string;
  type: 'contract' | 'document' | 'communication' | 'system' | 'status_change';
  action: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: promoterId } = await params;
    if (!promoterId) {
      return NextResponse.json({ error: 'Promoter ID is required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Fetch activities in parallel
    const [auditLogsResult, contractsResult, documentsResult, communicationsResult] =
      await Promise.allSettled([
        supabase
          .from('audit_logs')
          .select('id, action, table_name, record_id, new_values, old_values, created_at, user_id')
          .eq('table_name', 'promoters')
          .eq('record_id', promoterId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('contracts')
          .select('id, title, status, created_at, updated_at, contract_number')
          .eq('promoter_id', promoterId)
          .order('updated_at', { ascending: false })
          .limit(10),
        supabase
          .from('promoter_documents')
          .select('id, document_type, file_name, created_at, expiry_date')
          .eq('promoter_id', promoterId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('promoter_communications')
          .select('id, type, subject, communication_time')
          .eq('promoter_id', promoterId)
          .order('communication_time', { ascending: false })
          .limit(10),
      ]);

    const activities: ActivityItem[] = [];

    // Process audit logs
    if (auditLogsResult.status === 'fulfilled' && auditLogsResult.value.data) {
      auditLogsResult.value.data.forEach((log) => {
        activities.push({
          id: `audit-${log.id}`,
          type: 'system',
          action: `${log.action.charAt(0).toUpperCase() + log.action.slice(1)} Promoter`,
          description: `Promoter profile was ${log.action}d`,
          timestamp: log.created_at,
          metadata: { action: log.action, userId: log.user_id },
        });
      });
    }

    // Process contracts
    if (contractsResult.status === 'fulfilled' && contractsResult.value.data) {
      contractsResult.value.data.forEach((contract) => {
        activities.push({
          id: `contract-${contract.id}`,
          type: 'contract',
          action: 'Contract Activity',
          description: `Contract "${contract.contract_number || contract.title || contract.id}" — Status: ${contract.status}`,
          timestamp: contract.updated_at || contract.created_at,
          metadata: { contractId: contract.id, status: contract.status },
        });
      });
    }

    // Process documents
    if (documentsResult.status === 'fulfilled' && documentsResult.value.data) {
      documentsResult.value.data.forEach((doc) => {
        activities.push({
          id: `doc-${doc.id}`,
          type: 'document',
          action: 'Document Uploaded',
          description: `${doc.document_type || 'Document'}: ${doc.file_name || doc.id}`,
          timestamp: doc.created_at,
          metadata: { documentId: doc.id, expiryDate: doc.expiry_date },
        });
      });
    }

    // Process communications
    if (communicationsResult.status === 'fulfilled' && communicationsResult.value.data) {
      communicationsResult.value.data.forEach((comm) => {
        activities.push({
          id: `comm-${comm.id}`,
          type: 'communication',
          action: `${comm.type || 'Communication'} Sent`,
          description: comm.subject || 'Communication recorded',
          timestamp: comm.communication_time,
          metadata: { type: comm.type },
        });
      });
    }

    // Sort all activities by timestamp descending and apply limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const paginatedActivities = activities.slice(0, limit);

    return NextResponse.json({
      success: true,
      activities: paginatedActivities,
      total: activities.length,
    });
  } catch (error) {
    console.error('Error fetching promoter activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
