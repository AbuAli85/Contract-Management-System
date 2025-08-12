import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const supabase = await createClient();

    // Fetch contract with all related data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        first_party:parties!first_party_id(*),
        second_party:parties!second_party_id(*),
        promoter:promoters(*)
      `
      )
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract not found',
        },
        { status: 404 }
      );
    }

    // Generate HTML content for the contract
    const htmlContent = generateContractHTML(contract);

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Test PDF API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Function to generate HTML content for testing
function generateContractHTML(contract: any): string {
  const contractNumber = contract.contract_number || 'N/A';
  const currentDate = new Date().toLocaleDateString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employment Contract - ${contractNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .contract-number {
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0;
            color: #2c3e50;
        }
        .section {
            margin: 25px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2c3e50;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }
        .field {
            margin: 10px 0;
            display: flex;
            align-items: center;
        }
        .field-label {
            font-weight: bold;
            display: inline-block;
            width: 150px;
            color: #555;
        }
        .field-value {
            flex: 1;
            color: #333;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-active {
            background-color: #d4edda;
            color: #155724;
        }
        .status-draft {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-pending {
            background-color: #f8d7da;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>EMPLOYMENT CONTRACT</h1>
        <div class="contract-number">Contract Number: ${contractNumber}</div>
        <div>Date: ${currentDate}</div>
        <div style="margin-top: 10px;">
            <span class="status-badge status-${contract.status || 'draft'}">
                ${contract.status || 'Draft'}
            </span>
            <span class="status-badge status-${contract.approval_status || 'pending'}">
                ${contract.approval_status || 'Pending'}
            </span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">PARTIES</div>
        ${
          contract.first_party
            ? `
            <div class="field">
                <span class="field-label">Employer:</span>
                <span class="field-value">${contract.first_party.name_en}</span>
            </div>
            <div class="field">
                <span class="field-label">CRN:</span>
                <span class="field-value">${contract.first_party.crn || 'N/A'}</span>
            </div>
            <div class="field">
                <span class="field-label">Address:</span>
                <span class="field-value">${contract.first_party.address_en || 'N/A'}</span>
            </div>
            <div class="field">
                <span class="field-label">Contact Person:</span>
                <span class="field-value">${contract.first_party.contact_person || 'N/A'}</span>
            </div>
            <div class="field">
                <span class="field-label">Contact Email:</span>
                <span class="field-value">${contract.first_party.contact_email || 'N/A'}</span>
            </div>
            <div class="field">
                <span class="field-label">Contact Phone:</span>
                <span class="field-value">${contract.first_party.contact_phone || 'N/A'}</span>
            </div>
        `
            : '<div class="field"><span class="field-value">Employer: Not specified</span></div>'
        }
        
        ${
          contract.second_party
            ? `
            <div class="field">
                <span class="field-label">Employee:</span>
                <span class="field-value">${contract.second_party.name_en}</span>
            </div>
            <div class="field">
                <span class="field-label">Email:</span>
                <span class="field-value">${contract.email || 'N/A'}</span>
            </div>
            <div class="field">
                <span class="field-label">Contact Person:</span>
                <span class="field-value">${contract.second_party.contact_person || 'N/A'}</span>
            </div>
            <div class="field">
                <span class="field-label">Contact Email:</span>
                <span class="field-value">${contract.second_party.contact_email || 'N/A'}</span>
            </div>
            <div class="field">
                <span class="field-label">Contact Phone:</span>
                <span class="field-value">${contract.second_party.contact_phone || 'N/A'}</span>
            </div>
        `
            : '<div class="field"><span class="field-value">Employee: Not specified</span></div>'
        }
    </div>

    <div class="section">
        <div class="section-title">JOB DETAILS</div>
        <div class="field">
            <span class="field-label">Position:</span>
            <span class="field-value">${contract.job_title || 'N/A'}</span>
        </div>
        <div class="field">
            <span class="field-label">Department:</span>
            <span class="field-value">${contract.department || 'N/A'}</span>
        </div>
        <div class="field">
            <span class="field-label">Work Location:</span>
            <span class="field-value">${contract.work_location || 'N/A'}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">CONTRACT TERMS</div>
        <div class="field">
            <span class="field-label">Contract Type:</span>
            <span class="field-value">${contract.contract_type || 'N/A'}</span>
        </div>
        <div class="field">
            <span class="field-label">Start Date:</span>
            <span class="field-value">${contract.contract_start_date ? new Date(contract.contract_start_date).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div class="field">
            <span class="field-label">End Date:</span>
            <span class="field-value">${contract.contract_end_date ? new Date(contract.contract_end_date).toLocaleDateString() : 'N/A'}</span>
        </div>
    </div>

    <div class="section">
        <div class="section-title">COMPENSATION</div>
        <div class="field">
            <span class="field-label">Basic Salary:</span>
            <span class="field-value">${contract.basic_salary || 'N/A'} ${contract.currency || 'SAR'}</span>
        </div>
        <div class="field">
            <span class="field-label">Allowances:</span>
            <span class="field-value">${contract.allowances || 'N/A'} ${contract.currency || 'SAR'}</span>
        </div>
    </div>

    ${
      contract.promoter
        ? `
        <div class="section">
            <div class="section-title">PROMOTER INFORMATION</div>
            <div class="field">
                <span class="field-label">Name:</span>
                <span class="field-value">${contract.promoter.name_en}</span>
            </div>
            <div class="field">
                <span class="field-label">Contact:</span>
                <span class="field-value">${contract.promoter.mobile_number || 'N/A'}</span>
            </div>
            <div class="field">
                <span class="field-label">Email:</span>
                <span class="field-value">${contract.promoter.email || 'N/A'}</span>
            </div>
        </div>
    `
        : ''
    }

    <div class="section">
        <div class="section-title">CONTRACT STATUS</div>
        <div class="field">
            <span class="field-label">Status:</span>
            <span class="field-value">${contract.status || 'Draft'}</span>
        </div>
        <div class="field">
            <span class="field-label">Approval Status:</span>
            <span class="field-value">${contract.approval_status || 'Pending'}</span>
        </div>
        <div class="field">
            <span class="field-label">Created:</span>
            <span class="field-value">${contract.created_at ? new Date(contract.created_at).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div class="field">
            <span class="field-label">Last Updated:</span>
            <span class="field-value">${contract.updated_at ? new Date(contract.updated_at).toLocaleDateString() : 'N/A'}</span>
        </div>
    </div>

    <div class="footer">
        <p><strong>This contract is generated electronically and is legally binding.</strong></p>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Contract ID: ${contract.id}</p>
    </div>
</body>
</html>
  `;
}
