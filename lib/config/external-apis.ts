/**
 * External API Configuration
 * Centralized configuration for third-party integrations
 */

export interface ExternalAPIConfig {
  enabled: boolean;
  url?: string;
  apiKey?: string;
  secret?: string;
  timeout?: number;
}

/**
 * PDF Generator Configuration
 */
export const pdfGenerator: ExternalAPIConfig = {
  enabled: process.env.PDF_GENERATION_ENABLED === 'true',
  url: process.env.PDF_GENERATOR_URL,
  apiKey: process.env.PDF_GENERATOR_API_KEY,
  timeout: parseInt(process.env.PDF_GENERATOR_TIMEOUT || '30000'),
};

/**
 * Make.com Webhook Configuration
 */
export const makeWebhook: ExternalAPIConfig = {
  enabled: process.env.MAKE_WEBHOOK_ENABLED === 'true',
  url: process.env.MAKE_WEBHOOK_URL,
  secret: process.env.MAKE_WEBHOOK_SECRET,
  timeout: parseInt(process.env.MAKE_WEBHOOK_TIMEOUT || '10000'),
};

/**
 * All external APIs
 */
export const externalAPIs = {
  pdfGenerator,
  makeWebhook,
};

/**
 * Validate that an external API is configured and enabled
 */
export function validateExternalAPI(apiName: keyof typeof externalAPIs): void {
  const config = externalAPIs[apiName];

  if (!config.enabled) {
    throw new Error(
      `${apiName} is not enabled. Set ${apiName.toUpperCase()}_ENABLED=true in environment.`
    );
  }

  if (!config.url) {
    throw new Error(
      `${apiName} URL not configured. Set ${apiName.toUpperCase()}_URL in environment.`
    );
  }
}

/**
 * Check if an external API is available
 */
export function isAPIAvailable(apiName: keyof typeof externalAPIs): boolean {
  const config = externalAPIs[apiName];
  return config.enabled && !!config.url;
}
