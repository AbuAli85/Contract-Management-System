import { createClient } from '@/lib/supabase/server';

export interface GeneralContractData {
  contract_type: string;
  promoter_id: string;
  first_party_id: string;
  second_party_id: string;
  job_title: string;
  department: string;
  work_location: string;
  basic_salary: number;
  contract_start_date: string;
  contract_end_date: string;
  special_terms?: string;
  probation_period?: string;
  notice_period?: string;
  working_hours?: string;
  housing_allowance?: number;
  transport_allowance?: number;
  product_name?: string;
  service_description?: string;
  project_duration?: string;
  deliverables?: string;
  payment_terms?: string;
  termination_clause?: string;
  confidentiality_clause?: string;
  intellectual_property?: string;
  liability_insurance?: string;
  force_majeure?: string;
  // New bilingual fields for Make.com
  products_en?: string;
  products_ar?: string;
  location_en?: string;
  location_ar?: string;
  product_id?: string;
  location_id?: string;
}

export interface MakeComPayload {
  contract_id?: string;
  contract_number?: string;
  contract_type: string;
  promoter_id: string;
  first_party_id: string;
  second_party_id: string;
  job_title: string;
  department: string;
  work_location: string;
  basic_salary: number;
  contract_start_date: string;
  contract_end_date: string;
  special_terms?: string;
  probation_period?: string;
  notice_period?: string;
  working_hours?: string;
  housing_allowance?: number;
  transport_allowance?: number;
  product_name?: string;
  service_description?: string;
  project_duration?: string;
  deliverables?: string;
  payment_terms?: string;
  termination_clause?: string;
  confidentiality_clause?: string;
  intellectual_property?: string;
  liability_insurance?: string;
  force_majeure?: string;
  // New bilingual fields for Make.com
  products_en?: string;
  products_ar?: string;
  location_en?: string;
  location_ar?: string;
  product_id?: string;
  location_id?: string;
  // Additional fields for Make.com template
  promoter_name_en?: string;
  promoter_name_ar?: string;
  promoter_mobile_number?: string;
  promoter_email?: string;
  promoter_id_card_number?: string;
  promoter_id_card_url?: string;
  promoter_passport_url?: string;
  first_party_name_en?: string;
  first_party_name_ar?: string;
  first_party_crn?: string;
  first_party_logo?: string;
  second_party_name_en?: string;
  second_party_name_ar?: string;
  second_party_crn?: string;
  second_party_logo?: string;
  // Additional image fields for Make.com template compatibility
  header_logo?: string;
  footer_logo?: string;
  company_logo?: string;
  party_1_logo?: string;
  party_2_logo?: string;
  signature_1?: string;
  signature_2?: string;
  stamp_image?: string;
  qr_code?: string;
}

export class GeneralContractService {
  private supabase: any;

  constructor() {
    this.supabase = null;
  }

  /**
   * Type guard to ensure a value is a non-empty string
   */
  private isNonEmptyString(value: string | undefined): value is string {
    return typeof value === 'string' && value.length > 0;
  }

