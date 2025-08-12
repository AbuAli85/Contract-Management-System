import { createClient } from '@/lib/supabase/server';
import { createHash, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import CryptoJS from 'crypto-js';

const scryptAsync = promisify(scrypt);

export class DataEncryption {
  private readonly encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.DATA_ENCRYPTION_KEY || this.generateKey();

    if (!process.env.DATA_ENCRYPTION_KEY) {
      console.warn(
        '⚠️ No DATA_ENCRYPTION_KEY found in environment. Using generated key.'
      );
      console.warn('🔐 Generated encryption key:', this.encryptionKey);
      console.warn(
        `📝 Add this to your .env.local: DATA_ENCRYPTION_KEY=${
          this.encryptionKey
        }`
      );
    }
  }

  // Encrypt sensitive data
  encrypt(data: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        data,
        this.encryptionKey
      ).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  decrypt(encryptedData: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData,
        this.encryptionKey
      ).toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Hash passwords and sensitive data
  async hashData(
    data: string,
    salt?: string
  ): Promise<{ hash: string; salt: string }> {
    const useSalt = salt || randomBytes(16).toString('hex');
    const hash = (await scryptAsync(data, useSalt, 64)) as Buffer;
    return {
      hash: hash.toString('hex'),
      salt: useSalt,
    };
  }

  // Verify hashed data
  async verifyHash(data: string, hash: string, salt: string): Promise<boolean> {
    const { hash: newHash } = await this.hashData(data, salt);
    return newHash === hash;
  }

  // Generate secure tokens
  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  // Hash data for indexing (one-way)
  hashForIndex(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private generateKey(): string {
    return randomBytes(32).toString('hex');
  }
}

export class DatabaseSecurity {
  private dataEncryption: DataEncryption;

  constructor() {
    this.dataEncryption = new DataEncryption();
  }

  // Encrypt sensitive fields before storing
  async encryptSensitiveFields(
    data: any,
    fieldsToEncrypt: string[]
  ): Promise<any> {
    const encrypted = { ...data };

    for (const field of fieldsToEncrypt) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = this.dataEncryption.encrypt(encrypted[field]);
        encrypted[`${field}_encrypted`] = true;
      }
    }

    return encrypted;
  }

  // Decrypt sensitive fields after retrieving
  async decryptSensitiveFields(
    data: any,
    fieldsToDecrypt: string[]
  ): Promise<any> {
    const decrypted = { ...data };

    for (const field of fieldsToDecrypt) {
      if (decrypted[field] && decrypted[`${field}_encrypted`]) {
        try {
          decrypted[field] = this.dataEncryption.decrypt(decrypted[field]);
          delete decrypted[`${field}_encrypted`];
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          decrypted[field] = '[DECRYPTION_FAILED]';
        }
      }
    }

    return decrypted;
  }

  // Create audit trail for data changes
  async createAuditTrail(
    tableName: string,
    recordId: string,
    action: 'INSERT' | 'UPDATE' | 'DELETE',
    oldData?: any,
    newData?: any,
    userId?: string
  ): Promise<void> {
    try {
      const supabase = await createClient();

      await supabase.from('audit_logs').insert({
        table_name: tableName,
        record_id: recordId,
        action,
        old_data: oldData,
        new_data: newData,
        user_id: userId,
        created_at: new Date().toISOString(),
        ip_address: 'server', // Add IP tracking if needed
        user_agent: 'system',
      });
    } catch (error) {
      console.error('Failed to create audit trail:', error);
    }
  }

  // Secure query builder with automatic encryption
  async secureInsert(
    tableName: string,
    data: any,
    sensitiveFields: string[] = [],
    userId?: string
  ): Promise<any> {
    try {
      const supabase = await createClient();

      // Encrypt sensitive fields
      const encryptedData = await this.encryptSensitiveFields(
        data,
        sensitiveFields
      );

      const { data: result, error } = await supabase
        .from(tableName)
        .insert(encryptedData)
        .select()
        .single();

      if (error) throw error;

      // Create audit trail
      await this.createAuditTrail(
        tableName,
        result.id,
        'INSERT',
        null,
        data,
        userId
      );

      // Return decrypted data
      return await this.decryptSensitiveFields(result, sensitiveFields);
    } catch (error) {
      console.error('Secure insert failed:', error);
      throw error;
    }
  }

  // Secure query with automatic decryption
  async secureSelect(
    tableName: string,
    filters: any = {},
    sensitiveFields: string[] = []
  ): Promise<any[]> {
    try {
      const supabase = await createClient();

      let query = supabase.from(tableName).select('*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query;

      if (error) throw error;

      // Decrypt sensitive fields
      const decryptedData = await Promise.all(
        (data || []).map(item =>
          this.decryptSensitiveFields(item, sensitiveFields)
        )
      );

      return decryptedData;
    } catch (error) {
      console.error('Secure select failed:', error);
      throw error;
    }
  }

  // Secure update with encryption and audit
  async secureUpdate(
    tableName: string,
    id: string,
    data: any,
    sensitiveFields: string[] = [],
    userId?: string
  ): Promise<any> {
    try {
      const supabase = await createClient();

      // Get old data for audit
      const { data: oldData } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      // Encrypt sensitive fields
      const encryptedData = await this.encryptSensitiveFields(
        data,
        sensitiveFields
      );

      const { data: result, error } = await supabase
        .from(tableName)
        .update(encryptedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Create audit trail
      await this.createAuditTrail(
        tableName,
        id,
        'UPDATE',
        oldData,
        data,
        userId
      );

      // Return decrypted data
      return await this.decryptSensitiveFields(result, sensitiveFields);
    } catch (error) {
      console.error('Secure update failed:', error);
      throw error;
    }
  }
}

// Sensitive field configurations for different tables
export const SENSITIVE_FIELDS = {
  contracts: ['contract_details', 'terms', 'financial_details'],
  parties: ['phone', 'address', 'tax_id', 'bank_details'],
  promoters: ['phone', 'commission_details', 'payment_info'],
  users: ['phone', 'address', 'emergency_contact'],
  documents: ['file_path', 'signed_url'],
} as const;

// Initialize encryption service
export const dataEncryption = new DataEncryption();
export const databaseSecurity = new DatabaseSecurity();

// Utility functions for common encryption tasks
export const encryptionUtils = {
  // Encrypt personal data
  encryptPersonalData: (data: string) => dataEncryption.encrypt(data),

  // Decrypt personal data
  decryptPersonalData: (encryptedData: string) =>
    dataEncryption.decrypt(encryptedData),

  // Generate secure random passwords
  generateSecurePassword: (length: number = 16) => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  },

  // Create secure session tokens
  generateSessionToken: () => dataEncryption.generateSecureToken(64),

  // Hash sensitive data for searching
  hashForSearch: (data: string) =>
    dataEncryption.hashForIndex(data.toLowerCase().trim()),
};
