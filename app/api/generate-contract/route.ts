import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { withAnyRBAC } from '@/lib/rbac/guard';

export const POST = withAnyRBAC(
  ['contract:create:own', 'contract:generate:own', 'contract:message:own'],
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const supabase = await createClient();

      // Generate unique contract number with new format
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const random = nanoid(4).toUpperCase();
      const contractNumber = `PAC-${day}${month}${year}-${random}`;

      // Map and validate contract type to allowed database values
      const mapContractType = (type: string): string => {
        if (!type) return 'employment';
        const typeLower = String(type).toLowerCase();
        const typeMap: Record<string, string> = {
          'employment': 'employment',
          'full-time-permanent': 'employment',
          'full-time-fixed': 'employment',
          'part-time-permanent': 'employment',
          'part-time-fixed': 'employment',
          'probationary': 'employment',
          'training-contract': 'employment',
          'internship': 'employment',
          'graduate-trainee': 'employment',
          'service': 'service',
          'freelance': 'service',
          'contractor': 'service',
          'consultant': 'consultancy',
          'consulting': 'consultancy',
          'consulting-agreement': 'consultancy',
          'project-based': 'consultancy',
          'partnership': 'partnership',
          'temporary': 'service',
          'seasonal': 'service',
          'executive': 'employment',
          'management': 'employment',
          'director': 'employment',
          'remote-work': 'employment',
          'hybrid-work': 'employment',
          'secondment': 'service',
          'apprenticeship': 'employment',
          'service-agreement': 'service',
          'retainer': 'service',
        };
        return typeMap[typeLower] || 'employment';
      };

      const contractType = mapContractType(body.contract_type);
      
      // Ensure start_date is provided (required by database)
      const toDateOnly = (value: any): string | null => {
        if (!value) return null;
        const d = new Date(value);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().slice(0, 10);
      };
      const startDate = toDateOnly(body.contract_start_date || body.start_date) || new Date().toISOString().slice(0, 10);
      const endDate = toDateOnly(body.contract_end_date || body.end_date);

      // Insert contract into database
      const { data: contract, error } = await supabase
        .from('contracts')
        .insert({
          contract_number: contractNumber,
          promoter_id: body.promoter_id,
          employer_id: body.employer_id,
          client_id: body.client_id,
          title: body.contract_name || body.title || 'Employment Contract',
          description: body.description,
          contract_type: contractType,
          start_date: startDate,
          end_date: endDate,
          status: 'generating',
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to create contract' },
          { status: 500 }
        );
      }

      // Send to Make.com webhook for processing
      if (process.env.MAKE_WEBHOOK_URL) {
        try {
          await fetch(process.env.MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contractId: contract.id,
              contractNumber,
              update_url: `${
                process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              }/api/generate-contract`,
              ...body,
            }),
          });
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
          // Don't fail the request if webhook fails
        }
      }

      return NextResponse.json({ success: true, contract });
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

export const PUT = withAnyRBAC(
  ['contract:update:own', 'contract:generate:own'],
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { contractId, status, pdfUrl } = body;
      const supabase = await createClient(); // No arguments needed

      // Update contract status
      const { error } = await supabase
        .from('contracts')
        .update({
          status,
          pdf_url: pdfUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to update contract' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