  private async getSupabaseClient() {
    if (!this.supabase) {
      // Use service role key for database operations to bypass RLS
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables for service role');
      }
      
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
      this.supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);
    }
    return this.supabase;
  }

  /**
   * Fetch promoters from Supabase
   */
  async fetchPromoters(): Promise<any[]> {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('promoters')
      .select('*')
      .eq('status', 'Active')
      .order('name_en');

    if (error) {
      console.error('Error fetching promoters:', error);
      throw new Error('Failed to fetch promoters');
    }

    return data || [];
  }

  /**
   * Fetch products from Supabase
   */
  async fetchProducts(): Promise<any[]> {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('name_en');

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }

    return data || [];
  }

  /**
   * Fetch locations from Supabase
   */
  async fetchLocations(): Promise<any[]> {
    const supabase = await this.getSupabaseClient();
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('status', 'active')
      .order('name_en');

    if (error) {
      console.error('Error fetching locations:', error);
      throw new Error('Failed to fetch locations');
    }

    return data || [];
  }

  /**
   * Create a general contract in the database
   */
  async createContract(data: GeneralContractData): Promise<any> {
    const supabase = await this.getSupabaseClient();
    
    // Generate contract number
    const contractNumber = this.generateContractNumber();
    
    // Map contract type to valid database values
    const mapContractType = (type: string): string => {
      const typeMap: Record<string, string> = {
        'general-service': 'service',
        'consulting-agreement': 'consultancy',
        'service-contract': 'service',
        'partnership-agreement': 'partnership',
        'employment': 'employment',
        'service': 'service',
        'consultancy': 'consultancy',
        'partnership': 'partnership',
      };
      return typeMap[type] || 'service'; // Default to 'service' for unknown types
    };
    
    const mappedContractType = mapContractType(data.contract_type);
    const contractData = {
      contract_type: mappedContractType,
      contract_number: contractNumber,
      title: `${data.job_title} - ${data.contract_type} Contract - ${contractNumber}`,
      status: 'draft',
      promoter_id: data.promoter_id,
      client_id: data.first_party_id,
      employer_id: data.second_party_id,
      value: data.basic_salary,
      start_date: this.formatDate(data.contract_start_date),
      end_date: this.formatDate(data.contract_end_date),
      terms: data.special_terms || '',
      description: this.buildDescription(data),
      // New bilingual fields for Make.com
      products_en: data.products_en || '',
      products_ar: data.products_ar || '',
      location_en: data.location_en || '',
      location_ar: data.location_ar || '',
      product_id: data.product_id || null,
      location_id: data.location_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: contract, error } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contract: ${error.message}`);
    }

    return contract;
  }

  /**
   * Get contract with all related data for Make.com
   */
  async getContractWithRelatedData(contractId: string): Promise<any> {
    const supabase = await this.getSupabaseClient();

    // Fetch contract data first
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError) {
      throw new Error(`Failed to fetch contract: ${contractError.message}`);
    }

    // Fetch related data separately to avoid foreign key relationship issues
    const [promoterResult, clientResult, employerResult] = await Promise.all([
      contract.promoter_id ? supabase.from('promoters').select('*').eq('id', contract.promoter_id).single() : Promise.resolve({ data: null, error: null }),
      contract.client_id ? supabase.from('parties').select('*').eq('id', contract.client_id).single() : Promise.resolve({ data: null, error: null }),
      contract.employer_id ? supabase.from('parties').select('*').eq('id', contract.employer_id).single() : Promise.resolve({ data: null, error: null })
    ]);

    // Combine the data
    return {
      ...contract,
      promoter: promoterResult.data,
      client: clientResult.data,
      employer: employerResult.data
    };
  }

  /**
   * Prepare payload for Make.com webhook
   */
  async prepareMakeComPayload(contractId: string): Promise<MakeComPayload> {
    const contract = await this.getContractWithRelatedData(contractId);
    
    // Helper function to ensure valid image URLs
    const ensureValidImageUrl = (url: string | null | undefined): string => {
      if (!url || url.trim() === '') {
        return 'https://via.placeholder.com/200x200/cccccc/666666.png?text=No+Image';
      }
      // Basic URL validation
      try {
        new URL(url);
        return url;
      } catch {
        return 'https://via.placeholder.com/200x200/cccccc/666666.png?text=Invalid+URL';
      }
    };
    
    const payload: MakeComPayload = {
      contract_id: contract.id,
      contract_number: contract.contract_number,
      contract_type: contract.contract_type,
      promoter_id: contract.promoter_id,
      first_party_id: contract.client_id,
      second_party_id: contract.employer_id,
      job_title: this.extractJobTitle(contract.title),
      department: this.extractDepartment(contract.description),
      work_location: this.extractWorkLocation(contract.description),
      basic_salary: contract.value || 0,
      contract_start_date: contract.start_date,
      contract_end_date: contract.end_date,
      special_terms: contract.terms,
      // New bilingual fields for Make.com
      products_en: contract.products_en || '',
      products_ar: contract.products_ar || '',
      location_en: contract.location_en || '',
      location_ar: contract.location_ar || '',
      product_id: contract.product_id || '',
      location_id: contract.location_id || '',
      // Promoter data with validated image URLs
      promoter_name_en: contract.promoter?.name_en || '',
      promoter_name_ar: contract.promoter?.name_ar || '',
      promoter_mobile_number: contract.promoter?.mobile_number || '',
      promoter_email: contract.promoter?.email || '',
      promoter_id_card_number: contract.promoter?.id_card_number || '',
      promoter_id_card_url: ensureValidImageUrl(contract.promoter?.id_card_url),
      promoter_passport_url: ensureValidImageUrl(contract.promoter?.passport_url),
      // First party (client) data with validated image URLs
      first_party_name_en: contract.client?.name_en || '',
      first_party_name_ar: contract.client?.name_ar || '',
      first_party_crn: contract.client?.crn || '',
      first_party_logo: ensureValidImageUrl(contract.client?.logo_url),
      // Second party (employer) data with validated image URLs
      second_party_name_en: contract.employer?.name_en || '',
      second_party_name_ar: contract.employer?.name_ar || '',
      second_party_crn: contract.employer?.crn || '',
      second_party_logo: ensureValidImageUrl(contract.employer?.logo_url),
      // Additional image fields for Make.com template compatibility
      header_logo: ensureValidImageUrl(contract.employer?.logo_url), // Use employer logo as header
      footer_logo: ensureValidImageUrl(contract.employer?.logo_url), // Use employer logo as footer
      company_logo: ensureValidImageUrl(contract.employer?.logo_url), // Use employer logo as company logo
      party_1_logo: ensureValidImageUrl(contract.client?.logo_url), // Client logo
      party_2_logo: ensureValidImageUrl(contract.employer?.logo_url), // Employer logo
      signature_1: 'https://via.placeholder.com/200x100/cccccc/666666.png?text=Signature+1', // Placeholder signature
      signature_2: 'https://via.placeholder.com/200x100/cccccc/666666.png?text=Signature+2', // Placeholder signature
      stamp_image: 'https://via.placeholder.com/150x150/cccccc/666666.png?text=Stamp', // Placeholder stamp
      qr_code: 'https://via.placeholder.com/100x100/cccccc/666666.png?text=QR+Code', // Placeholder QR code
    };

    return payload;
  }

  /**
   * Trigger Make.com webhook for general contract generation
   */
  async triggerMakeComWebhook(contractId: string): Promise<boolean> {
    try {
      console.log('🔄 Starting Make.com webhook trigger for contract:', contractId);
      
      const payload = await this.prepareMakeComPayload(contractId);
      console.log('✅ Payload prepared successfully');
      
      // Use the specific general contract webhook URL
      const makecomWebhookUrl = process.env.MAKECOM_WEBHOOK_URL_GENERAL || 'https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz';
      console.log('🔗 Webhook URL:', makecomWebhookUrl);
      
      if (!makecomWebhookUrl) {
        console.warn('⚠️ MAKECOM_WEBHOOK_URL_GENERAL not configured');
        return false;
      }

      const webhookSecret = process.env.MAKE_WEBHOOK_SECRET || '';
      console.log('🔐 Webhook secret configured:', webhookSecret ? 'Yes' : 'No');

      console.log('📤 Sending webhook request...');
      
      // Use Node.js built-in modules for HTTP request
      const https = require('https');
      const http = require('http');
      const { URL } = require('url');
      
      const postData = JSON.stringify(payload);
      const url = new URL(makecomWebhookUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-Webhook-Secret': webhookSecret,
        }
      };

      const response = await new Promise<{
        status: number | undefined;
        statusText: string | undefined;
        ok: boolean;
        data: string;
      }>((resolve, reject) => {
        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(options, (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => {
            data += chunk;
          });
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              statusText: res.statusMessage,
              ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
              data: data
            });
          });
        });

        req.on('error', (err: any) => {
          reject(err);
        });

        req.write(postData);
        req.end();
      });

      console.log('📥 Webhook response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data: response.data
      });

      if (response.ok) {
        console.log('✅ Make.com webhook triggered successfully for general contract');
        
        // Update contract status
        console.log('🔄 Updating contract status to processing...');
        const supabase = await this.getSupabaseClient();
        const { error: updateError } = await supabase
          .from('contracts')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', contractId);
        
        if (updateError) {
          console.error('❌ Failed to update contract status:', updateError);
        } else {
          console.log('✅ Contract status updated to processing');
        }
        
        return true;
      } else {
        console.error('❌ Make.com webhook failed:', {
          status: response.status,
          statusText: response.statusText,
          error: response.data
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Make.com webhook error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return false;
    }
  }

  /**
   * Update contract with Make.com results
   */
  async updateContractWithMakeComResults(
    contractId: string, 
    results: {
      pdf_url?: string;
      google_drive_url?: string;
      status?: string;
      images_processed?: {
        id_card: boolean;
        passport: boolean;
      };
    }
  ): Promise<void> {
    const supabase = await this.getSupabaseClient();
    
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (results.pdf_url) updateData.pdf_url = results.pdf_url;
    if (results.google_drive_url) updateData.document_url = results.google_drive_url;
    if (results.status) updateData.status = results.status;

    const { error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId);

    if (error) {
      console.error('❌ Failed to update contract with Make.com results:', error);
      throw new Error(`Failed to update contract: ${error.message}`);
    }
  }

  /**
   * Generate contract number for general contracts
   */
  private generateContractNumber(): string {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `GEN-${day}${month}${year}-${random}`;
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(dateString: string | undefined): string {
    const defaultDate = new Date().toISOString().split('T')[0] || '2024-01-01';
    
    if (!this.isNonEmptyString(dateString)) {
      return defaultDate;
    }
    
    // At this point, dateString is guaranteed to be a non-empty string
    const date = dateString as string;
    
    if (date.includes('-')) {
      const parts = date.split('-');
      if (parts[0] && parts[0].length === 4) {
        return date; // Already in YYYY-MM-DD format
      } else {
        return parts.reverse().join('-'); // Convert DD-MM-YYYY to YYYY-MM-DD
      }
    }
    
    try {
      const formattedDate = new Date(date).toISOString().split('T')[0];
      return formattedDate || defaultDate;
    } catch {
      return defaultDate;
    }
  }

  /**
   * Build description from contract data
   */
  private buildDescription(data: GeneralContractData): string {
    const parts: string[] = [];
    
    if (data.department) parts.push(`Department: ${data.department}`);
    if (data.work_location) parts.push(`Work Location: ${data.work_location}`);
    if (data.product_name) parts.push(`Product/Service: ${data.product_name}`);
    if (data.service_description) parts.push(`Service Description: ${data.service_description}`);
    if (data.project_duration) parts.push(`Project Duration: ${data.project_duration}`);
    if (data.deliverables) parts.push(`Deliverables: ${data.deliverables}`);
    if (data.payment_terms) parts.push(`Payment Terms: ${data.payment_terms}`);
    
    return parts.join('\n');
  }

  /**
   * Extract job title from contract title
   */
  private extractJobTitle(title: string | undefined): string {
    if (!title) return '';
    const parts = title.split(' - ');
    return parts[0] || '';
  }

  /**
   * Extract department from description
   */
  private extractDepartment(description: string | undefined): string {
    if (!this.isNonEmptyString(description)) return '';
    const match = description.match(/Department:\s*(.+)/);
    if (match && match[1] && match[1].length > 0) {
      // At this point, match[1] is guaranteed to be a string
      const department = match[1] as string;
      const firstLine = department.split('\n')[0];
      return firstLine ? firstLine.trim() : '';
    }
    return '';
  }

  /**
   * Extract work location from description
   */
  private extractWorkLocation(description: string | undefined): string {
    if (!this.isNonEmptyString(description)) return '';
    const match = description.match(/Work Location:\s*(.+)/);
    if (match && match[1] && match[1].length > 0) {
      // At this point, match[1] is guaranteed to be a string
      const location = match[1] as string;
      const firstLine = location.split('\n')[0];
      return firstLine ? firstLine.trim() : '';
    }
    return '';
  }
}

// Export singleton instance
export const generalContractService = new GeneralContractService();
// TypeScript fixes applied
