/**
 * Form Completion Hook
 * 
 * Tracks form completion percentage and provides visual feedback
 * Only shows indicator after user has started filling the form
 */

import { useState, useEffect, useMemo } from 'react';

export interface FormCompletionConfig {
  formData: Record<string, any>;
  requiredFields: string[];
  optionalFields?: string[];
  customValidators?: Record<string, (value: any) => boolean>;
}

export interface FormCompletionResult {
  completion: number;
  hasStarted: boolean;
  requiredCompleted: number;
  requiredTotal: number;
  optionalCompleted: number;
  optionalTotal: number;
  missingRequired: string[];
  status: 'not-started' | 'in-progress' | 'completed';
}

/**
 * Check if a field value is considered "filled"
 */
function isFieldFilled(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return false;
}

/**
 * Hook to track form completion
 * 
 * @example
 * ```tsx
 * const { completion, hasStarted, status, missingRequired } = useFormCompletion({
 *   formData: { name: 'John', email: '', phone: '123' },
 *   requiredFields: ['name', 'email'],
 *   optionalFields: ['phone', 'address']
 * });
 * ```
 */
export function useFormCompletion({
  formData,
  requiredFields,
  optionalFields = [],
  customValidators = {},
}: FormCompletionConfig): FormCompletionResult {
  const [hasStarted, setHasStarted] = useState(false);

  // Check if user has started filling the form
  useEffect(() => {
    if (!hasStarted) {
      const anyFieldFilled = Object.entries(formData).some(([key, value]) => 
        isFieldFilled(value)
      );

      if (anyFieldFilled) {
        setHasStarted(true);
      }
    }
  }, [formData, hasStarted]);

  // Calculate completion metrics
  const result = useMemo<FormCompletionResult>(() => {
    // Required fields completion
    const filledRequired = requiredFields.filter(field => {
      const value = formData[field];
      
      // Use custom validator if provided
      if (customValidators[field]) {
        return customValidators[field](value);
      }
      
      return isFieldFilled(value);
    });

    const missingRequired = requiredFields.filter(
      field => !filledRequired.includes(field)
    );

    // Optional fields completion
    const filledOptional = optionalFields.filter(field => {
      const value = formData[field];
      
      if (customValidators[field]) {
        return customValidators[field](value);
      }
      
      return isFieldFilled(value);
    });

    // Calculate overall completion percentage
    // Required fields count double toward completion
    const totalWeight = requiredFields.length * 2 + optionalFields.length;
    const completedWeight = filledRequired.length * 2 + filledOptional.length;
    const completion = totalWeight > 0 
      ? Math.round((completedWeight / totalWeight) * 100) 
      : 0;

    // Determine status
    let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';
    if (missingRequired.length === 0 && filledRequired.length > 0) {
      status = 'completed';
    } else if (hasStarted || filledRequired.length > 0) {
      status = 'in-progress';
    }

    return {
      completion,
      hasStarted,
      requiredCompleted: filledRequired.length,
      requiredTotal: requiredFields.length,
      optionalCompleted: filledOptional.length,
      optionalTotal: optionalFields.length,
      missingRequired,
      status,
    };
  }, [formData, requiredFields, optionalFields, customValidators, hasStarted]);

  return result;
}

/**
 * Hook variant that only tracks required fields
 */
export function useRequiredFieldsCompletion(
  formData: Record<string, any>,
  requiredFields: string[]
): { completion: number; hasStarted: boolean; isComplete: boolean } {
  const { completion, hasStarted, missingRequired } = useFormCompletion({
    formData,
    requiredFields,
  });

  return {
    completion: completion * 2, // Since we only track required, scale to 100%
    hasStarted,
    isComplete: missingRequired.length === 0,
  };
}

