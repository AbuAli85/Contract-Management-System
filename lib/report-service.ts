import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Report types
export type ReportType =
  | 'company_overview'
  | 'document_compliance'
  | 'expiry_analysis'
  | 'activity_summary'
  | 'financial_summary'
  | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export type ReportPeriod =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';

// Report interfaces
export interface ReportConfig {
  id?: string;
  name: string;
  type: ReportType;
  description?: string;
  filters: ReportFilters;
  format: ReportFormat;
  period: ReportPeriod;
  customDateRange?: {
    startDate: Date;
    endDate: Date;
  };
  includeCharts: boolean;
  includeDetails: boolean;
  recipients?: string[];
  schedule?: ReportSchedule;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReportFilters {
  companyIds?: string[];
  documentTypes?: string[];
  statuses?: string[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  includeExpired?: boolean;
  includeExpiring?: boolean;
  minAmount?: number;
  maxAmount?: number;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  time: string; // HH:MM format
  timezone: string;
  nextRun?: Date;
}

export interface CompanyOverviewData {
  company: {
    id: string;
    company_name: string;
    cr_number: string;
    business_type: string;
    contact_email: string;
    phone_number: string;
    address: string;
    registration_date: string;
    status: string;
  };
  documents: {
    total: number;
    active: number;
    expired: number;
    expiring: number;
    by_type: Record<string, number>;
    compliance_score: number;
  };
  contracts: {
    total: number;
    active: number;
    completed: number;
    pending: number;
    total_value: number;
  };
  employees: {
    total: number;
    active: number;
  };
  recent_activity: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

export interface DocumentComplianceData {
  summary: {
    total_companies: number;
    compliant_companies: number;
    non_compliant_companies: number;
    compliance_rate: number;
  };
  by_company: Array<{
    company_id: string;
    company_name: string;
    cr_number: string;
    required_documents: string[];
    submitted_documents: string[];
    missing_documents: string[];
    expired_documents: string[];
    compliance_score: number;
    status: 'compliant' | 'partial' | 'non_compliant';
  }>;
  by_document_type: Array<{
    document_type: string;
    total_required: number;
    total_submitted: number;
    submission_rate: number;
    expired_count: number;
    expiring_count: number;
  }>;
}

export interface ExpiryAnalysisData {
  summary: {
    total_documents: number;
    expired: number;
    expiring_7_days: number;
    expiring_30_days: number;
    expiring_90_days: number;
  };
  by_company: Array<{
    company_id: string;
    company_name: string;
    expired_count: number;
    expiring_soon_count: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
  }>;
  by_document_type: Array<{
    document_type: string;
    expired_count: number;
    expiring_count: number;
    average_validity_period: number;
  }>;
  timeline: Array<{
    month: string;
    expired: number;
    expiring: number;
    renewed: number;
  }>;
}

export interface ActivitySummaryData {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_activities: number;
    new_companies: number;
    new_documents: number;
    document_updates: number;
    contract_activities: number;
  };
  activities: Array<{
    date: string;
    type: string;
    description: string;
    company_name?: string;
    user_name?: string;
    details: Record<string, any>;
  }>;
  trends: {
    daily_activities: Array<{
      date: string;
      count: number;
    }>;
    top_companies: Array<{
      company_name: string;
      activity_count: number;
    }>;
    activity_types: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
}

export interface ReportGenerationResult {
  success: boolean;
  reportId?: string;
  filePath?: string;
  downloadUrl?: string;
  error?: string;
  metadata?: {
    generatedAt: Date;
    format: ReportFormat;
    size: number;
    recordCount: number;
  };
}

/**
 * Service for generating and managing reports
 */
export class ReportService {
  /**
   * Generate company overview report
   */
  static async generateCompanyOverviewReport(
    companyId: string,
    config: Partial<ReportConfig> = {}
  ): Promise<{ data?: CompanyOverviewData; error?: string }> {
    try {
      // Get company information
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError || !company) {
        throw new Error('Company not found');
      }

      // Get document statistics
      const { data: documents } = await supabase
        .from('company_documents')
        .select('document_type, status, expiry_date')
        .eq('company_id', companyId);

      // Get contract information
      const { data: contracts } = await supabase
        .from('contracts')
        .select('status, contract_value, created_at')
        .eq('company_id', companyId);

      // Get employee count
      const { data: employees } = await supabase
        .from('company_employees')
        .select('status')
        .eq('company_id', companyId);

      // Calculate document statistics
      const documentStats = this.calculateDocumentStats(documents || []);

      // Calculate contract statistics
      const contractStats = this.calculateContractStats(contracts || []);

      // Get recent activity
      const recentActivity = await this.getRecentActivity(companyId, 10);

      const reportData: CompanyOverviewData = {
        company,
        documents: documentStats,
        contracts: contractStats,
        employees: {
          total: employees?.length || 0,
          active: employees?.filter(e => e.status === 'active').length || 0,
        },
        recent_activity: recentActivity,
      };

      return { data: reportData };
    } catch (error) {
      console.error('Error generating company overview report:', error);
      return {
        error:
          error instanceof Error ? error.message : 'Failed to generate report',
      };
    }
  }

  /**
   * Generate document compliance report
   */
  static async generateDocumentComplianceReport(
    filters: ReportFilters = {}
  ): Promise<{ data?: DocumentComplianceData; error?: string }> {
    try {
      // Get all companies or filtered companies
      let companyQuery = supabase.from('companies').select('*');

      if (filters.companyIds?.length) {
        companyQuery = companyQuery.in('id', filters.companyIds);
      }

      const { data: companies, error: companyError } = await companyQuery;

      if (companyError) {
        throw companyError;
      }

      // Define required documents for compliance
      const requiredDocuments = ['commercial_registration', 'business_license'];

      const complianceData: DocumentComplianceData = {
        summary: {
          total_companies: companies?.length || 0,
          compliant_companies: 0,
          non_compliant_companies: 0,
          compliance_rate: 0,
        },
        by_company: [],
        by_document_type: [],
      };

      // Process each company
      for (const company of companies || []) {
        const { data: companyDocs } = await supabase
          .from('company_documents')
          .select('document_type, status, expiry_date')
          .eq('company_id', company.id);

        const submittedDocs = companyDocs?.map(d => d.document_type) || [];
        const missingDocs = requiredDocuments.filter(
          req => !submittedDocs.includes(req)
        );
        const expiredDocs =
          companyDocs
            ?.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date())
            .map(d => d.document_type) || [];

        const complianceScore = this.calculateComplianceScore(
          requiredDocuments,
          submittedDocs,
          expiredDocs
        );

        const status =
          complianceScore >= 90
            ? 'compliant'
            : complianceScore >= 50
              ? 'partial'
              : 'non_compliant';

        complianceData.by_company.push({
          company_id: company.id,
          company_name: company.company_name,
          cr_number: company.cr_number,
          required_documents: requiredDocuments,
          submitted_documents: submittedDocs,
          missing_documents: missingDocs,
          expired_documents: expiredDocs,
          compliance_score: complianceScore,
          status,
        });

        if (status === 'compliant') {
          complianceData.summary.compliant_companies++;
        } else {
          complianceData.summary.non_compliant_companies++;
        }
      }

      // Calculate overall compliance rate
      complianceData.summary.compliance_rate =
        (complianceData.summary.compliant_companies /
          complianceData.summary.total_companies) *
        100;

      // Calculate by document type statistics
      complianceData.by_document_type =
        await this.calculateDocumentTypeStats(requiredDocuments);

      return { data: complianceData };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate compliance report',
      };
    }
  }

