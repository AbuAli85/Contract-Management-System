import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  console.log('=== CONTRACTS SCHEMA TEST START ===');

  try {
    const supabase = await createClient();

    // Test 1: Simple count query
    console.log('Test 1: Simple count query');
    const { count, error: countError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Count error:', countError);
      return NextResponse.json(
        {
          success: false,
          test: 'count',
          error: countError,
        },
        { status: 400 }
      );
    }

    console.log('✅ Total contracts:', count);

    // Test 2: Sample data query
    console.log('Test 2: Sample data query');
    const { data: sampleData, error: sampleError } = await supabase
      .from('contracts')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error('❌ Sample error:', sampleError);
      return NextResponse.json(
        {
          success: false,
          test: 'sample',
          error: sampleError,
        },
        { status: 400 }
      );
    }

    console.log('✅ Sample contracts:', sampleData);

    // Test 3: Column check
    console.log('Test 3: Column existence check');
    const columnTests = [];

    // Test for new column names
    try {
      const { data: firstPartyTest, error: fpError } = await supabase
        .from('contracts')
        .select('first_party_id')
        .limit(1);

      columnTests.push({
        column: 'first_party_id',
        exists: !fpError,
        error: fpError?.message,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      columnTests.push({
        column: 'first_party_id',
        exists: false,
        error: errorMessage,
      });
    }

    try {
      const { data: secondPartyTest, error: spError } = await supabase
        .from('contracts')
        .select('second_party_id')
        .limit(1);

      columnTests.push({
        column: 'second_party_id',
        exists: !spError,
        error: spError?.message,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      columnTests.push({
        column: 'second_party_id',
        exists: false,
        error: errorMessage,
      });
    }

    // Test for legacy column names
    try {
      const { data: employerTest, error: empError } = await supabase
        .from('contracts')
        .select('employer_id')
        .limit(1);

      columnTests.push({
        column: 'employer_id',
        exists: !empError,
        error: empError?.message,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      columnTests.push({
        column: 'employer_id',
        exists: false,
        error: errorMessage,
      });
    }

    try {
      const { data: clientTest, error: clientError } = await supabase
        .from('contracts')
        .select('client_id')
        .limit(1);

      columnTests.push({
        column: 'client_id',
        exists: !clientError,
        error: clientError?.message,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      columnTests.push({
        column: 'client_id',
        exists: false,
        error: errorMessage,
      });
    }

    console.log('✅ Column tests:', columnTests);

    return NextResponse.json({
      success: true,
      totalContracts: count,
      sampleData,
      columnTests,
      schemaAnalysis: {
        hasFirstPartyId:
          columnTests.find(t => t.column === 'first_party_id')?.exists || false,
        hasSecondPartyId:
          columnTests.find(t => t.column === 'second_party_id')?.exists ||
          false,
        hasEmployerId:
          columnTests.find(t => t.column === 'employer_id')?.exists || false,
        hasClientId:
          columnTests.find(t => t.column === 'client_id')?.exists || false,
      },
    });
  } catch (error) {
    console.error('Exception in contracts test:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
