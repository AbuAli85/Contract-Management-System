import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Instantiate inside the handler so it only runs at request time,
  // not at build time when OPENAI_API_KEY may not be available.
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId, query } = await request.json();

    if (!contractId) {
      return NextResponse.json(
        { error: 'contractId is required' },
        { status: 400 }
      );
    }

    // Fetch contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    const contractSummary = `
Contract ID: ${contract.id}
Status: ${contract.status}
Type: ${(contract as Record<string, unknown>).type ?? 'N/A'}
Start Date: ${(contract as Record<string, unknown>).start_date ?? 'N/A'}
End Date: ${(contract as Record<string, unknown>).end_date ?? 'N/A'}
Value: ${(contract as Record<string, unknown>).total_value ?? 'N/A'}
Created: ${contract.created_at}
Notes: ${(contract as Record<string, unknown>).notes ?? 'None'}
    `.trim();

    const systemPrompt = `You are an expert contract analyst. Analyze the following contract and provide:
1. A risk score (0-100, where 100 is highest risk)
2. A compliance score (0-100, where 100 is fully compliant)
3. An efficiency score (0-100, where 100 is most efficient)
4. 3 specific recommendations (risk, compliance, or efficiency type)
5. 3 AI insights with confidence levels
6. A predicted success probability (0-1)

Respond ONLY with valid JSON matching this exact structure:
{
  "riskScore": number,
  "complianceScore": number,
  "efficiencyScore": number,
  "recommendations": [
    { "type": "risk"|"compliance"|"efficiency", "priority": "high"|"medium"|"low", "title": string, "description": string, "impact": number, "suggestedAction": string }
  ],
  "aiInsights": [
    { "category": string, "insight": string, "confidence": number, "actionable": boolean }
  ],
  "predictedOutcome": {
    "successProbability": number,
    "estimatedValue": number,
    "timeline": string,
    "keyFactors": string[]
  }
}`;

    const userMessage = query
      ? `${contractSummary}\n\nUser question: ${query}`
      : contractSummary;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const analysisText = completion.choices[0]?.message?.content ?? '{}';
    const analysisData = JSON.parse(analysisText);

    return NextResponse.json({
      id: `analysis_${contractId}_${Date.now()}`,
      contractId,
      ...analysisData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to analyze contract',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
