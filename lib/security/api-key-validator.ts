import { NextRequest } from 'next/server';
import { createHash, randomBytes } from 'crypto';

interface ApiKey {
  id: string;
  key: string;
  hashedKey: string;
  name: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
}

// In production, store this in a database
const apiKeys = new Map<string, ApiKey>();

export async function validateApiKey(request: NextRequest): Promise<boolean> {
  const apiKey =
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return false;
  }

  const hashedKey = hashApiKey(apiKey);

  for (const [id, keyData] of apiKeys.entries()) {
    if (keyData.hashedKey === hashedKey && keyData.isActive) {
      // Check expiration
      if (keyData.expiresAt && keyData.expiresAt < new Date()) {
        return false;
      }

      // Update last used
      keyData.lastUsedAt = new Date();
      apiKeys.set(id, keyData);

      return true;
    }
  }

  return false;
}

export function generateApiKey(
  name: string,
  permissions: string[] = [],
  expiresInDays?: number
): { key: string; id: string } {
  const key = generateSecureKey();
  const id = randomBytes(16).toString('hex');
  const hashedKey = hashApiKey(key);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  const apiKeyData: ApiKey = {
    id,
    key, // Store only temporarily for return
    hashedKey,
    name,
    permissions,
    isActive: true,
    createdAt: new Date(),
    expiresAt,
  };

  apiKeys.set(id, { ...apiKeyData, key: '' }); // Don't store the raw key

  return { key, id };
}

export function revokeApiKey(id: string): boolean {
  const apiKey = apiKeys.get(id);
  if (apiKey) {
    apiKey.isActive = false;
    apiKeys.set(id, apiKey);
    return true;
  }
  return false;
}

export function listApiKeys(): Omit<ApiKey, 'hashedKey' | 'key'>[] {
  return Array.from(apiKeys.values()).map(
    ({ hashedKey, key, ...rest }) => rest
  );
}

function generateSecureKey(): string {
  return `cms_${randomBytes(32).toString('hex')}`;
}

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// Predefined API key permissions
export const API_PERMISSIONS = {
  READ_CONTRACTS: 'contracts:read',
  WRITE_CONTRACTS: 'contracts:write',
  DELETE_CONTRACTS: 'contracts:delete',
  READ_USERS: 'users:read',
  WRITE_USERS: 'users:write',
  ADMIN: 'admin:all',
  UPLOAD_FILES: 'files:upload',
  WEBHOOK: 'webhook:receive',
} as const;

// Initialize some default API keys (remove in production)
if (process.env.NODE_ENV === 'development') {
  const { key: adminKey } = generateApiKey('Development Admin', [
    API_PERMISSIONS.ADMIN,
  ]);
  const { key: readOnlyKey } = generateApiKey('Development Read-Only', [
    API_PERMISSIONS.READ_CONTRACTS,
    API_PERMISSIONS.READ_USERS,
  ]);

  console.log('🔑 Development API Keys Generated:');
  console.log('Admin Key:', adminKey);
  console.log('Read-Only Key:', readOnlyKey);
}
