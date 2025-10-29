import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateMetrics, checkDataConsistency, runFullDataIntegrityCheck } from '@/lib/metrics';
import { getPromoterMetrics } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/diagnostics/metrics
 * Returns comprehensive metrics diagnostics including validation and consistency checks
 * 
 * Query params:
 *  - check: 'validation' | 'consistency' | 'full' (default: 'full')
 *  - format: 'json' | 'markdown' (default: 'json')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get('check') || 'full';
    const format = searchParams.get('format') || 'json';

    const supabase = await createClient();

    // Get current user for context
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let result: any = {
      timestamp: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email } : null,
    };

    if (checkType === 'validation') {
      // Just validate current metrics
      const metrics = await getPromoterMetrics({
        ...(user?.id && { userId: user.id }),
        forceRefresh: true,
      });
      result.validation = validateMetrics(metrics);
      result.metrics = metrics;
    } else if (checkType === 'consistency') {
      // Just run consistency checks
      result.consistencyChecks = await checkDataConsistency();
    } else {
      // Full data integrity check
      result = {
        ...result,
        ...(await runFullDataIntegrityCheck()),
      };
    }

    // Add raw data counts for reference
    const { count: totalPromoters } = await supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true });

    const { count: activePromoters } = await supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { data: assignedContracts } = await supabase
      .from('contracts')
      .select('promoter_id')
      .eq('status', 'active')
      .not('promoter_id', 'is', null);

    const uniqueAssigned = new Set(assignedContracts?.map(c => c.promoter_id) || []).size;

    result.rawCounts = {
      totalPromoters: totalPromoters || 0,
      activePromoters: activePromoters || 0,
      uniquePromotersOnActiveContracts: uniqueAssigned,
      availablePromoters: (activePromoters || 0) - uniqueAssigned,
    };

    // Format as markdown if requested
    if (format === 'markdown') {
      return new NextResponse(formatAsMarkdown(result), {
        headers: {
          'Content-Type': 'text/markdown',
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Diagnostics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Format diagnostics result as markdown report
 */
function formatAsMarkdown(result: any): string {
  const lines: string[] = [];

  lines.push('# Metrics Diagnostics Report');
  lines.push('');
  lines.push(`**Generated:** ${result.timestamp}`);
  lines.push(`**User:** ${result.user?.email || 'Anonymous'}`);
  lines.push('');

  // Raw Counts
  if (result.rawCounts) {
    lines.push('## Raw Database Counts');
    lines.push('');
    lines.push(`- **Total Promoters:** ${result.rawCounts.totalPromoters}`);
    lines.push(`- **Active Promoters:** ${result.rawCounts.activePromoters}`);
    lines.push(`- **Promoters on Active Contracts:** ${result.rawCounts.uniquePromotersOnActiveContracts}`);
    lines.push(`- **Available Promoters:** ${result.rawCounts.availablePromoters}`);
    lines.push('');
  }

  // Metrics Validation
  if (result.metricsValidation) {
    lines.push('## Metrics Validation');
    lines.push('');
    lines.push(`**Status:** ${result.metricsValidation.isValid ? '✅ PASS' : '❌ FAIL'}`);
    lines.push('');

    if (result.metricsValidation.errors.length > 0) {
      lines.push('### Errors');
      result.metricsValidation.errors.forEach((error: string) => {
        lines.push(`- ❌ ${error}`);
      });
      lines.push('');
    }

    if (result.metricsValidation.warnings.length > 0) {
      lines.push('### Warnings');
      result.metricsValidation.warnings.forEach((warning: string) => {
        lines.push(`- ⚠️ ${warning}`);
      });
      lines.push('');
    }

    if (result.metricsValidation.errors.length === 0 && result.metricsValidation.warnings.length === 0) {
      lines.push('✅ No validation issues found');
      lines.push('');
    }
  }

  // Consistency Checks
  if (result.consistencyChecks) {
    lines.push('## Data Consistency Checks');
    lines.push('');

    result.consistencyChecks.forEach((check: any) => {
      const emoji = check.status === 'PASS' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
      lines.push(`### ${emoji} ${check.checkName}`);
      lines.push(`**Status:** ${check.status}`);
      lines.push(`**Message:** ${check.message}`);
      if (check.details) {
        lines.push('**Details:**');
        lines.push('```json');
        lines.push(JSON.stringify(check.details, null, 2));
        lines.push('```');
      }
      lines.push('');
    });
  }

  // Overall Status
  if (result.overallStatus) {
    lines.push('---');
    lines.push('');
    lines.push('## Overall Status');
    lines.push('');
    const emoji = result.overallStatus === 'PASS' ? '✅' : result.overallStatus === 'WARNING' ? '⚠️' : '❌';
    lines.push(`### ${emoji} ${result.overallStatus}`);
    lines.push('');
  }

  // Recommendations
  lines.push('## Recommendations');
  lines.push('');

  if (result.metricsValidation?.errors.length > 0) {
    lines.push('1. **Fix Data Errors:** Address the validation errors listed above');
  }

  if (result.rawCounts?.totalPromoters === result.rawCounts?.availablePromoters) {
    lines.push('2. **All Promoters Unassigned:** Consider assigning promoters to contracts');
  }

  if (result.metricsValidation?.warnings.length > 0) {
    lines.push('3. **Review Warnings:** Investigate the warnings to ensure data consistency');
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Report generated by SmartPro Contract Management System*');

  return lines.join('\n');
}

