import { NextRequest, NextResponse } from 'next/server';
import { generalContractService } from '@/lib/general-contract-service';
import type { GeneralContractData } from '@/lib/general-contract-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 General Contract Generation API called');

    const body = await request.json();
    console.log('📤 Request payload:', body);

    // Validate required fields
    const {
      contract_type,
      promoter_id,
      first_party_id,
      second_party_id,
      job_title,
      department,
      work_location,
      basic_salary,
      contract_start_date,
      contract_end_date,
    } = body;

    if (!contract_type || !promoter_id || !first_party_id || !second_party_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: contract_type, promoter_id, first_party_id, second_party_id',
        },
        { status: 400 }
      );
    }

    // Prepare contract data
    const contractData: GeneralContractData = {
      contract_type,
      promoter_id,
      first_party_id,
      second_party_id,
      job_title: job_title || '',
      department: department || '',
      work_location: work_location || '',
      basic_salary: parseFloat(basic_salary) || 0,
      contract_start_date:
        contract_start_date || new Date().toISOString().split('T')[0],
      contract_end_date:
        contract_end_date ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      special_terms: body.special_terms,
      probation_period: body.probation_period,
      notice_period: body.notice_period,
      working_hours: body.working_hours,
      housing_allowance: body.housing_allowance
        ? parseFloat(body.housing_allowance)
        : 0,
      transport_allowance: body.transport_allowance
        ? parseFloat(body.transport_allowance)
        : 0,
      product_name: body.product_name,
      service_description: body.service_description,
      project_duration: body.project_duration,
      deliverables: body.deliverables,
      payment_terms: body.payment_terms,
      termination_clause: body.termination_clause,
      confidentiality_clause: body.confidentiality_clause,
      intellectual_property: body.intellectual_property,
      liability_insurance: body.liability_insurance,
      force_majeure: body.force_majeure,
    };

    // Create contract in database
    const contract = await generalContractService.createContract(contractData);
    console.log('✅ Contract created:', contract.id);

    // Trigger Make.com webhook for general contracts
    let makecomResponse = null;
    try {
      const makecomTriggered =
        await generalContractService.triggerMakeComWebhook(contract.id);
      makecomResponse = {
        triggered: makecomTriggered,
        webhook_url:
          'https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz',
        timestamp: new Date().toISOString(),
      };

      if (makecomTriggered) {
        console.log('✅ Make.com webhook triggered successfully');
      } else {
        console.warn('⚠️ Make.com webhook not triggered');
      }
    } catch (makecomError) {
      console.error('❌ Make.com webhook error:', makecomError);
      makecomResponse = {
        triggered: false,
        error:
          makecomError instanceof Error
            ? makecomError.message
            : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      message: 'General contract created successfully',
      data: {
        contract: {
          id: contract.id,
          contract_number: contract.contract_number,
          title: contract.title,
          status: contract.status,
          contract_type: contract.contract_type,
          created_at: contract.created_at,
        },
        makecom: makecomResponse,
      },
    });
  } catch (error) {
    console.error('❌ General contract generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate general contract',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'General Contract Generation API',
    status: 'active',
    usage: 'Send POST requests with general contract data',
    required_fields: {
      contract_type: 'string (required)',
      promoter_id: 'string (required)',
      first_party_id: 'string (required)',
      second_party_id: 'string (required)',
      job_title: 'string (optional)',
      department: 'string (optional)',
      work_location: 'string (optional)',
      basic_salary: 'number (optional)',
      contract_start_date: 'string (optional)',
      contract_end_date: 'string (optional)',
    },
    optional_fields: {
      special_terms: 'string',
      probation_period: 'string',
      notice_period: 'string',
      working_hours: 'string',
      housing_allowance: 'number',
      transport_allowance: 'number',
      product_name: 'string',
      service_description: 'string',
      project_duration: 'string',
      deliverables: 'string',
      payment_terms: 'string',
      termination_clause: 'string',
      confidentiality_clause: 'string',
      intellectual_property: 'string',
      liability_insurance: 'string',
      force_majeure: 'string',
    },
    contract_types: [
      'general-service',
      'consulting-agreement',
      'service-contract',
      'partnership-agreement',
      'vendor-agreement',
      'maintenance-contract',
      'supply-agreement',
      'distribution-agreement',
      'franchise-agreement',
      'licensing-agreement',
    ],
  });
}
