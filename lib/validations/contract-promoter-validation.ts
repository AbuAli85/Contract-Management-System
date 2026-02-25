/**
 * Contract Promoter Validation
 * Ensures contracts have required promoter assignments
 */

export interface PromoterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ContractValidationInput {
  promoter_id?: string | null;
  contract_type?: string;
  status?: string;
  title?: string;
}

/**
 * Validates if a contract requires a promoter based on contract type and status
 */
export function validatePromoterRequirement(
  contract: ContractValidationInput
): PromoterValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Contract types that don't require promoters
  const exemptContractTypes = [
    'partnership',
    'consultancy',
    'consulting',
    'consulting-agreement',
    'service-agreement',
    'vendor',
  ];

  // Status values that allow missing promoters
  const exemptStatuses = ['draft'];

  // Check if this contract type requires a promoter
  const contractType = contract.contract_type?.toLowerCase() || '';
  const status = contract.status?.toLowerCase() || 'draft';
  const isExemptType = exemptContractTypes.some(type =>
    contractType.includes(type)
  );
  const isExemptStatus = exemptStatuses.includes(status);

  // Validation logic
  if (!contract.promoter_id) {
    if (isExemptType) {
      // Contract type doesn't require promoter
      warnings.push(
        `This ${contract.contract_type} contract does not require a promoter assignment.`
      );
    } else if (isExemptStatus) {
      // Draft contracts can be saved without promoters
      warnings.push(
        'This draft contract can be saved without a promoter, but one should be assigned before activation.'
      );
    } else {
      // ERROR: Active/Pending contracts of employment type MUST have promoters
      errors.push(
        `A promoter is required for ${contract.contract_type || 'employment'} contracts with status "${status}".`
      );
      errors.push(
        'Please select a promoter from the dropdown or change the contract status to "draft".'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Client-side validation hook for contract forms
 */
export function usePromoterValidation() {
  const validate = (contract: ContractValidationInput) => {
    return validatePromoterRequirement(contract);
  };

  return { validate };
}

/**
 * Server-side middleware for API validation
 */
export async function validateContractPromoter(
  contract: ContractValidationInput
): Promise<{ valid: boolean; message?: string }> {
  const result = validatePromoterRequirement(contract);

  if (!result.isValid) {
    return {
      valid: false,
      message: result.errors.join(' '),
    };
  }

  if (result.warnings.length > 0) {
    // Log warnings but allow creation
  }

  return { valid: true };
}

/**
 * Get suggested promoters for a contract based on criteria
 */
export async function getSuggestedPromoters(
  contractId: string
): Promise<any[]> {
  try {
    const response = await fetch('/api/admin/contracts-without-promoters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId, maxSuggestions: 5 }),
    });

    if (!response.ok) {
      throw new Error('Failed to get suggestions');
    }

    const data = await response.json();
    return data.success ? data.data.suggestions : [];
  } catch (error) {
    return [];
  }
}

/**
 * Validation rules summary
 */
export const PROMOTER_VALIDATION_RULES = {
  REQUIRED_FOR: [
    'employment',
    'full-time-permanent',
    'full-time-fixed',
    'part-time-permanent',
    'part-time-fixed',
    'temporary',
    'seasonal',
  ],
  NOT_REQUIRED_FOR: [
    'partnership',
    'consultancy',
    'consulting',
    'service-agreement',
    'vendor',
  ],
  EXEMPT_STATUSES: ['draft'],
  STRICT_STATUSES: ['active', 'pending', 'completed'],
};

/**
 * Helper: Check if a contract type requires a promoter
 */
export function doesContractTypeRequirePromoter(contractType: string): boolean {
  const type = contractType.toLowerCase();

  // Check if it's in the not-required list
  if (PROMOTER_VALIDATION_RULES.NOT_REQUIRED_FOR.some(t => type.includes(t))) {
    return false;
  }

  // Check if it's in the required list
  if (PROMOTER_VALIDATION_RULES.REQUIRED_FOR.some(t => type.includes(t))) {
    return true;
  }

  // Default: require promoter (safer)
  return true;
}

/**
 * Helper: Check if a status allows missing promoter
 */
export function doesStatusAllowMissingPromoter(status: string): boolean {
  return PROMOTER_VALIDATION_RULES.EXEMPT_STATUSES.includes(
    status.toLowerCase()
  );
}