  /**
   * Generate expiry analysis report
   */
  static async generateExpiryAnalysisReport(
    filters: ReportFilters = {}
  ): Promise<{ data?: ExpiryAnalysisData; error?: string }> {
    try {
      // Get all documents with expiry dates
      let docQuery = supabase
        .from('company_documents')
        .select(
          `
          *,
          companies!inner(id, company_name)
        `
        )
        .not('expiry_date', 'is', null);

      if (filters.companyIds?.length) {
        docQuery = docQuery.in('company_id', filters.companyIds);
      }

      if (filters.documentTypes?.length) {
        docQuery = docQuery.in('document_type', filters.documentTypes);
      }

      const { data: documents, error: docError } = await docQuery;

      if (docError) {
        throw docError;
      }

      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      // Calculate summary statistics
      const summary = {
        total_documents: documents?.length || 0,
        expired: 0,
        expiring_7_days: 0,
        expiring_30_days: 0,
        expiring_90_days: 0,
      };

      const companyStats = new Map<string, any>();
      const documentTypeStats = new Map<string, any>();

      documents?.forEach(doc => {
        const expiryDate = new Date(doc.expiry_date!);

        // Update summary
        if (expiryDate < now) {
          summary.expired++;
        } else if (expiryDate <= in7Days) {
          summary.expiring_7_days++;
        } else if (expiryDate <= in30Days) {
          summary.expiring_30_days++;
        } else if (expiryDate <= in90Days) {
          summary.expiring_90_days++;
        }

        // Update company stats
        const companyKey = doc.company_id;
        if (!companyStats.has(companyKey)) {
          companyStats.set(companyKey, {
            company_id: doc.company_id,
            company_name: (doc as any).companies.company_name,
            expired_count: 0,
            expiring_soon_count: 0,
            risk_level: 'low',
          });
        }

        const companyStat = companyStats.get(companyKey);
        if (expiryDate < now) {
          companyStat.expired_count++;
        } else if (expiryDate <= in30Days) {
          companyStat.expiring_soon_count++;
        }

        // Update document type stats
        if (!documentTypeStats.has(doc.document_type)) {
          documentTypeStats.set(doc.document_type, {
            document_type: doc.document_type,
            expired_count: 0,
            expiring_count: 0,
            total_documents: 0,
            total_validity_days: 0,
          });
        }

        const docTypeStat = documentTypeStats.get(doc.document_type);
        docTypeStat.total_documents++;

        if (expiryDate < now) {
          docTypeStat.expired_count++;
        } else if (expiryDate <= in90Days) {
          docTypeStat.expiring_count++;
        }
      });

      // Calculate risk levels for companies
      companyStats.forEach(stat => {
        const totalDocs = stat.expired_count + stat.expiring_soon_count;
        if (stat.expired_count > 2) {
          stat.risk_level = 'critical';
        } else if (stat.expired_count > 0 || stat.expiring_soon_count > 3) {
          stat.risk_level = 'high';
        } else if (stat.expiring_soon_count > 1) {
          stat.risk_level = 'medium';
        }
      });

      // Generate timeline data (last 12 months)
      const timeline = await this.generateExpiryTimeline(12);

      const reportData: ExpiryAnalysisData = {
        summary,
        by_company: Array.from(companyStats.values()),
        by_document_type: Array.from(documentTypeStats.values()).map(stat => ({
          ...stat,
          average_validity_period:
            stat.total_validity_days / stat.total_documents || 0,
        })),
        timeline,
      };

      return { data: reportData };
    } catch (error) {
      console.error('Error generating expiry analysis report:', error);
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate expiry analysis report',
      };
    }
  }

  /**
   * Generate activity summary report
   */
  static async generateActivitySummaryReport(
    filters: ReportFilters
  ): Promise<{ data?: ActivitySummaryData; error?: string }> {
    try {
      const startDate =
        filters.dateRange?.startDate ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = filters.dateRange?.endDate || new Date();

      // This would typically come from an audit log table
      // For now, we'll simulate activity data
      const activities = await this.getActivitiesInPeriod(
        startDate,
        endDate,
        filters
      );

      const summary = {
        total_activities: activities.length,
        new_companies: activities.filter(a => a.type === 'company_created')
          .length,
        new_documents: activities.filter(a => a.type === 'document_uploaded')
          .length,
        document_updates: activities.filter(a => a.type === 'document_updated')
          .length,
        contract_activities: activities.filter(a => a.type.includes('contract'))
          .length,
      };

      // Generate daily activity trends
      const dailyActivities = this.generateDailyActivityTrends(
        activities,
        startDate,
        endDate
      );

      // Top companies by activity
      const companyActivityMap = new Map<string, number>();
      activities.forEach(activity => {
        if (activity.company_name) {
          const current = companyActivityMap.get(activity.company_name) || 0;
          companyActivityMap.set(activity.company_name, current + 1);
        }
      });

      const topCompanies = Array.from(companyActivityMap.entries())
        .map(([company_name, activity_count]) => ({
          company_name,
          activity_count,
        }))
        .sort((a, b) => b.activity_count - a.activity_count)
        .slice(0, 10);

      // Activity type distribution
      const activityTypeMap = new Map<string, number>();
      activities.forEach(activity => {
        const current = activityTypeMap.get(activity.type) || 0;
        activityTypeMap.set(activity.type, current + 1);
      });

      const activityTypes = Array.from(activityTypeMap.entries())
        .map(([type, count]) => ({
          type,
          count,
          percentage: (count / activities.length) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      const reportData: ActivitySummaryData = {
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
        summary,
        activities,
        trends: {
          daily_activities: dailyActivities,
          top_companies: topCompanies,
          activity_types: activityTypes,
        },
      };

      return { data: reportData };
    } catch (error) {
      console.error('Error generating activity summary report:', error);
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate activity summary report',
      };
    }
  }

  /**
   * Save report configuration
   */
  static async saveReportConfig(
    config: ReportConfig
  ): Promise<{ data?: ReportConfig; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('report_configs')
        .upsert({
          ...config,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data };
    } catch (error) {
      console.error('Error saving report config:', error);
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save report configuration',
      };
    }
  }

  /**
   * Get saved report configurations
   */
  static async getReportConfigs(
    userId?: string
  ): Promise<{ data?: ReportConfig[]; error?: string }> {
    try {
      let query = supabase
        .from('report_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return { data: data || [] };
    } catch (error) {
      console.error('Error fetching report configs:', error);
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch report configurations',
      };
    }
  }

  /**
   * Export report data to specified format
   */
  static async exportReport(
    reportData: any,
    format: ReportFormat,
    reportName: string
  ): Promise<ReportGenerationResult> {
    try {
      switch (format) {
        case 'json':
          return this.exportToJSON(reportData, reportName);
        case 'csv':
          return this.exportToCSV(reportData, reportName);
        case 'excel':
          return this.exportToExcel(reportData, reportName);
        case 'pdf':
          return this.exportToPDF(reportData, reportName);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to export report',
      };
    }
  }

  // Helper methods
  private static calculateDocumentStats(documents: any[]) {
    const stats = {
      total: documents.length,
      active: 0,
      expired: 0,
      expiring: 0,
      by_type: {} as Record<string, number>,
      compliance_score: 0,
    };

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    documents.forEach(doc => {
      // Count by status
      if (doc.status === 'active') stats.active++;
      if (doc.status === 'expired') stats.expired++;

      // Check expiring documents
      if (doc.expiry_date) {
        const expiryDate = new Date(doc.expiry_date);
        if (expiryDate < now) {
          stats.expired++;
        } else if (expiryDate <= in30Days) {
          stats.expiring++;
        }
      }

      // Count by type
      stats.by_type[doc.document_type] =
        (stats.by_type[doc.document_type] || 0) + 1;
    });

    // Calculate compliance score
    stats.compliance_score =
      documents.length > 0 ? (stats.active / documents.length) * 100 : 0;

    return stats;
  }

  private static calculateContractStats(contracts: any[]) {
    const stats = {
      total: contracts.length,
      active: 0,
      completed: 0,
      pending: 0,
      total_value: 0,
    };

    contracts.forEach(contract => {
      switch (contract.status) {
        case 'active':
          stats.active++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'pending':
          stats.pending++;
          break;
      }

      stats.total_value += contract.contract_value || 0;
    });

    return stats;
  }

  private static calculateComplianceScore(
    required: string[],
    submitted: string[],
    expired: string[]
  ): number {
    const submittedScore = (submitted.length / required.length) * 70;
    const expiryPenalty = (expired.length / required.length) * 30;
    return Math.max(0, submittedScore - expiryPenalty);
  }

  private static async calculateDocumentTypeStats(requiredDocs: string[]) {
    const stats = [];

    for (const docType of requiredDocs) {
      const { data: docs } = await supabase
        .from('company_documents')
        .select('status, expiry_date')
        .eq('document_type', docType);

      const total = docs?.length || 0;
      const expired =
        docs?.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date())
          .length || 0;
      const expiring =
        docs?.filter(
          d =>
            d.expiry_date &&
            new Date(d.expiry_date) > new Date() &&
            new Date(d.expiry_date) <=
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ).length || 0;

      stats.push({
        document_type: docType,
        total_required: total, // This should be calculated based on total companies
        total_submitted: total,
        submission_rate: 100, // This should be calculated properly
        expired_count: expired,
        expiring_count: expiring,
      });
    }

    return stats;
  }

  private static async getRecentActivity(companyId: string, limit: number) {
    // This would typically come from an audit log table
    // For now, we'll return simulated data
    return [
      {
        type: 'document_uploaded',
        description: 'Uploaded Commercial Registration',
        date: new Date().toISOString(),
      },
      {
        type: 'document_updated',
        description: 'Updated Business License expiry date',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  private static async generateExpiryTimeline(months: number) {
    // This would generate actual timeline data from the database
    // For now, we'll return simulated data
    const timeline = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      timeline.push({
        month: date.toISOString().slice(0, 7),
        expired: Math.floor(Math.random() * 20),
        expiring: Math.floor(Math.random() * 30),
        renewed: Math.floor(Math.random() * 25),
      });
    }

    return timeline;
  }

  private static async getActivitiesInPeriod(
    startDate: Date,
    endDate: Date,
    filters: ReportFilters
  ) {
    // This would fetch from actual audit logs
    // For now, we'll return simulated data
    return [
      {
        date: new Date().toISOString(),
        type: 'document_uploaded',
        description: 'Commercial Registration uploaded',
        company_name: 'ABC Trading LLC',
        user_name: 'John Doe',
        details: {},
      },
    ];
  }

  private static generateDailyActivityTrends(
    activities: any[],
    startDate: Date,
    endDate: Date
  ) {
    const dailyMap = new Map<string, number>();

    // Initialize all days with 0
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dailyMap.set(d.toISOString().slice(0, 10), 0);
    }

    // Count activities by day
    activities.forEach(activity => {
      const day = activity.date.slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
    });

    return Array.from(dailyMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  private static async exportToJSON(
    data: any,
    name: string
  ): Promise<ReportGenerationResult> {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    return {
      success: true,
      downloadUrl: url,
      metadata: {
        generatedAt: new Date(),
        format: 'json',
        size: blob.size,
        recordCount: Array.isArray(data) ? data.length : 1,
      },
    };
  }

  private static async exportToCSV(
    data: any,
    name: string
  ): Promise<ReportGenerationResult> {
    // Convert data to CSV format
    let csvContent = '';

    if (Array.isArray(data)) {
      if (data.length > 0) {
        // Get headers from first object
        const headers = Object.keys(data[0]);
        csvContent = `${headers.join(',')}\n`;

        // Add data rows
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string'
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          });
          csvContent += `${values.join(',')}\n`;
        });
      }
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    return {
      success: true,
      downloadUrl: url,
      metadata: {
        generatedAt: new Date(),
        format: 'csv',
        size: blob.size,
        recordCount: Array.isArray(data) ? data.length : 1,
      },
    };
  }

  private static async exportToExcel(
    data: any,
    name: string
  ): Promise<ReportGenerationResult> {
    // This would use a library like xlsx to generate Excel files
    // For now, we'll fall back to CSV
    return this.exportToCSV(data, name);
  }

  private static async exportToPDF(
    data: any,
    name: string
  ): Promise<ReportGenerationResult> {
    // This would use a library like jsPDF to generate PDF files
    // For now, we'll return a placeholder
    return {
      success: false,
      error: 'PDF export not yet implemented',
    };
  }
}
