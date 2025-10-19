import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAnyRBAC } from '@/lib/rbac/guard';

export const POST = withAnyRBAC(
  ['contract:create:own', 'contract:generate:own'],
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const supabase = await createClient();

      console.log('🔄 Simple contract generation request:', body);

      // Validate required fields
      const requiredFields = [
        'promoter_id',
        'first_party_id', 
        'second_party_id',
        'job_title',
        'department',
        'work_location',
        'basic_salary',
        'contract_start_date',
        'contract_end_date',
        'contract_type'
      ];

      const missingFields = requiredFields.filter(field => !body[field]);
      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required fields: ${missingFields.join(', ')}`,
          },
          { status: 400 }
        );
      }

      // Generate contract number
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const contractNumber = `PAC-${day}${month}${year}-${random}`;

      // Create contract in database
      const contractData = {
        contract_number: contractNumber,
        first_party_id: body.first_party_id,
        second_party_id: body.second_party_id,
        promoter_id: body.promoter_id,
        contract_start_date: body.contract_start_date,
        contract_end_date: body.contract_end_date,
        title: body.job_title,
        description: body.special_terms || '',
        contract_type: body.contract_type,
        status: 'pending',
        value: body.basic_salary,
        currency: 'OMR',
        is_current: true,
      };

      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert(contractData as any)
        .select('id, contract_number, status')
        .single();

      if (contractError) {
        console.error('❌ Contract creation failed:', contractError);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to create contract: ${contractError.message}`,
          },
          { status: 500 }
        );
      }

      console.log('✅ Contract created:', (contract as any)?.id);

      // Fetch promoter and party data for Make.com
      const [promoterResult, firstPartyResult, secondPartyResult] = await Promise.all([
        supabase
          .from('promoters')
          .select('id, name_en, name_ar, email, mobile_number, id_card_number, passport_number, id_card_url, passport_url, employer_id')
          .eq('id', body.promoter_id)
          .single(),
        supabase
          .from('parties')
          .select('id, name_en, name_ar, crn, email, phone')
          .eq('id', body.first_party_id)
          .single(),
        supabase
          .from('parties')
          .select('id, name_en, name_ar, crn, email, phone')
          .eq('id', body.second_party_id)
          .single(),
      ]);

      const promoter = promoterResult.data as any;
      const firstParty = firstPartyResult.data as any;
      const secondParty = secondPartyResult.data as any;

      // Prepare Make.com webhook payload
      const makecomPayload = {
        contract_id: (contract as any)?.id,
        contract_number: (contract as any)?.contract_number,
        contract_type: body.contract_type,
        
        // Promoter data
        promoter_id: body.promoter_id,
        promoter_name_en: promoter?.name_en,
        promoter_name_ar: promoter?.name_ar,
        promoter_email: promoter?.email,
        promoter_mobile_number: promoter?.mobile_number,
        promoter_id_card_number: promoter?.id_card_number,
        promoter_passport_number: promoter?.passport_number,
        promoter_id_card_url: promoter?.id_card_url,
        promoter_passport_url: promoter?.passport_url,
        
        // First party data (Client)
        first_party_id: body.first_party_id,
        first_party_name_en: firstParty?.name_en,
        first_party_name_ar: firstParty?.name_ar,
        first_party_crn: firstParty?.crn,
        first_party_email: firstParty?.email,
        first_party_phone: firstParty?.phone,
        
        // Second party data (Employer)
        second_party_id: body.second_party_id,
        second_party_name_en: secondParty?.name_en,
        second_party_name_ar: secondParty?.name_ar,
        second_party_crn: secondParty?.crn,
        second_party_email: secondParty?.email,
        second_party_phone: secondParty?.phone,
        
        // Contract details
        job_title: body.job_title,
        department: body.department,
        work_location: body.work_location,
        basic_salary: body.basic_salary,
        contract_start_date: body.contract_start_date,
        contract_end_date: body.contract_end_date,
        special_terms: body.special_terms || '',
        currency: 'OMR',
        
        // Additional fields for templates
        contract_date: new Date().toISOString().split('T')[0],
        generated_at: new Date().toISOString(),
      };

      // Trigger Make.com webhook if configured
      let makecomResponse = null;
      const makecomWebhookUrl = process.env.MAKECOM_WEBHOOK_URL;
      
      if (makecomWebhookUrl) {
        try {
          const response = await fetch(makecomWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(makecomPayload),
          });

          makecomResponse = {
            status: response.status,
            success: response.ok,
            timestamp: new Date().toISOString(),
          };

          if (response.ok) {
            console.log('✅ Make.com webhook triggered successfully');
            
            // Update contract status
            await (supabase as any)
              .from('contracts')
              .update({ status: 'processing' })
              .eq('id', (contract as any)?.id);
          } else {
            console.error('❌ Make.com webhook failed:', response.statusText);
          }
        } catch (makecomError) {
          console.error('❌ Make.com webhook error:', makecomError);
          makecomResponse = {
            status: 500,
            success: false,
            error: makecomError instanceof Error ? makecomError.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        console.warn('⚠️ MAKECOM_WEBHOOK_URL not configured');
      }

      return NextResponse.json({
        success: true,
        data: {
          contract,
          makecom: {
            triggered: !!makecomWebhookUrl,
            response: makecomResponse,
          },
        },
        message: 'Contract created successfully',
      });

    } catch (error) {
      console.error('❌ Simple contract generation error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Contract generation failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);
