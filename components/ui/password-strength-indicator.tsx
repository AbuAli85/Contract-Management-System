'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertTriangle, Shield, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  calculatePasswordStrength,
  PASSWORD_REQUIREMENTS,
  type PasswordStrength,
} from '@/lib/security/password-validation';
import { Progress } from './progress';
import { Badge } from './badge';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
  className,
}: PasswordStrengthIndicatorProps) {
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (password) {
      const result = calculatePasswordStrength(password);
      setStrength(result);
    } else {
      setStrength(null);
    }
  }, [password]);

  if (!password || !strength) {
    return null;
  }

  const getStrengthIcon = () => {
    if (strength.score === 0) return <ShieldAlert className="h-4 w-4" />;
    if (strength.score <= 2) return <AlertTriangle className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getStrengthColor = () => {
    if (strength.score === 0) return 'text-red-600 bg-red-50 border-red-200';
    if (strength.score === 1) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (strength.score === 2) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (strength.score === 3) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Password Strength:
            </span>
            <Badge
              variant="outline"
              className={cn('gap-1', getStrengthColor())}
            >
              {getStrengthIcon()}
              <span className="capitalize">{strength.label}</span>
            </Badge>
          </div>
          <span className="text-xs text-gray-500">
            {strength.percentage}%
          </span>
        </div>

        <Progress 
          value={strength.percentage} 
          className="h-2"
          indicatorClassName={cn(
            strength.score === 0 && 'bg-red-500',
            strength.score === 1 && 'bg-orange-500',
            strength.score === 2 && 'bg-yellow-500',
            strength.score === 3 && 'bg-green-500',
            strength.score === 4 && 'bg-emerald-500'
          )}
        />
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1.5 rounded-lg border bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-700 mb-2">
            Password Requirements:
          </p>
          {PASSWORD_REQUIREMENTS.map((requirement, index) => {
            const passed = strength.passedRequirements.includes(requirement.label);
            return (
              <div
                key={index}
                className={cn(
                  'flex items-center gap-2 text-xs transition-colors',
                  passed ? 'text-green-700' : 'text-gray-500'
                )}
              >
                {passed ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <X className="h-3.5 w-3.5 text-gray-400" />
                )}
                <span className={passed ? 'font-medium' : ''}>
                  {requirement.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Validation Message */}
      {!strength.isValid && password.length >= 3 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-medium mb-1">Password does not meet requirements</p>
            <ul className="list-disc list-inside space-y-0.5">
              {strength.failedRequirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Success Message */}
      {strength.isValid && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-xs font-medium text-green-800">
            Password meets all security requirements
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (password) {
      const result = calculatePasswordStrength(password);
      setStrength(result);
    } else {
      setStrength(null);
    }
  }, [password]);

  if (!password || !strength) {
    return null;
  }

  return (
    <div className="space-y-1">
      <Progress 
        value={strength.percentage} 
        className="h-1.5"
        indicatorClassName={cn(
          strength.score === 0 && 'bg-red-500',
          strength.score === 1 && 'bg-orange-500',
          strength.score === 2 && 'bg-yellow-500',
          strength.score === 3 && 'bg-green-500',
          strength.score === 4 && 'bg-emerald-500'
        )}
      />
      <p className="text-xs text-gray-600">
        Strength: <span className="font-medium capitalize">{strength.label}</span>
      </p>
    </div>
  );
}

