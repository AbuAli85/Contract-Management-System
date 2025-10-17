import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { HtmlContractService } from '@/lib/html-contract-service';
import { SimplePdfService } from '@/lib/simple-pdf-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting multi-option contract generation...');

    const body = await request.json();
    console.log('📋 Request body:', body);

    // Validate required fields
    const requiredFields = ['promoter_id', 'first_party_id', 'second_party_id'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create contract record
    const contractData = {
      promoter_id: body.promoter_id,
      first_party_id: body.first_party_id,
      second_party_id: body.second_party_id,
      contract_type: body.contract_type || 'full-time-permanent',
      job_title: body.job_title || '',
      department: body.department || '',
      work_location: body.work_location || '',
      basic_salary: body.basic_salary || 0,
      contract_start_date: body.contract_start_date || '',
      contract_end_date: body.contract_end_date || '',
      special_terms: body.special_terms || '',
      status: 'processing',
      created_at: new Date().toISOString(),
    };

    console.log('📝 Creating contract record...');
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert(contractData as any)
      .select()
      .single();

    if (contractError) {
      console.error('❌ Failed to create contract:', contractError);
      return NextResponse.json(
        { error: 'Failed to create contract record' },
        { status: 500 }
      );
    }

    console.log('✅ Contract created:', (contract as any)?.id);

    // Fetch all required data
    const [promoterResult, firstPartyResult, secondPartyResult] = await Promise.all([
      supabase.from('promoters').select('*').eq('id', body.promoter_id).single(),
      supabase.from('parties').select('*').eq('id', body.first_party_id).single(),
      supabase.from('parties').select('*').eq('id', body.second_party_id).single()
    ]);

    if (promoterResult.error || firstPartyResult.error || secondPartyResult.error) {
      console.error('❌ Failed to fetch data:', { promoterResult, firstPartyResult, secondPartyResult });
      return NextResponse.json(
        { error: 'Failed to fetch required data' },
        { status: 500 }
      );
    }

    const promoter = promoterResult.data as any;
    const firstParty = firstPartyResult.data as any;
    const secondParty = secondPartyResult.data as any;

    // Prepare contract data
    const contractDataForGeneration = {
      contract_id: (contract as any)?.id,
      contract_number: (contract as any)?.contract_number,
      contract_type: body.contract_type,
      contract_date: new Date().toISOString().split('T')[0] || '',
      
      // Promoter data
      promoter_name_en: promoter.name_en,
      promoter_name_ar: promoter.name_ar,
      promoter_email: promoter.email,
      promoter_mobile_number: promoter.mobile_number,
      promoter_id_card_number: promoter.id_card_number,
      promoter_passport_number: promoter.passport_number || '',
      promoter_id_card_url: promoter.id_card_url,
      promoter_passport_url: promoter.passport_url,
      
      // First party (Client) data
      first_party_name_en: firstParty.name_en,
      first_party_name_ar: firstParty.name_ar,
      first_party_crn: firstParty.crn,
      first_party_email: firstParty.email,
      first_party_phone: firstParty.phone,
      
      // Second party (Employer) data
      second_party_name_en: secondParty.name_en,
      second_party_name_ar: secondParty.name_ar,
      second_party_crn: secondParty.crn,
      second_party_email: secondParty.email,
      second_party_phone: secondParty.phone,
      
      // Contract details
      job_title: body.job_title,
      department: body.department,
      work_location: body.work_location,
      basic_salary: body.basic_salary,
      contract_start_date: body.contract_start_date,
      contract_end_date: body.contract_end_date,
      special_terms: body.special_terms || '',
      currency: 'OMR',
    };

    // Try different generation methods
    const generationMethod = body.generation_method || 'html'; // html, pdf, makecom
    
    let result;
    
    switch (generationMethod) {
      case 'html':
        console.log('🔄 Using HTML generation method...');
        const htmlService = new HtmlContractService({
          templatePath: '/templates/contract.html',
          outputPath: '/output/contracts'
        });
        result = await htmlService.generateContract(contractDataForGeneration as any);
        break;
        
      case 'pdf':
        console.log('🔄 Using simple PDF generation method...');
        const pdfService = new SimplePdfService({
          outputPath: '/output/contracts'
        });
        result = await pdfService.generateContract(contractDataForGeneration as any);
        break;
        
      case 'makecom':
        console.log('🔄 Using Make.com generation method...');
        // Redirect to Make.com endpoint
        const makecomResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/contracts/makecom-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        
        if (!makecomResponse.ok) {
          throw new Error('Make.com generation failed');
        }
        
        const makecomResult = await makecomResponse.json();
        result = {
          documentUrl: makecomResult.data?.document_url || 'Processing...',
          pdfUrl: makecomResult.data?.pdf_url || 'Processing...'
        };
        break;
        
      default:
        throw new Error(`Unknown generation method: ${generationMethod}`);
    }

    // Update contract with results
    const updateData: any = {
      status: 'completed',
      updated_at: new Date().toISOString(),
    };

    if (result.documentUrl) {
      updateData.document_url = result.documentUrl;
    }
    if ((result as any).pdfUrl) {
      updateData.pdf_url = (result as any).pdfUrl;
    }

    try {
      const { error: updateError } = await (supabase as any)
        .from('contracts')
        .update(updateData as any)
        .eq('id', (contract as any)?.id);
      
      if (updateError) {
        console.error('❌ Failed to update contract:', updateError);
      }
    } catch (updateErr) {
      console.error('❌ Update error:', updateErr);
    }

    return NextResponse.json({
      success: true,
      message: `Contract generated successfully using ${generationMethod} method`,
      data: {
        contract_id: (contract as any)?.id,
        contract_number: (contract as any)?.contract_number,
        status: 'completed',
        generation_method: generationMethod,
        document_url: result.documentUrl,
        pdf_url: (result as any).pdfUrl || undefined,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Contract generation error:', error);
    return NextResponse.json(
      { 
        error: 'Contract generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}